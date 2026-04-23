import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRoom } from '../../hooks/useRoom'
import { useAuth } from '../../hooks/useAuth'
import { Plus, Lock, Globe, Users, ArrowLeft, Hash, Gamepad2, ChevronRight } from 'lucide-react'

export default function LobbyPage() {
  const [searchParams] = useSearchParams()
  const defaultGame = searchParams.get('game') || 'all'
  const [filter, setFilter] = useState(defaultGame)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(null)
  const { publicRooms, joinRoom, joinByCode, createRoom, currentRoom } = useRoom()
  const { user } = useAuth()
  const navigate = useNavigate()

  const filtered = publicRooms.filter(r =>
    filter === 'all' ? true : r.gameType === filter
  )

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) return
    setShowJoinCode(false)
    await joinByCode(inviteCode.trim().toUpperCase())
    setInviteCode('')
  }

  const handleJoin = async (roomId) => {
    setJoining(roomId)
    await joinRoom(roomId)
    setJoining(null)
  }

  return (
    <div className="min-h-screen bg-void grid-bg">
      {/* Header */}
      <header className="border-b border-white/5 glass sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-white transition-colors p-1"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2.5">
            <Gamepad2 size={15} className="text-neon-cyan" />
            <span className="font-display text-white font-bold tracking-widest text-sm">LOBBY</span>
          </div>

          {/* Active room banner */}
          {currentRoom && (
            <button
              onClick={() => navigate(`/room/${currentRoom}`)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-mono hover:bg-neon-green/20 transition-all"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              IN ROOM · RETURN
              <ChevronRight size={12} />
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowJoinCode(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/10 text-gray-400 hover:border-neon-cyan/40 hover:text-neon-cyan font-mono text-xs tracking-wider transition-all"
            >
              <Hash size={13} /> CODE
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neon-gold/40 text-neon-gold bg-neon-gold/10 hover:bg-neon-gold/20 font-mono text-xs tracking-wider transition-all"
            >
              <Plus size={13} /> CREATE
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8 space-y-6">
        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All Games', icon: '🎮' },
            { key: 'uno', label: 'UNO', icon: '🃏' },
            { key: 'callbridge', label: 'Call Bridge', icon: '♠️' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border font-mono text-xs tracking-wider transition-all ${
                filter === key
                  ? 'border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10'
                  : 'border-white/10 text-gray-600 hover:border-white/20 hover:text-gray-400'
              }`}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
          <span className="ml-auto font-mono text-xs text-gray-700">
            {filtered.length} ROOM{filtered.length !== 1 ? 'S' : ''}
          </span>
        </div>

        {/* Room grid */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 space-y-3"
          >
            <div className="text-5xl opacity-20">🎮</div>
            <p className="font-mono text-gray-700 text-xs tracking-widest">NO ROOMS AVAILABLE</p>
            <p className="text-gray-600 text-sm font-body">Create one to get started</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-2 text-xs">
              + Create Room
            </button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => handleJoin(room.id)}
                  isJoining={joining === room.id}
                  currentUserId={user?.uid}
                  isCurrentRoom={currentRoom === room.id}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateRoomModal
            onClose={() => setShowCreate(false)}
            onCreate={async (...args) => { await createRoom(...args); setShowCreate(false) }}
          />
        )}
        {showJoinCode && (
          <Modal onClose={() => setShowJoinCode(false)} title="Join Private Room">
            <div className="space-y-4">
              <p className="text-gray-500 text-sm font-body">Enter the invite code shared by your friend.</p>
              <input
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
                placeholder="XXXXXX"
                maxLength={6}
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-2xl text-white text-center tracking-[0.5em] focus:outline-none focus:border-neon-cyan/50 transition-colors placeholder:text-gray-800"
              />
              <button
                onClick={handleJoinByCode}
                disabled={inviteCode.length < 6}
                className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function RoomCard({ room, onJoin, isJoining, currentUserId, isCurrentRoom }) {
  const players = room.players
    ? (Array.isArray(room.players) ? room.players : Object.values(room.players))
    : []
  const isFull = players.length >= room.maxPlayers
  const isAlreadyIn = players.some(p => p.uid === currentUserId) || isCurrentRoom
  const isCallBridge = room.gameType === 'callbridge'
  const gameIcon = isCallBridge ? '♠️' : '🃏'
  const gameColor = isCallBridge ? 'purple' : 'cyan'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`rounded-2xl border bg-white/[0.02] p-5 space-y-4 transition-all hover:bg-white/[0.04] ${
        isAlreadyIn
          ? 'border-neon-green/30'
          : isFull
            ? 'border-white/5 opacity-60'
            : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{gameIcon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              {room.isPrivate
                ? <Lock size={10} className="text-neon-gold" />
                : <Globe size={10} className="text-gray-700" />}
              <span className="font-mono text-xs text-gray-600 uppercase tracking-wider">
                {isCallBridge ? 'Call Bridge' : 'UNO'}
              </span>
            </div>
            <p className="font-display text-white text-base font-bold tracking-wider mt-0.5">
              #{room.id}
            </p>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
          isFull && !isAlreadyIn ? 'bg-gray-700' : 'bg-neon-green animate-pulse'
        }`} />
      </div>

      {/* Player count + fill bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users size={12} />
            <span className="font-mono text-xs">{players.length}/{room.maxPlayers}</span>
          </div>
          {isAlreadyIn && (
            <span className="font-mono text-xs text-neon-green">● you're in</span>
          )}
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              gameColor === 'cyan'
                ? 'bg-neon-cyan'
                : 'bg-neon-purple'
            }`}
            style={{ width: `${(players.length / room.maxPlayers) * 100}%` }}
          />
        </div>
      </div>

      {/* Avatars */}
      <div className="flex gap-1.5">
        {players.slice(0, 5).map(p => (
          <img
            key={p.uid}
            src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`}
            className="w-7 h-7 rounded-full border border-white/10"
            title={p.name}
          />
        ))}
        {players.length === 0 && (
          <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-gray-700 text-xs">?</span>
          </div>
        )}
      </div>

      {/* Join button */}
      <button
        onClick={onJoin}
        disabled={(isFull && !isAlreadyIn) || isJoining}
        className={`w-full py-2.5 rounded-xl border font-mono text-xs tracking-wider font-bold transition-all ${
          isAlreadyIn
            ? 'border-neon-green/40 text-neon-green bg-neon-green/10 hover:bg-neon-green/20'
            : isFull
              ? 'border-white/5 text-gray-700 cursor-not-allowed bg-white/[0.02]'
              : gameColor === 'cyan'
                ? 'border-neon-cyan/40 text-neon-cyan bg-neon-cyan/10 hover:bg-neon-cyan/20'
                : 'border-neon-purple/40 text-neon-purple bg-neon-purple/10 hover:bg-neon-purple/20'
        }`}
      >
        {isJoining ? '...' : isAlreadyIn ? 'RETURN TO ROOM →' : isFull ? 'ROOM FULL' : 'JOIN →'}
      </button>
    </motion.div>
  )
}

function CreateRoomModal({ onClose, onCreate }) {
  const [gameType, setGameType] = useState('uno')
  const [isPrivate, setIsPrivate] = useState(false)
  const [maxPlayers, setMaxPlayers] = useState(2)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (gameType === 'callbridge') setMaxPlayers(4)
    else setMaxPlayers(2)
  }, [gameType])

  const handleCreate = async () => {
    setCreating(true)
    await onCreate(gameType, isPrivate, maxPlayers)
    setCreating(false)
  }

  const playerOptions = gameType === 'callbridge' ? [4] : [2, 3, 4]

  return (
    <Modal onClose={onClose} title="Create Room">
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="font-mono text-xs text-gray-600 uppercase tracking-wider">Game</label>
          <div className="grid grid-cols-2 gap-2">
            {[['uno', '🃏', 'UNO'], ['callbridge', '♠️', 'Call Bridge']].map(([val, icon, label]) => (
              <button
                key={val}
                onClick={() => setGameType(val)}
                className={`py-3.5 rounded-xl border font-mono text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${
                  gameType === val
                    ? 'border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10'
                    : 'border-white/10 text-gray-500 hover:border-white/20'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-mono text-xs text-gray-600 uppercase tracking-wider">Max Players</label>
          <div className="flex gap-2">
            {playerOptions.map(n => (
              <button
                key={n}
                onClick={() => setMaxPlayers(n)}
                className={`flex-1 py-3 rounded-xl border font-mono text-sm font-bold transition-all ${
                  maxPlayers === n
                    ? 'border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10'
                    : 'border-white/10 text-gray-500 hover:border-white/20'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div
          onClick={() => setIsPrivate(!isPrivate)}
          className="flex items-center justify-between p-4 rounded-xl border border-white/10 cursor-pointer hover:border-white/20 transition-all select-none"
        >
          <div>
            <p className="font-mono text-white text-xs tracking-wider font-bold">PRIVATE ROOM</p>
            <p className="font-body text-gray-600 text-xs mt-0.5">Friends join with invite code</p>
          </div>
          <div className={`w-11 h-6 rounded-full border transition-all relative ${
            isPrivate ? 'bg-neon-cyan/20 border-neon-cyan/50' : 'bg-white/5 border-white/10'
          }`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
              isPrivate ? 'left-5 bg-neon-cyan' : 'left-0.5 bg-gray-600'
            }`} />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={creating}
          className="btn-gold w-full disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Room'}
        </button>
      </div>
    </Modal>
  )
}

function Modal({ onClose, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 16 }}
        className="bg-[#0a0a18] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-white font-bold text-sm tracking-widest uppercase">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
