import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { PasswordField } from '../../../components/common/PasswordField'
import { PasswordRequirements } from '../../../components/common/PasswordRequirements'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import { useAuth } from '../hooks/useAuth'
import { usePasswordRules } from '../hooks/usePasswordRules'
import { obtenerMensajeError } from '../constants/mensajes'
import * as authService from '../services/authService'

/** Vista 4: se muestra cuando el usuario inició sesión con clave temporal o vencida. */
export function ForcePasswordChangePage() {
  const { usuario, estaAutenticado, cargando, logout } = useAuth()
  const navigate = useNavigate()

  const [nuevaClave, setNuevaClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const reglas = usePasswordRules(nuevaClave)

  if (cargando) return null
  if (!estaAutenticado) return <Navigate to="/login" replace />
  if (!usuario.claveTemporal) return <Navigate to="/inicio" replace />

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setError(null)

    if (!reglas.esValida) {
      setError('La contraseña no cumple con los requisitos mínimos de seguridad.')
      return
    }
    if (nuevaClave !== confirmacion) {
      setError('Las contraseñas ingresadas no coinciden.')
      return
    }

    setEnviando(true)
    try {
      // Se llama directo al servicio (sin pasar por el contexto) para que
      // el usuario en sesión nunca quede en un estado intermedio
      // "autenticado + claveTemporal false" mientras este componente sigue
      // montado. Se navega ANTES de cerrar sesión: si se hiciera al revés,
      // el `setUsuario(null)` de logout() re-renderiza este componente
      // todavía montado en /cambio-clave-obligatorio, dispara su propio
      // guard declarativo (`!estaAutenticado -> <Navigate to="/login"/>`
      // SIN el mensaje de éxito) y monta /login antes que nuestra propia
      // navegación con estado, perdiendo el mensaje.
      await authService.cambiarClaveObligatoria({ usuarioId: usuario.id, nuevaClave })
      navigate('/login', {
        replace: true,
        state: { mensaje: 'Contraseña actualizada. Ingresa nuevamente.' },
      })
      await logout()
    } catch (err) {
      setError(obtenerMensajeError(err.code))
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      titulo="Cambio de contraseña obligatorio"
      subtitulo="Su contraseña es temporal o venció. Defina una nueva para continuar."
    >
      <form onSubmit={manejarEnvio} noValidate>
        {error && <Alert tipo="error">{error}</Alert>}

        <PasswordField
          label="Nueva contraseña"
          name="nuevaClave"
          autoComplete="new-password"
          autoFocus
          required
          value={nuevaClave}
          onChange={(e) => setNuevaClave(e.target.value)}
        />
        <PasswordRequirements reglas={reglas} />
        <PasswordField
          label="Confirmar nueva contraseña"
          name="confirmacion"
          autoComplete="new-password"
          required
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
        />

        <Button tipo="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar y continuar'}
        </Button>
      </form>
    </AuthLayout>
  )
}
