import { motion } from 'framer-motion'

const COLORS = [
  { value: 'red', label: 'Red', bg: 'bg-red-600 hover:bg-red-500', shadow: 'hover:shadow-red-500/50' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-600 hover:bg-blue-500', shadow: 'hover:shadow-blue-500/50' },
  { value: 'green', label: 'Green', bg: 'bg-green-600 hover:bg-green-500', shadow: 'hover:shadow-green-500/50' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500 hover:bg-yellow-400', shadow: 'hover:shadow-yellow-400/50' },
]

export default function ColorPicker({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass neon-border rounded-2xl p-8 space-y-6 text-center"
      >
        <div>
          <p className="font-display text-white text-xl font-black tracking-wider">CHOOSE COLOR</p>
          <p className="font-body text-gray-500 text-sm mt-1">Pick the color for your wild card</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {COLORS.map(color => (
            <motion.button
              key={color.value}
              onClick={() => onSelect(color.value)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className={`${color.bg} ${color.shadow} w-24 h-24 rounded-2xl font-display text-white font-black text-sm tracking-wider shadow-lg transition-all duration-200`}
            >
              {color.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
