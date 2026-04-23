import { motion } from 'framer-motion'
import { Mic, MicOff, PhoneCall, PhoneOff } from 'lucide-react'

export default function VoicePanel({ isMuted, isConnected, voiceEnabled, onEnable, onToggleMute }) {
  if (!voiceEnabled) {
    return (
      <motion.button
        onClick={onEnable}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-gray-500 hover:border-neon-cyan hover:text-neon-cyan transition-all text-xs font-display"
      >
        <PhoneCall size={13} />
        <span>Voice</span>
      </motion.button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-neon-green animate-pulse' : 'bg-gray-600'}`} />
      <motion.button
        onClick={onToggleMute}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all text-xs font-display ${
          isMuted
            ? 'border-neon-pink text-neon-pink bg-neon-pink/10'
            : 'border-neon-green text-neon-green bg-neon-green/10'
        }`}
      >
        {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
        <span>{isMuted ? 'Muted' : 'Live'}</span>
      </motion.button>
    </div>
  )
}
