import { TEXTO_BANNER_DEMO } from '../../config/producto'
import estilos from './BannerDemostracion.module.css'

/**
 * Banner global de demostración (docs/13): ámbar, delgado, fijo arriba de
 * AppLayout y AuthLayout, visible en TODAS las pantallas desde el login.
 * No se puede cerrar; solo se oculta en la vista de impresión de etiquetas.
 */
export function BannerDemostracion() {
  return (
    <div className={estilos.banner} role="note">
      {TEXTO_BANNER_DEMO}
    </div>
  )
}
