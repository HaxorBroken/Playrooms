import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useRoom } from '../../hooks/useRoom'
import { LogOut, Gamepad2, Users, Zap, Shield, ChevronRight, ArrowRight } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' } }),
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { currentRoom, roomData } = useRoom()
  const navigate = useNavigate()

  const isInActiveGame = currentRoom && roomData?.status === 'in-progress'
  const isInWaitingRoom = currentRoom && roomData?.status === 'waiting'

  return (
    <div className="min-h-screen bg-void grid-bg">
      {/* Header */}
      <header className="border-b border-white/5 glass sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 border border-neon-cyan/40 rounded-lg flex items-center justify-center">
              <Gamepad2 size={14} className="text-neon-cyan" />
            </div>
            <span className="font-display text-white font-black tracking-widest text-sm">GAMEPORTAL</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Return to room/game button */}
            {(isInActiveGame || isInWaitingRoom) && (
              <button
                onClick={() => navigate(isInActiveGame ? `/game/${currentRoom}` : `/room/${currentRoom}`)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neon-green/40 text-neon-green bg-neon-green/10 hover:bg-neon-green/20 font-mono text-xs tracking-wider transition-all"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                {isInActiveGame ? 'RETURN TO GAME' : 'RETURN TO ROOM'}
                <ChevronRight size={12} />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <img
                src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`}
                alt="avatar"
                className="w-8 h-8 rounded-full border border-white/10"
              />
              <div className="hidden sm:block">
                <p className="font-body text-white text-sm font-semibold leading-none">{user?.displayName}</p>
                <p className="font-mono text-gray-600 text-xs mt-0.5 truncate max-w-[140px]">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-neon-pink transition-colors p-2 rounded-lg hover:bg-neon-pink/10"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-14">
        <div className="space-y-14">
          {/* Hero */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-center space-y-3"
          >
            <p className="font-mono text-gray-700 text-xs tracking-[0.3em] uppercase">Welcome back</p>
            <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight">
              <span className="shimmer-text">{user?.displayName?.toUpperCase() || 'PLAYER'}</span>
            </h1>
            <p className="text-gray-600 font-body text-base">Pick a game and challenge your friends.</p>
          </motion.div>

          {/* Game Cards */}
          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 gap-5"
          >
            <GameCard
              icon="🃏"
              title="UNO"
              subtitle="2–4 Players"
              description="Full rule enforcement — skips, reverses, draw cards, wild colors, and UNO challenges."
              features={['Card stacking', 'UNO penalty system', 'Wild color picker', 'Real-time sync']}
              gradient="from-neon-cyan/20 to-neon-cyan/5"
              accentColor="neon-cyan"
              onClick={() => navigate('/lobby?game=uno')}
            />
            <GameCard
              icon="♠️"
              title="Call Bridge"
              subtitle="4 Players"
              description="Strategic trick-taking card game. Bid your tricks, pick your trump, outplay opponents."
              features={['Bidding system', 'Trump card selection', 'Trick tracking', 'Score leaderboard']}
              gradient="from-neon-purple/20 to-neon-purple/5"
              accentColor="neon-purple"
              onClick={() => navigate('/lobby?game=callbridge')}
            />
          </motion.div>

          {/* Feature pills */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-3"
          >
            {[
              { icon: <Users size={16} />, label: 'Real-time Multiplayer', color: 'text-neon-cyan' },
              { icon: <Zap size={16} />, label: 'Voice Chat', color: 'text-neon-gold' },
              { icon: <Shield size={16} />, label: 'Private Rooms', color: 'text-neon-purple' },
            ].map(({ icon, label, color }) => (
              <div key={label} className="flex items-center gap-2.5 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className={color}>{icon}</div>
                <p className="font-body text-gray-400 text-xs font-semibold leading-snug">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

function GameCard({ icon, title, subtitle, description, features, gradient, accentColor, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`group rounded-2xl border border-white/8 bg-gradient-to-br ${gradient} p-7 cursor-pointer transition-all duration-300 space-y-5 hover:border-white/15`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <span className="text-4xl">{icon}</span>
        <span className={`font-mono text-xs border border-white/15 px-3 py-1 rounded-full text-gray-500`}>
          {subtitle}
        </span>
      </div>

      <div className="space-y-1.5">
        <h2 className="font-display text-2xl font-black text-white">{title}</h2>
        <p className="text-gray-500 font-body text-sm leading-relaxed">{description}</p>
      </div>

      <ul className="space-y-1.5">
        {features.map(f => (
          <li key={f} className="flex items-center gap-2 text-gray-500 text-xs font-body">
            <div className={`w-1.5 h-1.5 rounded-full bg-${accentColor} opacity-60 flex-shrink-0`} />
            {f}
          </li>
        ))}
      </ul>

      <div className={`flex items-center gap-2 font-mono text-xs text-${accentColor} group-hover:gap-3 transition-all`}>
        PLAY NOW <ArrowRight size={13} />
      </div>
    </motion.div>
  )
}
