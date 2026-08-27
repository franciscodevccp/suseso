import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../../components/layout/AuthLayout'
import { Alert } from '../../../components/common/Alert'
import { Button } from '../../../components/common/Button'

/** Vista 6: sesión cerrada automáticamente por inactividad. */
export function SessionExpiredPage() {
  const navigate = useNavigate()

  return (
    <AuthLayout titulo="Sesión expirada">
      <Alert tipo="advertencia">
        Su sesión se cerró automáticamente por inactividad, como medida de
        seguridad.
      </Alert>
      <p>Vuelva a iniciar sesión para continuar utilizando el sistema.</p>
      <Button variante="primario" onClick={() => navigate('/login')}>
        Volver a iniciar sesión
      </Button>
    </AuthLayout>
  )
}
