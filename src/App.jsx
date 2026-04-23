import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import AuthPage from './components/auth/AuthPage'
import Dashboard from './components/lobby/Dashboard'
import LobbyPage from './components/lobby/LobbyPage'
import RoomPage from './components/lobby/RoomPage'
import GameRouter from './components/games/GameRouter'

const PrivateRoute = ({ children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void grid-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-display text-neon-cyan text-sm tracking-widest">LOADING</p>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/auth" />
}

export default function App() {
  const { isLoading } = useAuth()

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d0d1a',
            color: '#e8e8f0',
            border: '1px solid rgba(0, 245, 255, 0.2)',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '15px',
          },
          success: {
            iconTheme: { primary: '#00ff88', secondary: '#0d0d1a' },
          },
          error: {
            iconTheme: { primary: '#ff0080', secondary: '#0d0d1a' },
          },
        }}
      />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/lobby" element={<PrivateRoute><LobbyPage /></PrivateRoute>} />
        <Route path="/room/:roomId" element={<PrivateRoute><RoomPage /></PrivateRoute>} />
        <Route path="/game/:roomId" element={<PrivateRoute><GameRouter /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
