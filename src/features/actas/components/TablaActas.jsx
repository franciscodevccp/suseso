import { Link, useNavigate } from 'react-router-dom'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { obtenerInfoEstadoActa } from '../utils/estadoActa'
import estilos from './TablaActas.module.css'

const ETIQUETA_TIPO = { recepcion: 'Recepción', entrega: 'Entrega' }

function IconoVacio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 3v3h3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13c1-1 2-1 3 0s2 1 3 0" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 17h6" strokeLinecap="round" />
    </svg>
  )
}

/** Tabla del listado de actas, con estado vacío. */
export function TablaActas({ actas, cargando }) {
  const navigate = useNavigate()

  if (cargando) {
    return <p className={estilos.cargando}>Buscando actas…</p>
  }

  if (actas.length === 0) {
    return (
      <div className={estilos.vacio}>
        <span className={estilos.icono}>
          <IconoVacio />
        </span>
        <p className={estilos.mensaje}>Aún no hay actas registradas</p>
        <p className={estilos.detalle}>Las actas de recepción y entrega que crees aparecerán aquí.</p>
      </div>
    )
  }

  function manejarClicFila(evento, id) {
    if (evento.target.closest('a')) return
    navigate(`/actas/${id}`)
  }

  return (
    <div className={estilos.contenedorTabla}>
      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th scope="col">Folio</th>
            <th scope="col">Tipo</th>
            <th scope="col">Activo asociado</th>
            <th scope="col">Responsable</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {actas.map((acta) => (
            <tr key={acta.id} className={estilos.fila} onClick={(e) => manejarClicFila(e, acta.id)}>
              <td data-etiqueta="Folio">
                <Link to={`/actas/${acta.id}`} className={estilos.enlaceFolio}>
                  {acta.folio}
                </Link>
              </td>
              <td data-etiqueta="Tipo">{ETIQUETA_TIPO[acta.tipo] ?? acta.tipo}</td>
              <td data-etiqueta="Activo asociado">
                {acta.activoId ? `${acta.activoFolio} — ${acta.activoNombre}` : 'Sin activo asociado'}
              </td>
              <td data-etiqueta="Responsable">{acta.responsable}</td>
              <td data-etiqueta="Estado">
                <BadgeEstado {...obtenerInfoEstadoActa(acta.estado)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
