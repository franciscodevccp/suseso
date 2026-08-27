import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { TextField } from '../../../components/common/TextField'
import { Button } from '../../../components/common/Button'
import { Alert } from '../../../components/common/Alert'
import * as authService from '../mock/authService.mock'
import estilos from './ForgotPasswordPage.module.css'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enlaceDemo, setEnlaceDemo] = useState(null)
  const [enviado, setEnviado] = useState(false)

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setEnviando(true)
    try {
      const { tokenDemo } = await authService.solicitarRecuperacion({ email })
      setEnviado(true)
      setEnlaceDemo(tokenDemo ? `/restablecer-clave?token=${tokenDemo}` : null)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      titulo="Recuperar contraseña"
      subtitulo="Ingrese su correo institucional y le enviaremos las instrucciones."
    >
      {enviado ? (
        <>
          <Alert tipo="exito">
            Si el correo ingresado corresponde a una cuenta registrada,
            recibirá un mensaje con instrucciones para restablecer su
            contraseña.
          </Alert>
          {enlaceDemo && (
            <p className={estilos.demo}>
              Entorno de demostración: no existe envío real de correo.{' '}
              <Link to={enlaceDemo}>Continuar al restablecimiento</Link>.
            </p>
          )}
          <Link to="/login" className={estilos.volver}>
            Volver a iniciar sesión
          </Link>
        </>
      ) : (
        <form onSubmit={manejarEnvio} noValidate>
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
          <Button tipo="submit" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar instrucciones'}
          </Button>
          <Link to="/login" className={estilos.volver}>
            Volver a iniciar sesión
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
