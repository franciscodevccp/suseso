import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { puedeVerPanel } from './utils/permisos'

/**
 * Bloquea el acceso a los módulos administrativos (Inicio, Activos fijos,
 * Almacén, Alertas, Actas, Auditoría, Usuarios) para el rol Funcionario,
 * incluso si entra por URL directa. Vive anidado dentro de
 * ProtectedRoute, así que ya hay sesión activa cuando esto se evalúa.
 */
export function RutaAdministrativa() {
  const { usuario } = useAuth()

  if (!puedeVerPanel(usuario)) {
    return <Navigate to="/autoconsulta" replace />
  }

  return <Outlet />
}
