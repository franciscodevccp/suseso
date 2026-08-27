import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { esAdministrador } from '../../auth/utils/permisos'
import estilos from './SubNavConfiguracion.module.css'

// Orden según docs/08: Vida útil, Campos personalizados, Perfiles y
// permisos, Importar planilla, Reiniciar demo. `roles` restringe la
// pestaña (el servidor la protege igual, docs/14).
const PESTANAS = [
  { to: '/configuracion/vida-util', etiqueta: 'Vida útil' },
  { to: '/configuracion/campos-personalizados', etiqueta: 'Campos personalizados' },
  { to: '/configuracion/perfiles', etiqueta: 'Perfiles y permisos' },
  {
    to: '/configuracion/importar',
    etiqueta: 'Importar planilla',
    roles: ['Administrador', 'Gestor de Activos'],
  },
  { to: '/configuracion/reiniciar-demo', etiqueta: 'Reiniciar demo', soloAdministrador: true },
]

/** Pestañas del módulo Configuración (mismo patrón que Integraciones). */
export function SubNavConfiguracion() {
  const { usuario } = useAuth()
  const pestanas = PESTANAS.filter((pestana) => {
    if (pestana.soloAdministrador) return esAdministrador(usuario)
    if (pestana.roles) return pestana.roles.includes(usuario?.rol)
    return true
  })

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
