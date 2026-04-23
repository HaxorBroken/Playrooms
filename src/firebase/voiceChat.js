import { ref, set, onValue, off, push, get } from 'firebase/database'
import { rtdb } from './config'

class VoiceChatManager {
  constructor() {
    this.peerConnections = new Map()
    this.localStream = null
    this.roomId = null
    this.userId = null
    this.isMuted = false
    this.listeners = new Map()
    this.onRemoteStream = null

    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    }
  }

  async initialize(roomId, userId, onRemoteStreamCallback) {
    this.roomId = roomId
    this.userId = userId
    this.onRemoteStream = onRemoteStreamCallback

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch {
      console.warn('Microphone access denied — voice chat disabled')
      return false
    }

    this.listenForSignals()
    return true
  }

  listenForSignals() {
    const signalingRef = ref(rtdb, `signaling/${this.roomId}/${this.userId}`)
    const unsubscribe = onValue(signalingRef, async (snapshot) => {
      const data = snapshot.val()
      if (!data) return

      for (const [senderId, signals] of Object.entries(data)) {
        if (senderId === this.userId) continue

        for (const [signalId, signal] of Object.entries(signals || {})) {
          await this.handleSignal(senderId, signal)
        }
      }
    })

    this.listeners.set('signaling', unsubscribe)
  }

  async handleSignal(senderId, signal) {
    if (signal.type === 'offer') {
      await this.handleOffer(senderId, signal)
    } else if (signal.type === 'answer') {
      await this.handleAnswer(senderId, signal)
    } else if (signal.type === 'ice-candidate') {
      await this.handleIceCandidate(senderId, signal)
    }
  }

  async connectToPeer(peerId) {
    if (this.peerConnections.has(peerId)) return

    const pc = this.createPeerConnection(peerId)

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    await this.sendSignal(peerId, {
      type: 'offer',
      sdp: offer.sdp,
    })
  }

  createPeerConnection(peerId) {
    const pc = new RTCPeerConnection(this.configuration)

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream))
    }

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.sendSignal(peerId, {
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        })
      }
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0]
      if (this.onRemoteStream) {
        this.onRemoteStream(peerId, remoteStream)
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.peerConnections.delete(peerId)
      }
    }

    this.peerConnections.set(peerId, pc)
    return pc
  }

  async handleOffer(senderId, signal) {
    const pc = this.createPeerConnection(senderId)
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }))

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    await this.sendSignal(senderId, {
      type: 'answer',
      sdp: answer.sdp,
    })
  }

  async handleAnswer(senderId, signal) {
    const pc = this.peerConnections.get(senderId)
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }))
    }
  }

  async handleIceCandidate(senderId, signal) {
    const pc = this.peerConnections.get(senderId)
    if (pc && signal.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
    }
  }

  async sendSignal(targetId, signal) {
    const signalRef = ref(rtdb, `signaling/${this.roomId}/${targetId}/${this.userId}/${Date.now()}`)
    await set(signalRef, signal)
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isMuted
      })
    }
    return this.isMuted
  }

  disconnect() {
    this.peerConnections.forEach(pc => pc.close())
    this.peerConnections.clear()

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    this.listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') unsubscribe()
    })
    this.listeners.clear()
  }
}

export const voiceChatManager = new VoiceChatManager()
