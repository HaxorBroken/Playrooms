import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ref, update } from 'firebase/database'
import { useAuth } from '../../../hooks/useAuth'
import { useVoiceChat } from '../../../hooks/useVoiceChat'
import { rtdb } from '../../../firebase/config'
import {
  subscribeToRoom, subscribeToGameState, updateGameState,
  pushPlayerAction, subscribeToActions, endGame
} from '../../../firebase/services'
import {
  initCallBridgeGame, processBid, processSelectTrump,
  processPlayCard, startNewRound, getValidPlays,
  getSuitSymbol, getSuitColor
} from '../../../utils/callBridgeEngine'
import PlayingCard from './PlayingCard'
import VoicePanel from '../../ui/VoicePanel'
import { Home } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CallBridgeGame({ roomId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [roomData, setRoomData] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [selectedBid, setSelectedBid] = useState(null)
  const processedActionsRef = useRef(new Set())
  const isHostRef = useRef(false)

  const players = roomData?.players ? Object.values(roomData.players) : []
  const { isMuted, isConnected, voiceEnabled, enableVoice, toggleMute } = useVoiceChat(roomId, players)

  useEffect(() => {
    const unsubRoom = subscribeToRoom(roomId, (data) => {
      if (!data) return
      setRoomData(data)
      const myPlayer = data.players?.[user.uid]
      isHostRef.current = myPlayer?.isHost || false

      if (isHostRef.current && !data.gameInitialized) {
        initGame(data)
      }
    })

    const unsubGame = subscribeToGameState(roomId, (state) => {
      if (state) setGameState(state)
    })

    return () => { unsubRoom(); unsubGame() }
  }, [roomId, user.uid])

  useEffect(() => {
    const unsubActions = subscribeToActions(roomId, (actions) => {
      for (const action of actions) {
        if (processedActionsRef.current.has(action.key)) continue
        processedActionsRef.current.add(action.key)
        handleRemoteAction(action)
      }
    })
    return unsubActions
  }, [roomId, gameState])

  const initGame = async (data) => {
    const playersList = Object.values(data.players || {})
    if (playersList.length !== 4) return

    const state = initCallBridgeGame(playersList)
    await updateGameState(roomId, state)
    await update(ref(rtdb, `rooms/${roomId}`), { gameInitialized: true })
  }

  const handleRemoteAction = useCallback((action) => {
    if (action.playerId === user.uid) return

    setGameState(prev => {
      if (!prev) return prev

      if (action.type === 'bid') return processBid(prev, action.playerId, action.bid)
      if (action.type === 'trump') return processSelectTrump(prev, action.playerId, action.suit)
      if (action.type === 'play') return processPlayCard(prev, action.playerId, action.cardId)
      if (action.type === 'next-round') return startNewRound(prev)

      return prev
    })
  }, [user.uid])

  const myPlayerState = gameState?.players?.find(p => p.uid === user.uid)
  const isMyTurn = gameState?.players?.[gameState?.currentPlayerIndex]?.uid === user.uid
  const currentPlayer = gameState?.players?.[gameState?.currentPlayerIndex]

  const validPlays = gameState && myPlayerState && gameState.phase === 'playing'
    ? getValidPlays(myPlayerState.hand || [], gameState.leadSuit, gameState.trumpSuit)
    : []

  const handleBid = useCallback(async () => {
    if (!isMyTurn || selectedBid === null || !gameState) return

    const newState = processBid(gameState, user.uid, selectedBid)
    setGameState(newState)
    await updateGameState(roomId, newState)
    await pushPlayerAction(roomId, { type: 'bid', playerId: user.uid, bid: selectedBid, timestamp: Date.now() })
    setSelectedBid(null)
    toast(`You bid ${selectedBid}`)
  }, [isMyTurn, selectedBid, gameState, user.uid, roomId])

  const handleSelectTrump = useCallback(async (suit) => {
    if (!gameState) return

    const newState = processSelectTrump(gameState, user.uid, suit)
    setGameState(newState)
    await updateGameState(roomId, newState)
    await pushPlayerAction(roomId, { type: 'trump', playerId: user.uid, suit, timestamp: Date.now() })
    toast(`Trump set to ${suit}`)
  }, [gameState, user.uid, roomId])

  const handlePlayCard = useCallback(async (card) => {
    if (!isMyTurn || gameState?.phase !== 'playing') return

    const isValid = validPlays.some(c => c.id === card.id)
    if (!isValid) {
      toast.error('Invalid move — you must follow suit or play trump')
      return
    }

    const newState = processPlayCard(gameState, user.uid, card.id)
    setGameState(newState)
    await updateGameState(roomId, newState)
    await pushPlayerAction(roomId, { type: 'play', playerId: user.uid, cardId: card.id, timestamp: Date.now() })

    if (newState.phase === 'finished') {
      toast.success('🏆 Game over!')
      await endGame(roomId)
    }
  }, [isMyTurn, gameState, user.uid, roomId, validPlays])

  const handleNextRound = useCallback(async () => {
    const newState = startNewRound(gameState)
    setGameState(newState)
    await updateGameState(roomId, newState)
    await pushPlayerAction(roomId, { type: 'next-round', playerId: user.uid, timestamp: Date.now() })
  }, [gameState, user.uid, roomId])

  if (!gameState) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-neon-purple border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-display text-neon-purple text-xs tracking-widest">DEALING CARDS</p>
        </div>
      </div>
    )
  }

  if (gameState.phase === 'finished') {
    const winner = gameState.players?.find(p => p.uid === gameState.winner)
    return (
      <GameOverScreen
        players={gameState.players}
        winner={winner}
        isWinner={gameState.winner === user.uid}
        onLeave={() => navigate('/lobby')}
      />
    )
  }

  if (gameState.phase === 'round-end') {
    return (
      <RoundEndScreen
        players={gameState.players}
        round={gameState.round}
        isHost={isHostRef.current}
        onNextRound={handleNextRound}
        targetScore={gameState.targetScore}
      />
    )
  }

  const isTrumpSelector = gameState.phase === 'trump-selection' && currentPlayer?.uid === user.uid

  return (
    <div className="min-h-screen bg-void grid-bg flex flex-col">
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/lobby')} className="text-gray-600 hover:text-white p-2">
            <Home size={18} />
          </button>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-gray-500">Round {gameState.round}</span>
            {gameState.trumpSuit && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg font-display text-sm font-bold ${getSuitColor(gameState.trumpSuit).replace('text-', 'text-')}`}>
                <span>Trump:</span>
                <span className={getSuitColor(gameState.trumpSuit)}>{getSuitSymbol(gameState.trumpSuit)}</span>
              </div>
            )}
            <span className="font-mono text-xs text-gray-500 uppercase">{gameState.phase}</span>
          </div>

          <VoicePanel isMuted={isMuted} isConnected={isConnected} voiceEnabled={voiceEnabled} onEnable={enableVoice} onToggleMute={toggleMute} />
        </div>

        <div className="grid grid-cols-4 gap-3">
          {gameState.players?.map(player => (
            <PlayerScoreCard
              key={player.uid}
              player={player}
              isCurrentTurn={currentPlayer?.uid === player.uid}
              isMe={player.uid === user.uid}
              phase={gameState.phase}
            />
          ))}
        </div>

        {gameState.currentTrick?.length > 0 && (
          <div className="flex items-center justify-center gap-4">
            <p className="font-mono text-xs text-gray-500 uppercase">Current Trick</p>
            <div className="flex gap-2">
              {gameState.currentTrick.map(({ playerId, card }) => {
                const p = gameState.players?.find(pl => pl.uid === playerId)
                return (
                  <div key={playerId} className="flex flex-col items-center gap-1">
                    <PlayingCard card={card} small />
                    <span className="font-mono text-xs text-gray-600 truncate max-w-12">{p?.name?.split(' ')[0]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {gameState.phase === 'bidding' && isMyTurn && (
          <BiddingPanel
            onBid={handleBid}
            selectedBid={selectedBid}
            setSelectedBid={setSelectedBid}
            maxBid={myPlayerState?.hand?.length || 13}
          />
        )}

        {gameState.phase === 'bidding' && !isMyTurn && (
          <div className="text-center py-4">
            <p className="font-display text-gray-500 text-sm tracking-wider">
              Waiting for <span className="text-white">{currentPlayer?.name}</span> to bid...
            </p>
          </div>
        )}

        {isTrumpSelector && (
          <TrumpSelector onSelect={handleSelectTrump} />
        )}

        {gameState.phase === 'trump-selection' && !isTrumpSelector && (
          <div className="text-center py-4">
            <p className="font-display text-gray-500 text-sm tracking-wider">
              <span className="text-white">{currentPlayer?.name}</span> is selecting trump...
            </p>
          </div>
        )}

        <div className="flex-1 flex items-end pb-2">
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isMyTurn && gameState.phase === 'playing' ? 'bg-neon-green animate-pulse' : 'bg-gray-700'}`} />
                <span className="font-mono text-xs text-gray-500">
                  {isMyTurn && gameState.phase === 'playing' ? 'YOUR TURN' : `${currentPlayer?.name?.toUpperCase()}`}
                </span>
              </div>
              <span className="font-mono text-xs text-gray-600">
                Bid: {myPlayerState?.bid ?? '?'} | Won: {myPlayerState?.tricksWon || 0}
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              <AnimatePresence>
                {myPlayerState?.hand?.map((card, i) => {
                  const isValid = validPlays.some(c => c.id === card.id)
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <PlayingCard
                        card={card}
                        onClick={() => handlePlayCard(card)}
                        playable={isMyTurn && gameState.phase === 'playing' ? isValid : false}
                      />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlayerScoreCard({ player, isCurrentTurn, isMe, phase }) {
  return (
    <motion.div
      className={`glass rounded-xl p-3 border transition-all text-center ${
        isCurrentTurn ? 'border-neon-gold/60 bg-neon-gold/5' : isMe ? 'border-neon-cyan/30' : 'border-border'
      }`}
    >
      <img
        src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.uid}`}
        className="w-8 h-8 rounded-full border border-border mx-auto mb-1.5"
        alt={player.name}
      />
      <p className="font-body text-white text-xs font-semibold truncate">{player.name.split(' ')[0]}</p>
      <p className="font-display text-neon-gold text-lg font-black">{player.totalScore || 0}</p>
      {phase !== 'bidding' && (
        <div className="flex justify-center gap-1 mt-1">
          <span className="font-mono text-xs text-gray-500">{player.tricksWon || 0}</span>
          <span className="font-mono text-xs text-gray-700">/</span>
          <span className="font-mono text-xs text-gray-400">{player.bid ?? '?'}</span>
        </div>
      )}
      {phase === 'bidding' && player.bid !== null && (
        <span className="font-mono text-xs text-neon-green">Bid: {player.bid}</span>
      )}
    </motion.div>
  )
}

function BiddingPanel({ onBid, selectedBid, setSelectedBid, maxBid }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass neon-border-purple rounded-2xl p-5 space-y-4"
    >
      <p className="font-display text-white text-sm font-bold tracking-wider text-center">PLACE YOUR BID</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: maxBid + 1 }, (_, i) => i).map(n => (
          <button
            key={n}
            onClick={() => setSelectedBid(n)}
            className={`w-10 h-10 rounded-lg font-display font-bold text-sm border transition-all ${
              selectedBid === n
                ? 'border-neon-purple text-neon-purple bg-neon-purple/20'
                : 'border-border text-gray-400 hover:border-gray-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        onClick={onBid}
        disabled={selectedBid === null}
        className={`w-full font-display text-sm font-bold tracking-wider py-3 rounded-xl border transition-all ${
          selectedBid !== null
            ? 'border-neon-purple text-neon-purple bg-neon-purple/10 hover:bg-neon-purple/20'
            : 'border-border text-gray-600 cursor-not-allowed'
        }`}
      >
        {selectedBid !== null ? `Confirm Bid: ${selectedBid}` : 'Select a bid'}
      </button>
    </motion.div>
  )
}

function TrumpSelector({ onSelect }) {
  const suits = ['spades', 'hearts', 'diamonds', 'clubs']
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass neon-border-purple rounded-2xl p-6 space-y-4 text-center"
    >
      <p className="font-display text-white text-sm font-bold tracking-wider">SELECT TRUMP SUIT</p>
      <div className="flex justify-center gap-4">
        {suits.map(suit => (
          <motion.button
            key={suit}
            onClick={() => onSelect(suit)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-3xl border-2 border-transparent hover:border-neon-purple transition-all shadow-lg`}
          >
            <span className={getSuitColor(suit)}>{getSuitSymbol(suit)}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

function RoundEndScreen({ players, round, isHost, onNextRound, targetScore }) {
  const sorted = [...players].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))

  return (
    <div className="min-h-screen bg-void grid-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass neon-border-purple rounded-2xl p-8 w-full max-w-md space-y-6"
      >
        <p className="font-display text-white text-xl font-black text-center tracking-wider">ROUND {round} COMPLETE</p>

        <div className="space-y-3">
          {sorted.map((player, i) => (
            <div key={player.uid} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
              <span className="font-display text-neon-gold text-lg font-black w-5">{i + 1}</span>
              <img
                src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.uid}`}
                className="w-8 h-8 rounded-full border border-border"
              />
              <div className="flex-1">
                <p className="font-body text-white text-sm font-semibold">{player.name}</p>
                <p className="font-mono text-xs text-gray-500">Bid {player.bid} | Won {player.tricksWon}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-neon-green font-black">+{player.score > 0 ? player.score : 0}</p>
                <p className="font-display text-white text-lg font-black">{player.totalScore || 0}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center font-mono text-xs text-gray-500">Target: {targetScore} points</p>

        {isHost && (
          <button onClick={onNextRound} className="btn-gold w-full">
            Start Next Round →
          </button>
        )}
        {!isHost && (
          <p className="text-center font-body text-gray-500 text-sm">Waiting for host to start next round...</p>
        )}
      </motion.div>
    </div>
  )
}

function GameOverScreen({ players, winner, isWinner, onLeave }) {
  const sorted = [...players].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))

  return (
    <div className="min-h-screen bg-void grid-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass neon-border rounded-2xl p-10 w-full max-w-md space-y-6 text-center"
      >
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl"
        >
          {isWinner ? '🏆' : '🃏'}
        </motion.div>

        <div>
          <p className="font-display text-3xl font-black text-white">{isWinner ? 'YOU WIN!' : 'GAME OVER'}</p>
          <p className="text-gray-400 font-body mt-1">{winner?.name} reached {winner?.totalScore} points</p>
        </div>

        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div key={p.uid} className="flex items-center justify-between px-3 py-2 bg-surface rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-600 w-4">{i + 1}</span>
                <span className="font-body text-sm text-white">{p.name}</span>
              </div>
              <span className="font-display font-bold text-neon-gold">{p.totalScore}</span>
            </div>
          ))}
        </div>

        <button onClick={onLeave} className="btn-primary w-full">Back to Lobby</button>
      </motion.div>
    </div>
  )
}
