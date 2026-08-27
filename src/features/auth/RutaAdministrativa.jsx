import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

/**
 * Bloquea el acceso a los módulos administrativos (Inicio, Activos fijos,
 * Almacén, Alertas, Actas y firma, Usuarios) para el rol Funcionario,
 * incluso si entra por URL directa. Vive anidado dentro de
 * ProtectedRoute, así que ya hay sesión activa cuando esto se evalúa.
 */
export function RutaAdministrativa() {
  const { usuario } = useAuth()

  if (usuario.rol === 'Funcionario') {
    return <Navigate to="/autoconsulta" replace />
  }

  return <Outlet />
}
