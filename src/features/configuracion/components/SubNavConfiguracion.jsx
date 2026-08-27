import { NavLink } from 'react-router-dom'
import estilos from './SubNavConfiguracion.module.css'

const PESTANAS = [
  { to: '/configuracion/vida-util', etiqueta: 'Vida útil' },
  { to: '/configuracion/perfiles', etiqueta: 'Perfiles y permisos' },
]

/** Pestañas del módulo Configuración (mismo patrón que Integraciones). */
export function SubNavConfiguracion() {
  return (
    <nav className={estilos.nav} aria-label="Secciones de Configuración">
      {PESTANAS.map(({ to, etiqueta }) => (
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
