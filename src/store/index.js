import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}))

export const useRoomStore = create((set) => ({
  currentRoom: null,
  roomData: null,
  publicRooms: [],
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setRoomData: (data) => set({ roomData: data }),
  setPublicRooms: (rooms) => set({ publicRooms: rooms }),
  clearRoom: () => set({ currentRoom: null, roomData: null }),
}))

export const useGameStore = create((set) => ({
  gameState: null,
  myHand: [],
  lastAction: null,
  setGameState: (state) => set({ gameState: state }),
  setMyHand: (hand) => set({ myHand: hand }),
  setLastAction: (action) => set({ lastAction: action }),
  clearGame: () => set({ gameState: null, myHand: [], lastAction: null }),
}))

export const useVoiceStore = create((set) => ({
  isMuted: false,
  isConnected: false,
  remoteStreams: {},
  voiceEnabled: false,
  setMuted: (isMuted) => set({ isMuted }),
  setConnected: (isConnected) => set({ isConnected }),
  setRemoteStream: (peerId, stream) =>
    set((state) => ({
      remoteStreams: { ...state.remoteStreams, [peerId]: stream },
    })),
  removeRemoteStream: (peerId) =>
    set((state) => {
      const streams = { ...state.remoteStreams }
      delete streams[peerId]
      return { remoteStreams: streams }
    }),
  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
}))
