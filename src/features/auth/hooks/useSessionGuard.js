import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useInactivityTimer } from './useInactivityTimer'

/**
 * Activa el temporizador de inactividad en una vista protegida y expone el
 * estado del aviso previo a la expiración de sesión (vista 6). Usado por
 * las páginas donde el usuario permanece con sesión activa.
 */
export function useSessionGuard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [mostrarAviso, setMostrarAviso] = useState(false)

  const expirarSesion = useCallback(async () => {
    setMostrarAviso(false)
    await logout()
    navigate('/sesion-expirada')
  }, [logout, navigate])

  useInactivityTimer({
    activo: true,
    onAvisoPrevio: () => setMostrarAviso(true),
    onExpirar: expirarSesion,
  })

  return {
    mostrarAviso,
    continuarSesion: () => setMostrarAviso(false),
    expirarSesion,
  }
}
