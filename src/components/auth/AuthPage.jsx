import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'

export default function AuthPage() {
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user])

  return (
    <div className="min-h-screen bg-void grid-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0
                ? 'radial-gradient(circle, rgba(0,245,255,0.3), transparent)'
                : 'radial-gradient(circle, rgba(191,0,255,0.3), transparent)',
            }}
            animate={{
              x: [0, Math.random() * 40 - 20],
              y: [0, Math.random() * 40 - 20],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 4 + 4,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="glass neon-border rounded-2xl p-10 space-y-8">
          <div className="text-center space-y-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto border-2 border-neon-cyan border-dashed rounded-full flex items-center justify-center"
            >
              <span className="text-2xl">🎮</span>
            </motion.div>

            <h1 className="font-display text-4xl font-black tracking-tight">
              <span className="shimmer-text">GAME</span>
              <br />
              <span className="text-white">PORTAL</span>
            </h1>

            <p className="font-body text-gray-400 text-sm tracking-widest uppercase">
              Multiplayer Gaming Hub
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-500 text-xs font-mono">
              <div className="flex-1 h-px bg-border" />
              <span>AVAILABLE GAMES</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🃏', name: 'UNO', desc: '2-4 Players' },
                { icon: '♠️', name: 'Call Bridge', desc: '4 Players' },
              ].map(game => (
                <div
                  key={game.name}
                  className="bg-surface rounded-xl p-4 border border-border text-center"
                >
                  <div className="text-2xl mb-1">{game.icon}</div>
                  <div className="font-display text-white text-sm font-bold">{game.name}</div>
                  <div className="text-gray-500 text-xs font-mono">{game.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            onClick={signInWithGoogle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-display font-bold text-sm tracking-wider py-4 rounded-xl transition-all hover:bg-gray-100"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </motion.button>

          <p className="text-center text-gray-600 text-xs font-mono">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </motion.div>
    </div>
  )
}
