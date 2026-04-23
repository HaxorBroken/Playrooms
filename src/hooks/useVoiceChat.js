import { useCallback, useEffect } from 'react'
import { voiceChatManager } from '../firebase/voiceChat'
import { useVoiceStore, useAuthStore } from '../store'
import toast from 'react-hot-toast'

export const useVoiceChat = (roomId, players) => {
  const { user } = useAuthStore()
  const { isMuted, isConnected, setMuted, setConnected, setRemoteStream, removeRemoteStream, setVoiceEnabled, voiceEnabled } = useVoiceStore()

  useEffect(() => {
    if (!roomId || !user || !voiceEnabled) return

    const initVoice = async () => {
      const success = await voiceChatManager.initialize(roomId, user.uid, (peerId, stream) => {
        setRemoteStream(peerId, stream)
      })

      if (success) {
        setConnected(true)

        if (players) {
          const otherPlayers = players.filter(p => p.uid !== user.uid && p.isConnected)
          for (const player of otherPlayers) {
            await voiceChatManager.connectToPeer(player.uid)
          }
        }
      } else {
        setConnected(false)
      }
    }

    initVoice()

    return () => {
      voiceChatManager.disconnect()
      setConnected(false)
    }
  }, [roomId, user, voiceEnabled])

  const enableVoice = useCallback(async () => {
    setVoiceEnabled(true)
    toast.success('Voice chat enabled')
  }, [])

  const disableVoice = useCallback(() => {
    voiceChatManager.disconnect()
    setVoiceEnabled(false)
    setConnected(false)
    toast('Voice chat disabled')
  }, [])

  const toggleMute = useCallback(() => {
    const muted = voiceChatManager.toggleMute()
    setMuted(muted)
    toast(muted ? '🔇 Muted' : '🎙️ Unmuted')
  }, [])

  return { isMuted, isConnected, voiceEnabled, enableVoice, disableVoice, toggleMute }
}
