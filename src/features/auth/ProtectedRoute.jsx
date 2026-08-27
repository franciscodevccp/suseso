import { Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

/**
 * Protege rutas que requieren sesión activa. Si el usuario autenticado
 * tiene una clave temporal pendiente, lo redirige primero al cambio de
 * clave obligatorio antes de dejarlo continuar.
 */
export function ProtectedRoute({ children }) {
  const { estaAutenticado, usuario, cargando } = useAuth()

  if (cargando) return null
  if (!estaAutenticado) return <Navigate to="/login" replace />
  if (usuario.claveTemporal) {
    return <Navigate to="/cambio-clave-obligatorio" replace />
  }

  return children
}
