import { useEffect, useState } from 'react'
import { Alert } from '../../../components/common/Alert'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { Button } from '../../../components/common/Button'
import { Modal } from '../../../components/common/Modal'
import { useAuth } from '../../auth/hooks/useAuth'
import { obtenerInfoEstadoSolicitud } from '../utils/estadoSolicitud'
import * as solicitudesService from '../services/solicitudesService'
import estilos from './BandejaSolicitudesPage.module.css'

const ROLES_GESTION = ['Administrador', 'Gestor de Activos']

const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-CL')

function resumenItems(items) {
  return items.map((item) => `${item.cantidad}× ${item.itemNombre}`).join(', ')
}

/**
 * Bandeja de solicitudes del panel (docs/11): pestañas Pendientes e
 * Históricas; Aprobar / Rechazar (observación obligatoria) / Entregar
 * (solo aprobadas; genera los egresos de almacén en el servidor).
 */
export function BandejaSolicitudesPage() {
  const { usuario } = useAuth()
  const puedeResolver = ROLES_GESTION.includes(usuario?.rol)

  const [pestana, setPestana] = useState('pendientes')
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState(null)
  const [rechazando, setRechazando] = useState(null) // solicitud en el modal
  const [observacionRechazo, setObservacionRechazo] = useState('')
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    let vigente = true
    solicitudesService
      .obtenerSolicitudes()
      .then((filas) => vigente && setSolicitudes(filas))
      .catch(() => vigente && setMensaje({ tipo: 'error', texto: 'No fue posible cargar las solicitudes.' }))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [])

  // Recarga tras una acción, sin apagar la tabla: los datos previos se
  // quedan mientras llega la respuesta.
  async function cargar() {
    try {
      setSolicitudes(await solicitudesService.obtenerSolicitudes())
    } catch {
      setMensaje({ tipo: 'error', texto: 'No fue posible cargar las solicitudes.' })
    }
  }

  const visibles = solicitudes.filter((solicitud) =>
    pestana === 'pendientes' ? solicitud.estado === 'pendiente' : solicitud.estado !== 'pendiente',
  )
  const totalPendientes = solicitudes.filter((s) => s.estado === 'pendiente').length

  async function ejecutar(accion, exito) {
    setProcesando(true)
    setMensaje(null)
    try {
      await accion()
      setMensaje({ tipo: 'exito', texto: exito })
      await cargar()
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto:
          error?.code === 'STOCK_INSUFICIENTE'
            ? `No se pudo entregar: ${error.message} No se descontó nada.`
            : 'No fue posible completar la acción.',
      })
    } finally {
      setProcesando(false)
    }
  }

  function aprobar(solicitud) {
    ejecutar(
      () => solicitudesService.aprobarSolicitud(solicitud.id),
      `Solicitud ${solicitud.folio} aprobada.`,
    )
  }

  function entregar(solicitud) {
    ejecutar(
      () => solicitudesService.entregarSolicitud(solicitud.id),
      `Solicitud ${solicitud.folio} entregada; egresos de almacén registrados.`,
    )
  }

  async function confirmarRechazo(evento) {
    evento.preventDefault()
    const observacion = observacionRechazo.trim()
    if (!observacion || !rechazando) return
    const folio = rechazando.folio
    const id = rechazando.id
    setRechazando(null)
    setObservacionRechazo('')
    await ejecutar(
      () => solicitudesService.rechazarSolicitud(id, observacion),
      `Solicitud ${folio} rechazada.`,
    )
  }

  return (
    <div>
      <h1 className={estilos.titulo}>Solicitudes</h1>
      <p className={estilos.subtitulo}>
        Solicitudes de insumos enviadas desde el portal de autoconsulta.
      </p>

      <div className={estilos.pestanas} role="tablist" aria-label="Filtrar solicitudes">
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'pendientes'}
          className={pestana === 'pendientes' ? `${estilos.pestana} ${estilos.activa}` : estilos.pestana}
          onClick={() => setPestana('pendientes')}
        >
          Pendientes{totalPendientes > 0 ? ` (${totalPendientes})` : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'historicas'}
          className={pestana === 'historicas' ? `${estilos.pestana} ${estilos.activa}` : estilos.pestana}
          onClick={() => setPestana('historicas')}
        >
          Históricas
        </button>
      </div>

      {mensaje && <Alert tipo={mensaje.tipo}>{mensaje.texto}</Alert>}

      {cargando ? (
        <p className={estilos.cargando}>Cargando solicitudes…</p>
      ) : visibles.length === 0 ? (
        <div className={estilos.vacio}>
          <p className={estilos.mensajeVacio}>
            {pestana === 'pendientes' ? 'No hay solicitudes pendientes' : 'Aún no hay solicitudes resueltas'}
          </p>
        </div>
      ) : (
        <div className={estilos.contenedorTabla}>
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Folio</th>
                <th scope="col">Fecha</th>
                <th scope="col">Solicitante</th>
                <th scope="col">Ítems</th>
                <th scope="col">Estado</th>
                <th scope="col">Observación</th>
                {puedeResolver && <th scope="col" aria-label="Acciones" />}
              </tr>
            </thead>
            <tbody>
              {visibles.map((solicitud) => {
                const info = obtenerInfoEstadoSolicitud(solicitud.estado)
                return (
                  <tr key={solicitud.id} className={estilos.fila}>
                    <td data-etiqueta="Folio" className={estilos.celdaFolio}>
                      {solicitud.folio}
                    </td>
                    <td data-etiqueta="Fecha">{formatearFecha(solicitud.fecha)}</td>
                    <td data-etiqueta="Solicitante">{solicitud.solicitanteNombre}</td>
                    <td data-etiqueta="Ítems" className={estilos.celdaItems}>
                      {resumenItems(solicitud.items)}
                    </td>
                    <td data-etiqueta="Estado">
                      <BadgeEstado etiqueta={info.etiqueta} tono={info.tono} />
                    </td>
                    <td data-etiqueta="Observación" className={estilos.celdaItems}>
                      {solicitud.observacionResolucion || solicitud.observacion || '—'}
                    </td>
                    {puedeResolver && (
                      <td data-etiqueta="Acciones" className={estilos.celdaAcciones}>
                        {solicitud.estado === 'pendiente' && (
                          <>
                            <button
                              type="button"
                              className={estilos.accion}
                              disabled={procesando}
                              onClick={() => aprobar(solicitud)}
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              className={`${estilos.accion} ${estilos.accionRechazo}`}
                              disabled={procesando}
                              onClick={() => setRechazando(solicitud)}
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {solicitud.estado === 'aprobada' && (
                          <button
                            type="button"
                            className={estilos.accion}
                            disabled={procesando}
                            onClick={() => entregar(solicitud)}
                          >
                            Entregar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {rechazando && (
        <Modal
          titulo={`Rechazar la solicitud ${rechazando.folio}`}
          onCerrar={() => {
            setRechazando(null)
            setObservacionRechazo('')
          }}
        >
          <form onSubmit={confirmarRechazo} className={estilos.formularioRechazo}>
            <label className={estilos.campoRechazo}>
              <span>Motivo del rechazo (obligatorio; el solicitante lo verá)</span>
              <textarea
                rows={3}
                value={observacionRechazo}
                onChange={(evento) => setObservacionRechazo(evento.target.value)}
                placeholder="Ej.: el ítem se repone la próxima semana"
                autoFocus
              />
            </label>
            <div className={estilos.accionesModal}>
              <Button
                variante="secundario"
                anchoCompleto={false}
                onClick={() => {
                  setRechazando(null)
                  setObservacionRechazo('')
                }}
              >
                Cancelar
              </Button>
              <Button tipo="submit" anchoCompleto={false} disabled={!observacionRechazo.trim()}>
                Rechazar solicitud
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
