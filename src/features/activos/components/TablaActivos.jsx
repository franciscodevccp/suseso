import { Link, useNavigate } from 'react-router-dom'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { obtenerInfoEstado } from '../utils/estadoActivo'
import estilos from './TablaActivos.module.css'

function IconoVacio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 8l8-4 8 4-8 4-8-4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8v9l8 4 8-4V8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12v9" strokeLinecap="round" />
    </svg>
  )
}

/** Tabla del listado de activos, con sus dos estados vacíos (sin datos / sin resultados). */
export function TablaActivos({ activos, cargando, hayFiltrosActivos }) {
  const navigate = useNavigate()

  if (cargando) {
    return <p className={estilos.cargando}>Buscando activos…</p>
  }

  if (activos.length === 0) {
    return (
      <div className={estilos.vacio}>
        <span className={estilos.icono}>
          <IconoVacio />
        </span>
        <p className={estilos.mensaje}>
          {hayFiltrosActivos
            ? 'No se encontraron activos con esos criterios'
            : 'Aún no hay activos registrados'}
        </p>
        <p className={estilos.detalle}>
          {hayFiltrosActivos
            ? 'Prueba ajustando la búsqueda o los filtros.'
            : 'Los activos que registres aparecerán aquí.'}
        </p>
      </div>
    )
  }

  // El folio es un <Link> real (accesible por teclado); el resto de la
  // fila navega igual al hacer clic, como conveniencia para mouse — sin
  // duplicar la navegación cuando el clic ya vino del propio link.
  function manejarClicFila(evento, id) {
    if (evento.target.closest('a')) return
    navigate(`/activos-fijos/${id}`)
  }

  return (
    <div className={estilos.contenedorTabla}>
      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th scope="col">Folio</th>
            <th scope="col">Nombre</th>
            <th scope="col">Categoría</th>
            <th scope="col">Ubicación</th>
            <th scope="col">Responsable</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {activos.map((activo) => (
            <tr
              key={activo.id}
              className={estilos.fila}
              onClick={(evento) => manejarClicFila(evento, activo.id)}
            >
              <td>
                <Link to={`/activos-fijos/${activo.id}`} className={estilos.enlaceFolio}>
                  {activo.folio}
                </Link>
              </td>
              <td>{activo.nombre}</td>
              <td>{activo.categoria}</td>
              <td>{activo.ubicacion}</td>
              <td>{activo.responsable}</td>
              <td>
                <BadgeEstado {...obtenerInfoEstado(activo.estado)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
