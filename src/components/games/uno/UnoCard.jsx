import { motion } from 'framer-motion'
import { getCardColorClass, getCardSymbol, getCardTextColor } from '../../../utils/unoEngine'

export default function UnoCard({ card, onClick, playable, isBack, style, className, small }) {
  if (isBack) {
    return (
      <motion.div
        style={style}
        className={`${small ? 'w-10 h-14' : 'uno-card'} card-back rounded-xl flex items-center justify-center ${className || ''}`}
        whileHover={!small ? { y: -4 } : {}}
      >
        <div className="w-3/4 h-3/4 border border-neon-cyan/20 rounded-lg flex items-center justify-center">
          <span className="font-display text-neon-cyan/30 text-xs font-black">UNO</span>
        </div>
      </motion.div>
    )
  }

  const colorClass = getCardColorClass(card.color)
  const textColor = getCardTextColor(card.color)
  const symbol = getCardSymbol(card.value)
  const isPlayableCard = playable === true
  const isNotPlayable = playable === false

  return (
    <motion.div
      onClick={isNotPlayable ? undefined : onClick}
      style={style}
      className={`
        ${small ? 'w-10 h-14 rounded-lg' : 'uno-card rounded-xl'}
        bg-gradient-to-br ${colorClass}
        border-2 flex flex-col items-center justify-between p-1.5
        ${isPlayableCard ? 'playable' : ''}
        ${isNotPlayable ? 'not-playable' : ''}
        ${className || ''}
      `}
      whileHover={isPlayableCard && !small ? { y: -16, scale: 1.05 } : {}}
      whileTap={isPlayableCard && !small ? { scale: 0.95 } : {}}
      initial={{ scale: 0, rotate: -15 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className={`self-start font-display font-black leading-none ${small ? 'text-xs' : 'text-sm'} ${textColor}`}>
        {symbol}
      </div>

      <div className={`font-display font-black ${small ? 'text-base' : 'text-2xl'} ${textColor} drop-shadow`}>
        {card.color === 'wild' ? '🌈' : symbol}
      </div>

      <div className={`self-end rotate-180 font-display font-black leading-none ${small ? 'text-xs' : 'text-sm'} ${textColor}`}>
        {symbol}
      </div>
    </motion.div>
  )
}
