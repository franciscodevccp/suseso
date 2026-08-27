import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { obtenerInfoEstadoSolicitud } from '../../solicitudes/utils/estadoSolicitud'
import * as solicitudesService from '../../solicitudes/services/solicitudesService'
import estilos from './SolicitudesDelItem.module.css'

const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-CL')

/** Solicitudes del portal que incluyen este ítem (docs/11), en la ficha. */
export function SolicitudesDelItem({ itemId }) {
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    solicitudesService
      .obtenerSolicitudes({ itemId })
      .then((filas) => vigente && setSolicitudes(filas))
      .catch(() => {})
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [itemId])

  return (
    <section className={estilos.tarjeta}>
      <h2 className={estilos.tituloSeccion}>Solicitudes que incluyen este ítem</h2>
      {cargando ? (
        <p className={estilos.vacio}>Buscando solicitudes…</p>
      ) : solicitudes.length === 0 ? (
        <p className={estilos.vacio}>Ninguna solicitud del portal incluye este ítem.</p>
      ) : (
        <ul className={estilos.lista}>
          {solicitudes.map((solicitud) => {
            const info = obtenerInfoEstadoSolicitud(solicitud.estado)
            const enSolicitud = solicitud.items.find((item) => item.itemId === itemId)
            return (
              <li key={solicitud.id} className={estilos.filaSolicitud}>
                <Link to="/solicitudes" className={estilos.folio}>
                  {solicitud.folio}
                </Link>
                <span className={estilos.detalle}>
                  {formatearFecha(solicitud.fecha)} — {solicitud.solicitanteNombre}
                  {enSolicitud ? ` — ${enSolicitud.cantidad} solicitado(s)` : ''}
                </span>
                <BadgeEstado etiqueta={info.etiqueta} tono={info.tono} />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
