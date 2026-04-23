import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { subscribeToRoom } from '../../firebase/services'
import UnoGame from './uno/UnoGame'
import CallBridgeGame from './callbridge/CallBridgeGame'

export default function GameRouter() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [gameType, setGameType] = useState(null)

  useEffect(() => {
    if (!roomId) return
    const unsubscribe = subscribeToRoom(roomId, (data) => {
      if (!data) {
        navigate('/lobby')
        return
      }
      setGameType(data.gameType)
    })
    return unsubscribe
  }, [roomId])

  if (!gameType) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (gameType === 'uno') return <UnoGame roomId={roomId} />
  if (gameType === 'callbridge') return <CallBridgeGame roomId={roomId} />

  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <p className="text-neon-pink font-display">Unknown game type: {gameType}</p>
    </div>
  )
}
