import { NavLink } from 'react-router-dom'
import estilos from './SubNavIntegraciones.module.css'

const PESTANAS = [
  { to: '/integraciones', etiqueta: 'Documentación API', fin: true },
  { to: '/integraciones/sigfe', etiqueta: 'SIGFE' },
  { to: '/integraciones/mercadopublico', etiqueta: 'Mercado Público' },
]

/** Pestañas para moverse entre las 3 vistas del módulo de Integraciones. */
export function SubNavIntegraciones() {
  return (
    <nav className={estilos.nav} aria-label="Secciones de Integraciones">
      {PESTANAS.map(({ to, etiqueta, fin }) => (
        <NavLink
          key={to}
          to={to}
          end={fin}
          className={({ isActive }) => (isActive ? `${estilos.pestana} ${estilos.activa}` : estilos.pestana)}
        >
          {etiqueta}
        </NavLink>
      ))}
    </nav>
  )
}
