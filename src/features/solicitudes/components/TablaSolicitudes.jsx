import { Link, useNavigate } from 'react-router-dom'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { obtenerInfoEstadoSolicitud } from '../utils/estadoSolicitud'
import estilos from './TablaSolicitudes.module.css'

const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-CL')

function resumenItems(items) {
  const texto = items.map((item) => `${item.cantidad}× ${item.itemNombre}`).join(', ')
  return texto.length > 80 ? `${texto.slice(0, 77)}…` : texto
}

/**
 * Tabla de solicitudes (docs/11). En el portal muestra las del usuario;
 * con `mostrarSolicitante` sirve para la bandeja del panel. Cada fila
 * lleva a `rutaBase/:id`.
 */
export function TablaSolicitudes({ solicitudes, cargando, mostrarSolicitante = false, rutaBase = '/autoconsulta/solicitudes' }) {
  const navigate = useNavigate()

  if (cargando) return <p className={estilos.cargando}>Buscando solicitudes…</p>

  if (solicitudes.length === 0) {
    return (
      <div className={estilos.vacio}>
        <p className={estilos.mensaje}>No hay solicitudes por aquí</p>
        <p className={estilos.detalle}>Cuando exista una solicitud, aparecerá en esta lista.</p>
      </div>
    )
  }

  function manejarClicFila(evento, id) {
    if (evento.target.closest('a')) return
    navigate(`${rutaBase}/${id}`)
  }

  return (
    <div className={estilos.contenedorTabla}>
      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th scope="col">Folio</th>
            <th scope="col">Fecha</th>
            {mostrarSolicitante && <th scope="col">Solicitante</th>}
            <th scope="col">Ítems</th>
            <th scope="col">Estado</th>
            <th scope="col">Observación de resolución</th>
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((solicitud) => {
            const info = obtenerInfoEstadoSolicitud(solicitud.estado)
            return (
              <tr
                key={solicitud.id}
                className={estilos.fila}
                onClick={(e) => manejarClicFila(e, solicitud.id)}
              >
                <td data-etiqueta="Folio">
                  <Link to={`${rutaBase}/${solicitud.id}`} className={estilos.enlaceFolio}>
                    {solicitud.folio}
                  </Link>
                </td>
                <td data-etiqueta="Fecha">{formatearFecha(solicitud.fecha)}</td>
                {mostrarSolicitante && (
                  <td data-etiqueta="Solicitante">{solicitud.solicitanteNombre}</td>
                )}
                <td data-etiqueta="Ítems" className={estilos.celdaItems}>
                  {resumenItems(solicitud.items)}
                </td>
                <td data-etiqueta="Estado">
                  <BadgeEstado etiqueta={info.etiqueta} tono={info.tono} />
                </td>
                <td data-etiqueta="Observación" className={estilos.celdaObservacion}>
                  {solicitud.observacionResolucion || '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
