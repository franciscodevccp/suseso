import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { puedeVerPanel } from '../../features/auth/utils/permisos'
import { useResumenAlertas } from '../../features/alertas/hooks/useResumenAlertas'
import estilos from './Sidebar.module.css'

/* Iconos de línea, minimalistas e inline (sin librería externa). */
function IconInicio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconActivos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 7.5 12 12l8-4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconAlmacen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M4 9.5h16" strokeLinecap="round" />
      <path d="M4 14.5h16" strokeLinecap="round" />
      <path d="M9.5 4v16" strokeLinecap="round" />
    </svg>
  )
}

function IconAlertas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  )
}

function IconActas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 3v3h3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14c1-1 2-1 3 0s2 1 3 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconIntegraciones() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 8V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="8" width="14" height="8" rx="2" />
      <path d="M9 20v-2M15 20v-2" strokeLinecap="round" />
    </svg>
  )
}

function IconAutoconsulta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="10" cy="10" r="6" />
      <path d="M20 20l-5.5-5.5" strokeLinecap="round" />
    </svg>
  )
}

function IconReportes() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M8 16v-4M12 16V8M16 16v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconConfiguracion() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19.5a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H4.5a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10a1.7 1.7 0 0 0 1-1.55V4.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10a1.7 1.7 0 0 0 1.55 1h.09a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconUsuarios() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
      <circle cx="17.5" cy="9" r="2.2" />
      <path d="M15.3 14.3c2 .4 3.5 2.1 3.7 4.7" strokeLinecap="round" />
    </svg>
  )
}

function IconAuditoria() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M8 4h11v16H8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 9h4M11.5 12.5h4M11.5 16h4" strokeLinecap="round" />
      <circle cx="6" cy="12" r="2.6" />
      <path d="M6 10.8v1.4l1 .7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// `ocultoPara`: ítems administrativos que el rol Funcionario no ve (su
// sidebar queda reducido a Autoconsulta). `rolRequerido`: lo opuesto,
// visible solo para ese rol puntual (hoy solo Usuarios).
const ITEMS = [
  { to: '/inicio', etiqueta: 'Inicio', Icono: IconInicio, ocultoPara: ['Funcionario'] },
  {
    to: '/activos-fijos',
    etiqueta: 'Activos fijos',
    Icono: IconActivos,
    ocultoPara: ['Funcionario'],
  },
  { to: '/almacen', etiqueta: 'Almacén', Icono: IconAlmacen, ocultoPara: ['Funcionario'] },
  { to: '/alertas', etiqueta: 'Alertas', Icono: IconAlertas, ocultoPara: ['Funcionario'] },
  {
    to: '/actas',
    etiqueta: 'Actas',
    Icono: IconActas,
    ocultoPara: ['Funcionario'],
  },
  {
    to: '/integraciones',
    etiqueta: 'Integraciones',
    Icono: IconIntegraciones,
    ocultoPara: ['Funcionario'],
  },
  { to: '/reportes', etiqueta: 'Reportes', Icono: IconReportes, ocultoPara: ['Funcionario'] },
  { to: '/auditoria', etiqueta: 'Auditoría', Icono: IconAuditoria, ocultoPara: ['Funcionario'] },
  { to: '/autoconsulta', etiqueta: 'Autoconsulta', Icono: IconAutoconsulta },
  {
    to: '/configuracion/vida-util',
    etiqueta: 'Configuración',
    Icono: IconConfiguracion,
    ocultoPara: ['Funcionario'],
  },
  { to: '/usuarios', etiqueta: 'Usuarios', Icono: IconUsuarios, rolRequerido: 'Administrador' },
]

/** Navegación institucional lateral. Colapsa a iconos en pantallas chicas (solo CSS). */
export function Sidebar() {
  const { usuario } = useAuth()
  // Badge de alertas vigentes, refrescado cada 60 s (docs/07).
  const { total: totalAlertas } = useResumenAlertas(puedeVerPanel(usuario))
  const items = ITEMS.filter((item) => {
    if (item.rolRequerido) return item.rolRequerido === usuario.rol
    if (item.ocultoPara) return !item.ocultoPara.includes(usuario.rol)
    return true
  })

  return (
    <nav className={estilos.sidebar} aria-label="Navegación principal">
      <ul className={estilos.lista}>
        {items.map(({ to, etiqueta, Icono }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                isActive ? `${estilos.item} ${estilos.activo}` : estilos.item
              }
              aria-label={
                to === '/alertas' && totalAlertas > 0
                  ? `${etiqueta} (${totalAlertas} vigentes)`
                  : etiqueta
              }
            >
              <span className={estilos.icono}>
                <Icono />
              </span>
              <span className={estilos.etiqueta}>{etiqueta}</span>
              {to === '/alertas' && totalAlertas > 0 && (
                <span className={estilos.badgeAlertas}>{totalAlertas}</span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
