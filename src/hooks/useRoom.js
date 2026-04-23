import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createRoom, joinRoom, joinRoomByInviteCode, leaveRoom,
  setPlayerReady, subscribeToPublicRooms, subscribeToRoom, startGame
} from '../firebase/services'
import { useRoomStore, useAuthStore } from '../store'
import toast from 'react-hot-toast'

export const useRoom = () => {
  const { user } = useAuthStore()
  const { currentRoom, roomData, publicRooms, setCurrentRoom, setRoomData, setPublicRooms, clearRoom } = useRoomStore()
  const navigate = useNavigate()

  // Subscribe to public rooms list
  useEffect(() => {
    const unsubscribe = subscribeToPublicRooms((rooms) => setPublicRooms(rooms))
    return unsubscribe
  }, [])

  // Subscribe to current room data
  useEffect(() => {
    if (!currentRoom) return
    const unsubscribe = subscribeToRoom(currentRoom, (data) => {
      if (!data) {
        clearRoom()
        navigate('/lobby')
        toast.error('Room was closed')
        return
      }
      setRoomData(data)
      // Only auto-navigate to game if we're in the room/lobby pages, not if already in game
      if (data.status === 'in-progress') {
        const path = window.location.pathname
        if (path.startsWith('/room/') || path === '/lobby' || path === '/') {
          navigate(`/game/${currentRoom}`)
        }
      }
    })
    return unsubscribe
  }, [currentRoom])

  // FIXED: initialise currentRoom from URL param if store is empty (page refresh)
  const initRoomFromUrl = useCallback((roomId) => {
    if (!currentRoom && roomId) {
      setCurrentRoom(roomId)
    }
  }, [currentRoom])

  const handleCreateRoom = useCallback(async (gameType, isPrivate, maxPlayers) => {
    try {
      // Leave existing room first
      if (currentRoom) {
        await leaveRoom(currentRoom, user.uid)
        clearRoom()
      }
      const roomId = await createRoom(user, gameType, isPrivate, maxPlayers)
      setCurrentRoom(roomId)
      navigate(`/room/${roomId}`)
      toast.success('Room created!')
      return roomId
    } catch (error) {
      toast.error(error.message || 'Failed to create room')
    }
  }, [user, currentRoom])

  const handleJoinRoom = useCallback(async (roomId) => {
    try {
      // FIXED: leave current room before joining another
      if (currentRoom && currentRoom !== roomId) {
        await leaveRoom(currentRoom, user.uid)
        clearRoom()
      }
      await joinRoom(roomId, user)
      setCurrentRoom(roomId)
      navigate(`/room/${roomId}`)
      toast.success('Joined room!')
    } catch (error) {
      toast.error(error.message || 'Failed to join room')
    }
  }, [user, currentRoom])

  const handleJoinByCode = useCallback(async (code) => {
    try {
      // FIXED: leave current room before joining another
      if (currentRoom) {
        await leaveRoom(currentRoom, user.uid)
        clearRoom()
      }
      const roomId = await joinRoomByInviteCode(code, user)
      setCurrentRoom(roomId)
      navigate(`/room/${roomId}`)
      toast.success('Joined private room!')
    } catch (error) {
      toast.error(error.message || 'Invalid invite code')
    }
  }, [user, currentRoom])

  const handleLeaveRoom = useCallback(async () => {
    if (!currentRoom || !user) return
    try {
      await leaveRoom(currentRoom, user.uid)
      clearRoom()
      navigate('/lobby')
    } catch (error) {
      toast.error('Failed to leave room')
    }
  }, [currentRoom, user])

  const handleToggleReady = useCallback(async () => {
    if (!currentRoom || !user || !roomData) return
    const players = roomData.players || {}
    const player = Object.values(players).find(p => p.uid === user.uid)
    const isReady = player?.isReady || false
    await setPlayerReady(currentRoom, user.uid, !isReady)
  }, [currentRoom, user, roomData])

  const handleStartGame = useCallback(async () => {
    if (!currentRoom) return
    try {
      await startGame(currentRoom)
    } catch (error) {
      toast.error('Failed to start game')
    }
  }, [currentRoom])

  return {
    currentRoom,
    roomData,
    publicRooms,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    joinByCode: handleJoinByCode,
    leaveRoom: handleLeaveRoom,
    toggleReady: handleToggleReady,
    startGame: handleStartGame,
    initRoomFromUrl,
  }
}
