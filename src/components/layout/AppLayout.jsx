import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BannerDemostracion } from './BannerDemostracion'
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
  const contenidoRef = useRef(null)
  const { pathname } = useLocation()

  // El scroll vive en <main> (no en la ventana): al cambiar de vista se
  // vuelve arriba, como haría una navegación de página completa.
  useEffect(() => {
    contenidoRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className={estilos.layout}>
      <BannerDemostracion />
      <EncabezadoInstitucional accionDerecha={<MenuPerfil />} />
      <div className={estilos.cuerpo}>
        <Sidebar />
        <main ref={contenidoRef} className={estilos.contenido}>
          <Outlet />
        </main>
      </div>

      {mostrarAviso && (
        <SessionExpiryModal onContinuar={continuarSesion} onCerrarSesion={expirarSesion} />
      )}
    </div>
  )
}
