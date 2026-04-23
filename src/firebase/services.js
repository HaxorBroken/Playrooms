import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  onSnapshot, query, where, serverTimestamp, arrayUnion
} from 'firebase/firestore'
import {
  ref, set, update, onValue, off, push, remove, onDisconnect
} from 'firebase/database'
import { db, rtdb } from './config'
import { v4 as uuidv4 } from 'uuid'

export const createRoom = async (hostUser, gameType, isPrivate, maxPlayers) => {
  const roomId = uuidv4().slice(0, 8).toUpperCase()
  const inviteCode = isPrivate ? uuidv4().slice(0, 6).toUpperCase() : null

  const roomData = {
    id: roomId,
    hostId: hostUser.uid,
    gameType,
    isPrivate,
    inviteCode,
    maxPlayers,
    status: 'waiting',
    players: [{
      uid: hostUser.uid,
      name: hostUser.displayName,
      avatar: hostUser.photoURL,
      isHost: true,
      isReady: false,
    }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'rooms', roomId), roomData)

  // FIXED: maxPlayers, inviteCode now included in RTDB
  const rtdbRoomRef = ref(rtdb, `rooms/${roomId}`)
  await set(rtdbRoomRef, {
    id: roomId,
    hostId: hostUser.uid,
    gameType,
    isPrivate,
    inviteCode,
    maxPlayers,
    status: 'waiting',
    players: {
      [hostUser.uid]: {
        uid: hostUser.uid,
        name: hostUser.displayName,
        avatar: hostUser.photoURL,
        isHost: true,
        isReady: false,
        isConnected: true,
      }
    },
  })

  return roomId
}

export const joinRoom = async (roomId, user) => {
  const roomRef = doc(db, 'rooms', roomId)
  const roomSnap = await getDoc(roomRef)

  if (!roomSnap.exists()) throw new Error('Room not found')

  const room = roomSnap.data()

  if (room.status !== 'waiting') throw new Error('Game already in progress')
  if (room.players.length >= room.maxPlayers) throw new Error('Room is full')

  const alreadyIn = room.players.some(p => p.uid === user.uid)
  if (alreadyIn) return roomId

  const playerData = {
    uid: user.uid,
    name: user.displayName,
    avatar: user.photoURL,
    isHost: false,
    isReady: false,
  }

  await updateDoc(roomRef, {
    players: arrayUnion(playerData),
    updatedAt: serverTimestamp(),
  })

  const rtdbPlayerRef = ref(rtdb, `rooms/${roomId}/players/${user.uid}`)
  await set(rtdbPlayerRef, { ...playerData, isConnected: true })

  const disconnectRef = ref(rtdb, `rooms/${roomId}/players/${user.uid}/isConnected`)
  onDisconnect(disconnectRef).set(false)

  return roomId
}

// FIXED: getDocs instead of onSnapshot, no composite index, status checked in JS
export const joinRoomByInviteCode = async (inviteCode, user) => {
  const q = query(collection(db, 'rooms'), where('inviteCode', '==', inviteCode.toUpperCase()))
  const snapshot = await getDocs(q)

  if (snapshot.empty) throw new Error('Invalid invite code')

  const roomDoc = snapshot.docs[0]
  const room = roomDoc.data()

  if (room.status === 'finished') throw new Error('This game has already ended')
  if (room.status === 'in-progress') throw new Error('Game already in progress')
  if (room.players.length >= room.maxPlayers) throw new Error('Room is full')

  return joinRoom(roomDoc.id, user)
}

export const leaveRoom = async (roomId, userId) => {
  const roomRef = doc(db, 'rooms', roomId)
  const roomSnap = await getDoc(roomRef)

  if (!roomSnap.exists()) return

  const room = roomSnap.data()
  const updatedPlayers = room.players.filter(p => p.uid !== userId)

  if (updatedPlayers.length === 0) {
    await deleteDoc(roomRef)
    await remove(ref(rtdb, `rooms/${roomId}`))
    return
  }

  if (room.hostId === userId && updatedPlayers.length > 0) {
    const newHost = { ...updatedPlayers[0], isHost: true }
    const rest = updatedPlayers.slice(1)
    await updateDoc(roomRef, {
      players: [newHost, ...rest],
      hostId: newHost.uid,
      updatedAt: serverTimestamp(),
    })
    await update(ref(rtdb, `rooms/${roomId}/players/${newHost.uid}`), { isHost: true })
    await update(ref(rtdb, `rooms/${roomId}`), { hostId: newHost.uid })
  } else {
    await updateDoc(roomRef, {
      players: updatedPlayers,
      updatedAt: serverTimestamp(),
    })
  }

  await remove(ref(rtdb, `rooms/${roomId}/players/${userId}`))
}

export const setPlayerReady = async (roomId, userId, isReady) => {
  const roomRef = doc(db, 'rooms', roomId)
  const roomSnap = await getDoc(roomRef)
  if (!roomSnap.exists()) return
  const room = roomSnap.data()
  const updatedPlayers = room.players.map(p =>
    p.uid === userId ? { ...p, isReady } : p
  )
  await updateDoc(roomRef, { players: updatedPlayers, updatedAt: serverTimestamp() })
  await update(ref(rtdb, `rooms/${roomId}/players/${userId}`), { isReady })
}

export const subscribeToPublicRooms = (callback) => {
  const q = query(collection(db, 'rooms'), where('isPrivate', '==', false), where('status', '==', 'waiting'))
  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(rooms)
  })
}

export const subscribeToRoom = (roomId, callback) => {
  const rtdbRef = ref(rtdb, `rooms/${roomId}`)
  onValue(rtdbRef, (snapshot) => {
    callback(snapshot.val())
  })
  return () => off(rtdbRef)
}

export const updateGameState = async (roomId, gameState) => {
  const gameRef = ref(rtdb, `games/${roomId}`)
  await set(gameRef, { ...gameState, updatedAt: Date.now() })
}

export const subscribeToGameState = (roomId, callback) => {
  const gameRef = ref(rtdb, `games/${roomId}`)
  onValue(gameRef, (snapshot) => {
    callback(snapshot.val())
  })
  return () => off(gameRef)
}

export const pushPlayerAction = async (roomId, action) => {
  const actionsRef = ref(rtdb, `actions/${roomId}`)
  await push(actionsRef, { ...action, timestamp: Date.now() })
}

export const subscribeToActions = (roomId, callback) => {
  const actionsRef = ref(rtdb, `actions/${roomId}`)
  const unsubscribe = onValue(actionsRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      const actions = Object.entries(data).map(([key, val]) => ({ key, ...val }))
      callback(actions)
    }
  })
  return unsubscribe
}

export const saveUserProfile = async (user) => {
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    name: user.displayName,
    email: user.email,
    avatar: user.photoURL,
    lastSeen: serverTimestamp(),
    gamesPlayed: 0,
    wins: 0,
  }, { merge: true })
}

export const startGame = async (roomId) => {
  await updateDoc(doc(db, 'rooms', roomId), {
    status: 'in-progress',
    updatedAt: serverTimestamp(),
  })
  await update(ref(rtdb, `rooms/${roomId}`), { status: 'in-progress' })
}

export const endGame = async (roomId) => {
  await updateDoc(doc(db, 'rooms', roomId), {
    status: 'finished',
    updatedAt: serverTimestamp(),
  })
}
