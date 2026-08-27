import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PasswordField } from '../../../components/common/PasswordField'
import { PasswordRequirements } from '../../../components/common/PasswordRequirements'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import { useAuth } from '../hooks/useAuth'
import { usePasswordRules } from '../hooks/usePasswordRules'
import { obtenerMensajeError } from '../constants/mensajes'
import { obtenerRutaInicio } from '../utils/rutaInicio'
import * as authService from '../services/authService'
import estilos from './ChangePasswordPage.module.css'

const MS_ANTES_DE_REDIRIGIR = 2000

/**
 * Vista 7: el usuario cambia su contraseña desde el perfil, con sesión
 * activa. Vive dentro del shell autenticado (AppLayout se lo provee vía
 * ruta anidada), por eso no arma su propio encabezado ni temporizador de
 * inactividad — ya los provee el layout.
 */
export function ChangePasswordPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [claveActual, setClaveActual] = useState('')
  const [nuevaClave, setNuevaClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const reglas = usePasswordRules(nuevaClave)

  useEffect(() => {
    if (!exito) return undefined
    const idTemporizador = setTimeout(
      () => navigate(obtenerRutaInicio(usuario)),
      MS_ANTES_DE_REDIRIGIR,
    )
    return () => clearTimeout(idTemporizador)
  }, [exito, navigate, usuario])

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setError(null)
    setExito(false)

    if (!reglas.esValida) {
      setError('La nueva contraseña no cumple con los requisitos mínimos de seguridad.')
      return
    }
    if (nuevaClave !== confirmacion) {
      setError('Las contraseñas ingresadas no coinciden.')
      return
    }

    setEnviando(true)
    try {
      await authService.cambiarMiClave({
        usuarioId: usuario.id,
        claveActual,
        nuevaClave,
      })
      setExito(true)
      setClaveActual('')
      setNuevaClave('')
      setConfirmacion('')
    } catch (err) {
      setError(obtenerMensajeError(err.code))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={estilos.tarjeta}>
      <h1 className={estilos.titulo}>Cambiar mi contraseña</h1>
      <p className={estilos.subtitulo}>Sesión activa: {usuario.nombre} ({usuario.rol})</p>

      {exito && (
        <Alert tipo="exito">
          Su contraseña fue actualizada correctamente. La estamos redirigiendo al
          inicio…
        </Alert>
      )}
      {error && <Alert tipo="error">{error}</Alert>}

      <form onSubmit={manejarEnvio} noValidate>
        <PasswordField
          label="Contraseña actual"
          name="claveActual"
          autoComplete="current-password"
          required
          value={claveActual}
          onChange={(e) => setClaveActual(e.target.value)}
        />
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

        <Button tipo="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Actualizar contraseña'}
        </Button>
      </form>

      <Link to={obtenerRutaInicio(usuario)}>Volver al inicio</Link>
    </div>
  )
}
