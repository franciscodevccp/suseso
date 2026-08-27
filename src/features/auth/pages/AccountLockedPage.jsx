import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'

/** Vista 5: cuenta bloqueada tras 5 intentos fallidos. */
export function AccountLockedPage() {
  const navigate = useNavigate()

  return (
    <AuthLayout titulo="Cuenta bloqueada">
      <Alert tipo="advertencia">
        Su cuenta ha sido bloqueada tras 5 intentos fallidos de inicio de
        sesión, como medida de seguridad.
      </Alert>
      <p>
        Para recuperar el acceso, restablezca su contraseña siguiendo las
        instrucciones que le enviaremos a su correo institucional.
      </p>
      <Button variante="primario" onClick={() => navigate('/recuperar-clave')}>
        Recuperar contraseña
      </Button>
    </AuthLayout>
  )
}
