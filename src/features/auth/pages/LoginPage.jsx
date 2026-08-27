import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { TextField } from '../../../components/common/TextField'
import { PasswordField } from '../../../components/common/PasswordField'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import { useAuth } from '../hooks/useAuth'
import { obtenerMensajeError } from '../constants/mensajes'
import { obtenerRutaInicio } from '../utils/rutaInicio'
import { reiniciarDatosDemo } from '../mock/authService.mock'
import { reiniciarDatosDemo as reiniciarActivosDemo } from '../../activos/mock/activosService.mock'
import { reiniciarDatosDemo as reiniciarActasDemo } from '../../actas/mock/actasService.mock'
import { reiniciarDatosDemo as reiniciarAlmacenDemo } from '../../almacen/mock/almacenService.mock'
import { reiniciarDatosDemo as reiniciarVidaUtilDemo } from '../../depreciacion/mock/vidaUtilService.mock'
import estilos from './LoginPage.module.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Se copia una sola vez a estado local: el mensaje debe mostrarse tras
  // llegar desde otra vista (ej. cambio de clave), pero no debe reaparecer
  // en intentos de login posteriores en esta misma vista, ni si el usuario
  // navega hacia atrás/adelante y vuelve a montar esta página.
  const [mensajeExito, setMensajeExito] = useState(location.state?.mensaje ?? null)

  useEffect(() => {
    if (location.state?.mensaje) {
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setError(null)
    setMensajeExito(null)
    setEnviando(true)
    try {
      const resultado = await login({ email, password })
      navigate(
        resultado.requiereCambioClave
          ? '/cambio-clave-obligatorio'
          : obtenerRutaInicio(resultado.usuario),
      )
    } catch (err) {
      if (err.code === 'CUENTA_BLOQUEADA') {
        navigate('/cuenta-bloqueada')
        return
      }
      setError(obtenerMensajeError(err.code))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      titulo="Iniciar sesión"
      subtitulo="Sistema Integral de Gestión de Activos Fijos y Almacén"
    >
      <form onSubmit={manejarEnvio} noValidate>
        {mensajeExito && !error && <Alert tipo="exito">{mensajeExito}</Alert>}
        {error && <Alert tipo="error">{error}</Alert>}

        <TextField
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="username"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <p className={estilos.enlaceOlvido}>
          <Link to="/recuperar-clave">¿Olvidó su contraseña?</Link>
        </p>

        <div className={estilos.acciones}>
          <Button tipo="submit" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </div>
      </form>

      <details className={estilos.demo}>
        <summary>Cuentas de demostración (entorno mock)</summary>
        <ul>
          <li>admin@suseso.gob.cl / Admin#2024 (Administrador)</li>
          <li>funcionario@suseso.gob.cl / Funcionario#2024 (Funcionario)</li>
        </ul>
        <button
          type="button"
          className={estilos.reiniciar}
          onClick={() => {
            reiniciarDatosDemo()
            reiniciarActivosDemo()
            reiniciarActasDemo()
            reiniciarAlmacenDemo()
            reiniciarVidaUtilDemo()
            window.location.reload()
          }}
        >
          Reiniciar datos de prueba
        </button>
      </details>
    </AuthLayout>
  )
}
