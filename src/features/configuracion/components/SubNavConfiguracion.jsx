import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { esAdministrador } from '../../auth/utils/permisos'
import estilos from './SubNavConfiguracion.module.css'

const PESTANAS = [
  { to: '/configuracion/vida-util', etiqueta: 'Vida útil' },
  { to: '/configuracion/perfiles', etiqueta: 'Perfiles y permisos' },
  { to: '/configuracion/reiniciar-demo', etiqueta: 'Reiniciar demo', soloAdministrador: true },
]

/** Pestañas del módulo Configuración (mismo patrón que Integraciones). */
export function SubNavConfiguracion() {
  const { usuario } = useAuth()
  const pestanas = PESTANAS.filter(
    (pestana) => !pestana.soloAdministrador || esAdministrador(usuario),
  )

  return (
    <nav className={estilos.nav} aria-label="Secciones de Configuración">
      {pestanas.map(({ to, etiqueta }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => (isActive ? `${estilos.pestana} ${estilos.activa}` : estilos.pestana)}
        >
          {etiqueta}
        </NavLink>
      ))}
    </nav>
  )
}
