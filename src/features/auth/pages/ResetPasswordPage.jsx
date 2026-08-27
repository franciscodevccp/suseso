import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { PasswordField } from '../../../components/common/PasswordField'
import { PasswordRequirements } from '../../../components/common/PasswordRequirements'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import { usePasswordRules } from '../hooks/usePasswordRules'
import * as authService from '../services/authService'
import { obtenerMensajeError } from '../constants/mensajes'
import estilos from './ResetPasswordPage.module.css'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [nuevaClave, setNuevaClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const reglas = usePasswordRules(nuevaClave)

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
      await authService.restablecerClave({ token, nuevaClave })
      navigate('/login', {
        state: { mensaje: 'Su contraseña fue restablecida. Ya puede iniciar sesión.' },
      })
    } catch (err) {
      setError(obtenerMensajeError(err.code))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      titulo="Restablecer contraseña"
      subtitulo="Defina una nueva contraseña para su cuenta."
    >
      {!token && (
        <Alert tipo="error">
          El enlace de restablecimiento no incluye un token válido. Solicite
          uno nuevo.
        </Alert>
      )}
      <form onSubmit={manejarEnvio} noValidate>
        {error && <Alert tipo="error">{error}</Alert>}

        <PasswordField
          label="Nueva contraseña"
          name="nuevaClave"
          autoComplete="new-password"
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

        <Button tipo="submit" disabled={enviando || !token}>
          {enviando ? 'Restableciendo…' : 'Restablecer contraseña'}
        </Button>
      </form>

      <Link to="/recuperar-clave" className={estilos.enlaceNuevo}>
        Solicitar un nuevo enlace
      </Link>
    </AuthLayout>
  )
}
