import { useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config'
import { saveUserProfile } from '../firebase/services'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const { user, isLoading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await saveUserProfile(firebaseUser)
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
      toast.success('Welcome back!')
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Sign in failed. Please try again.')
      }
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      toast.success('Signed out successfully')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return { user, isLoading, signInWithGoogle, logout }
}
