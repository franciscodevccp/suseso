import { Outlet } from 'react-router-dom'
import { EncabezadoInstitucional } from './EncabezadoInstitucional'
import { MenuPerfil } from './MenuPerfil'
import { Sidebar } from './Sidebar'
import { SessionExpiryModal } from '../../features/auth/components/SessionExpiryModal'
import { useSessionGuard } from '../../features/auth/hooks/useSessionGuard'
import estilos from './AppLayout.module.css'

/**
 * Shell de toda la aplicación autenticada: marca institucional, datos de
 * sesión, navegación lateral y el contenido de la vista activa. El
 * temporizador de inactividad vive aquí una sola vez, en vez de repetirse
 * en cada página protegida.
 */
export function AppLayout() {
  const { mostrarAviso, continuarSesion, expirarSesion } = useSessionGuard()

  return (
    <div className={estilos.layout}>
      <EncabezadoInstitucional accionDerecha={<MenuPerfil />} />
      <div className={estilos.cuerpo}>
        <Sidebar />
        <main className={estilos.contenido}>
          <Outlet />
        </main>
      </div>

      {mostrarAviso && (
        <SessionExpiryModal onContinuar={continuarSesion} onCerrarSesion={expirarSesion} />
      )}
    </div>
  )
}
