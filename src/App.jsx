import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Team from './pages/Team'
import Protocols from './pages/Protocols'
import Publications from './pages/Publications'
import Journals from './pages/Journals'
import Congresses from './pages/Congresses'
import PIDashboard from './pages/PIDashboard'

function ProtectedRoute({ children, requireRole }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (requireRole && user.role !== requireRole) return <Navigate to="/" replace />
  return children
}

function HomeRoute() {
  const { user } = useAuth()
  if (user?.role === 'pi') return <Navigate to="/pi-dashboard" replace />
  return <Dashboard />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><HomeRoute /></ProtectedRoute>} />
      <Route path="/pi-dashboard" element={<ProtectedRoute><PIDashboard /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireRole="admin"><Admin /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/protocols" element={<ProtectedRoute><Protocols /></ProtectedRoute>} />
      <Route path="/publications" element={<ProtectedRoute><Publications /></ProtectedRoute>} />
      <Route path="/journals" element={<ProtectedRoute><Journals /></ProtectedRoute>} />
      <Route path="/congresses" element={<ProtectedRoute><Congresses /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
