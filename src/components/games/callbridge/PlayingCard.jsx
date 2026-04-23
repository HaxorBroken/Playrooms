import { motion } from 'framer-motion'
import { getSuitSymbol, getSuitColor } from '../../../utils/callBridgeEngine'

export default function PlayingCard({ card, onClick, playable, isBack, small, selected }) {
  if (isBack) {
    return (
      <motion.div
        className={`${small ? 'w-10 h-14' : 'playing-card'} card-back rounded-xl flex items-center justify-center`}
        whileHover={!small ? { y: -4 } : {}}
      >
        <div className="w-3/4 h-3/4 border border-neon-purple/20 rounded-lg flex items-center justify-center">
          <span className="text-neon-purple/20 text-xs font-mono">♠♣</span>
        </div>
      </motion.div>
    )
  }

  const suitSymbol = getSuitSymbol(card.suit)
  const suitColor = getSuitColor(card.suit)
  const isRed = ['hearts', 'diamonds'].includes(card.suit)

  return (
    <motion.div
      onClick={playable ? onClick : undefined}
      className={`
        playing-card rounded-xl border-2 bg-white flex flex-col items-center justify-between p-1.5
        ${playable ? 'playable cursor-pointer' : 'cursor-default opacity-60'}
        ${selected ? 'ring-2 ring-neon-gold -translate-y-3' : ''}
        ${small ? 'w-10 h-14 rounded-lg' : ''}
      `}
      whileHover={playable ? { y: -14, scale: 1.04 } : {}}
      whileTap={playable ? { scale: 0.96 } : {}}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className={`self-start font-display font-black ${small ? 'text-xs' : 'text-sm'} leading-none ${suitColor}`}>
        {card.rank}
        <span className={`block text-xs leading-none ${suitColor}`}>{suitSymbol}</span>
      </div>

      <div className={`font-display font-black ${small ? 'text-lg' : 'text-2xl'} ${suitColor}`}>
        {suitSymbol}
      </div>

      <div className={`self-end rotate-180 font-display font-black ${small ? 'text-xs' : 'text-sm'} leading-none ${suitColor}`}>
        {card.rank}
        <span className={`block text-xs leading-none ${suitColor}`}>{suitSymbol}</span>
      </div>
    </motion.div>
  )
}
