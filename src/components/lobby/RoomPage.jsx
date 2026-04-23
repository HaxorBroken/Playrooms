import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRoom } from '../../hooks/useRoom'
import { useAuth } from '../../hooks/useAuth'
import { useVoiceChat } from '../../hooks/useVoiceChat'
import {
  ArrowLeft, Copy, Check, Crown, Mic, MicOff, Play,
  PhoneCall, Users, LogOut, Wifi, WifiOff, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function RoomPage() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const { roomData, leaveRoom, toggleReady, startGame, initRoomFromUrl } = useRoom()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [leaving, setLeaving] = useState(false)

  // FIXED: seed currentRoom from URL if store is empty (handles page refresh)
  useEffect(() => {
    initRoomFromUrl(roomId)
  }, [roomId])

  const players = roomData?.players ? Object.values(roomData.players) : []
  const maxPlayers = roomData?.maxPlayers || 2
  const myPlayer = players.find(p => p.uid === user?.uid)
  const isHost = myPlayer?.isHost || false
  const isCallBridge = roomData?.gameType === 'callbridge'
  const enoughPlayers = isCallBridge ? players.length === 4 : players.length >= 2
  const nonHostPlayers = players.filter(p => !p.isHost)
  const allReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.isReady)
  const canStart = isHost && allReady && enoughPlayers

  const { isMuted, voiceEnabled, enableVoice, toggleMute } = useVoiceChat(roomId, players)

  const handleLeave = async () => {
    setLeaving(true)
    await leaveRoom()
  }

  const copyInviteCode = () => {
    if (roomData?.inviteCode) {
      navigator.clipboard.writeText(roomData.inviteCode)
      setCopied(true)
      toast.success('Invite code copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    setCopiedId(true)
    toast.success('Room ID copied!')
    setTimeout(() => setCopiedId(false), 2000)
  }

  const gameLabel = roomData?.gameType === 'callbridge' ? 'Call Bridge' : 'UNO'
  const gameIcon = roomData?.gameType === 'callbridge' ? '♠️' : '🃏'
  const gameColor = roomData?.gameType === 'callbridge' ? 'purple' : 'cyan'
  const colorClass = gameColor === 'cyan'
    ? { border: 'border-neon-cyan/30', text: 'text-neon-cyan', bg: 'bg-neon-cyan/10' }
    : { border: 'border-neon-purple/30', text: 'text-neon-purple', bg: 'bg-neon-purple/10' }

  const statusText = !enoughPlayers
    ? isCallBridge ? `Waiting for ${4 - players.length} more player${4 - players.length !== 1 ? 's' : ''}` : 'Waiting for 1 more player'
    : !allReady
      ? 'Waiting for players to ready up'
      : '✓ All set — host can start!'

  if (!roomData) {
    return (
      <div className="min-h-screen bg-void grid-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-display text-gray-500 text-sm tracking-widest">LOADING ROOM...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void grid-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 glass sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-5 py-3.5 flex items-center gap-3">
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="flex items-center gap-1.5 text-gray-500 hover:text-neon-pink transition-colors text-sm group"
          >
            <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="font-mono text-xs hidden sm:block">LEAVE</span>
          </button>

          <div className="flex items-center gap-2 ml-1">
            <span className="text-lg">{gameIcon}</span>
            <div>
              <p className="font-display text-white font-bold tracking-wider text-sm leading-none">{gameLabel.toUpperCase()}</p>
              <p className="font-mono text-gray-600 text-xs mt-0.5">WAITING ROOM</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {voiceEnabled ? (
              <button
                onClick={toggleMute}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                  isMuted
                    ? 'border-neon-pink/40 text-neon-pink bg-neon-pink/10'
                    : 'border-neon-green/40 text-neon-green bg-neon-green/10'
                }`}
              >
                {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
                {isMuted ? 'MUTED' : 'LIVE'}
              </button>
            ) : (
              <button
                onClick={enableVoice}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-500 hover:border-neon-cyan/40 hover:text-neon-cyan text-xs font-mono transition-all"
              >
                <PhoneCall size={13} /> VOICE
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-5 py-8 w-full space-y-5">
        {/* Room Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border ${colorClass.border} bg-white/[0.03] p-5`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-gray-600 uppercase tracking-wider mb-1.5">Room ID</p>
              <div className="flex items-center gap-2">
                <p className={`font-display text-2xl font-black tracking-widest ${colorClass.text}`}>{roomId}</p>
                <button onClick={copyRoomId} className="text-gray-600 hover:text-white transition-colors">
                  {copiedId ? <Check size={13} className="text-neon-green" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            {roomData?.isPrivate && roomData?.inviteCode && (
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end mb-1.5">
                  <Shield size={11} className="text-neon-gold" />
                  <p className="font-mono text-xs text-gray-600 uppercase tracking-wider">Invite Code</p>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <p className="font-display text-2xl font-black tracking-widest text-neon-gold">{roomData.inviteCode}</p>
                  <button onClick={copyInviteCode} className="text-gray-600 hover:text-neon-gold transition-colors">
                    {copied ? <Check size={13} className="text-neon-green" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-gray-500" />
              <span className="font-mono text-gray-500 text-xs">
                <span className="text-white font-bold">{players.length}</span>
                <span className="text-gray-700">/{maxPlayers}</span>
              </span>
              {/* Player fill dots */}
              <div className="flex gap-1 ml-1">
                {Array.from({ length: maxPlayers }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i < players.length ? (gameColor === 'cyan' ? 'bg-neon-cyan' : 'bg-neon-purple') : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className={`font-mono text-xs ${canStart ? 'text-neon-green' : enoughPlayers && !allReady ? 'text-neon-gold' : 'text-gray-600'}`}>
              {statusText}
            </span>
          </div>
        </motion.div>

        {/* Players */}
        <div className="space-y-2.5">
          <p className="font-mono text-xs text-gray-600 uppercase tracking-wider px-1">Players</p>
          <AnimatePresence mode="popLayout">
            {players.map((player, i) => (
              <PlayerCard
                key={player.uid}
                player={player}
                index={i}
                isMe={player.uid === user?.uid}
                gameColor={gameColor}
              />
            ))}
          </AnimatePresence>

          {/* Empty slots — only shown if room isn't full yet, and styled minimally */}
          {players.length < maxPlayers && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-dashed border-white/10 p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full border border-dashed border-white/15 flex items-center justify-center text-gray-700 text-sm font-mono">
                {maxPlayers - players.length}
              </div>
              <p className="font-mono text-xs text-gray-700 tracking-wider">
                WAITING FOR {maxPlayers - players.length} MORE PLAYER{maxPlayers - players.length !== 1 ? 'S' : ''}
              </p>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 pt-2"
        >
          {/* Leave button — always visible */}
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-neon-pink/30 text-neon-pink bg-neon-pink/5 hover:bg-neon-pink/15 font-mono text-xs tracking-wider transition-all disabled:opacity-50"
          >
            <LogOut size={14} />
            LEAVE
          </button>

          {/* Ready / Start */}
          {!isHost && myPlayer && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={toggleReady}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-mono text-xs tracking-wider font-bold transition-all ${
                myPlayer.isReady
                  ? 'border-neon-gold/40 text-neon-gold bg-neon-gold/10 hover:bg-neon-gold/20'
                  : 'border-neon-green/40 text-neon-green bg-neon-green/10 hover:bg-neon-green/20'
              }`}
            >
              {myPlayer.isReady ? '✓ READY — CLICK TO UNREADY' : 'CLICK TO READY UP'}
            </motion.button>
          )}

          {isHost && (
            <motion.button
              whileTap={canStart ? { scale: 0.97 } : {}}
              onClick={canStart ? startGame : undefined}
              disabled={!canStart}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-mono text-xs tracking-wider font-bold transition-all ${
                canStart
                  ? 'border-neon-green/50 text-neon-green bg-neon-green/10 hover:bg-neon-green/20 cursor-pointer'
                  : 'border-white/10 text-gray-700 cursor-not-allowed'
              }`}
            >
              <Play size={14} />
              {canStart ? 'START GAME' : !enoughPlayers ? 'NEED MORE PLAYERS' : 'WAITING FOR READY'}
            </motion.button>
          )}
        </motion.div>
      </main>
    </div>
  )
}

function PlayerCard({ player, index, isMe, gameColor }) {
  const avatarSrc = player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.uid}`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-3.5 rounded-xl p-3.5 border transition-all ${
        isMe
          ? gameColor === 'cyan'
            ? 'border-neon-cyan/25 bg-neon-cyan/5'
            : 'border-neon-purple/25 bg-neon-purple/5'
          : 'border-white/5 bg-white/[0.02]'
      }`}
    >
      {/* Avatar + Online dot */}
      <div className="relative flex-shrink-0">
        <img
          src={avatarSrc}
          alt={player.name}
          className="w-10 h-10 rounded-full border border-white/10"
        />
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#060610] ${
          player.isConnected !== false ? 'bg-neon-green' : 'bg-gray-700'
        }`} />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-body text-white font-semibold text-sm truncate">{player.name}</p>
          {isMe && (
            <span className={`font-mono text-xs ${gameColor === 'cyan' ? 'text-neon-cyan' : 'text-neon-purple'}`}>
              (you)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {player.isConnected !== false ? (
            <Wifi size={10} className="text-neon-green opacity-60" />
          ) : (
            <WifiOff size={10} className="text-gray-700" />
          )}
          <p className="font-mono text-xs text-gray-700 truncate">{player.uid.slice(0, 10)}…</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        {player.isHost ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neon-gold/30 bg-neon-gold/10">
            <Crown size={11} className="text-neon-gold" />
            <span className="font-mono text-xs text-neon-gold">HOST</span>
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
            player.isReady
              ? 'border-neon-green/30 bg-neon-green/10 text-neon-green'
              : 'border-white/10 bg-white/5 text-gray-600'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${player.isReady ? 'bg-neon-green' : 'bg-gray-700'}`} />
            <span className="font-mono text-xs">{player.isReady ? 'READY' : 'NOT READY'}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
