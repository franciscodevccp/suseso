import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { obtenerInfoEstadoSolicitud } from '../utils/estadoSolicitud'
import * as solicitudesService from '../services/solicitudesService'
import estilos from './DetalleSolicitudPage.module.css'

const formatearFecha = (fecha) =>
  fecha ? new Date(fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—'

/** Detalle de una solicitud del portal (docs/11). Solo lectura. */
export function DetalleSolicitudPage() {
  const { id } = useParams()
  const [solicitud, setSolicitud] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    solicitudesService
      .obtenerSolicitudPorId(id)
      .then((fila) => vigente && setSolicitud(fila))
      .catch(() => {})
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [id])

  if (cargando) return <p className={estilos.cargando}>Cargando la solicitud…</p>

  if (!solicitud) {
    return (
      <div>
        <Link to="/autoconsulta/solicitudes" className={estilos.volver}>
          ← Volver a mis solicitudes
        </Link>
        <p className={estilos.cargando}>La solicitud no existe o no está disponible.</p>
      </div>
    )
  }

  const info = obtenerInfoEstadoSolicitud(solicitud.estado)

  return (
    <div>
      <Link to="/autoconsulta/solicitudes" className={estilos.volver}>
        ← Volver a mis solicitudes
      </Link>

      <div className={estilos.encabezado}>
        <h1 className={estilos.titulo}>Solicitud {solicitud.folio}</h1>
        <BadgeEstado etiqueta={info.etiqueta} tono={info.tono} />
      </div>

      <section className={estilos.tarjeta}>
        <dl className={estilos.datos}>
          <div>
            <dt>Solicitante</dt>
            <dd>{solicitud.solicitanteNombre}</dd>
          </div>
          <div>
            <dt>Fecha de creación</dt>
            <dd>{formatearFecha(solicitud.fecha)}</dd>
          </div>
          {solicitud.observacion && (
            <div>
              <dt>Observación del solicitante</dt>
              <dd>{solicitud.observacion}</dd>
            </div>
          )}
          {solicitud.resueltaPor && (
            <>
              <div>
                <dt>Resuelta por</dt>
                <dd>{solicitud.resueltaPor}</dd>
              </div>
              <div>
                <dt>Fecha de resolución</dt>
                <dd>{formatearFecha(solicitud.fechaResolucion)}</dd>
              </div>
            </>
          )}
          {solicitud.observacionResolucion && (
            <div>
              <dt>Observación de resolución</dt>
              <dd>{solicitud.observacionResolucion}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className={estilos.tarjeta}>
        <h2 className={estilos.tituloSeccion}>Ítems solicitados</h2>
        <ul className={estilos.items}>
          {solicitud.items.map((item) => (
            <li key={item.id}>
              <span className={estilos.cantidadItem}>{item.cantidad}×</span> {item.itemNombre}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
