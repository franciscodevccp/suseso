import estilos from './HistorialMovimientos.module.css'

/* Tono visual por tipo de movimiento, mismos tonos que BadgeEstado/estadoActivo.js. */
const TONO_POR_TIPO = {
  alta: 'exito',
  traslado: 'advertencia',
  baja: 'error',
  edicion: 'neutro',
}

const ETIQUETA_POR_TIPO = {
  alta: 'Alta',
  edicion: 'Edición',
  baja: 'Baja',
  traslado: 'Traslado',
}

function IconoTipo({ tipo }) {
  switch (tipo) {
    case 'alta':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      )
    case 'baja':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      )
    case 'traslado':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 8h13M13 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 16H7M11 12l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 20l1.5-4.5L16 5l3 3-10.5 10.5L4 20z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
  }
}

const formatearFechaHora = (fecha) =>
  new Date(fecha).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

/** Trazabilidad del activo (altas, ediciones, traslados, bajas), como línea de tiempo. */
export function HistorialMovimientos({ movimientos = [] }) {
  return (
    <section className={estilos.tarjeta} aria-label="Historial de movimientos">
      <h2 className={estilos.titulo}>Historial de movimientos</h2>
      {movimientos.length === 0 ? (
        <div className={estilos.vacio}>
          <p className={estilos.mensaje}>Sin movimientos registrados</p>
          <p className={estilos.detalle}>Las altas, traslados y bajas aparecerán aquí.</p>
        </div>
      ) : (
        <ul className={estilos.linea}>
          {movimientos.map((movimiento) => (
            <li key={movimiento.id} className={estilos.item}>
              <span
                className={`${estilos.punto} ${estilos[TONO_POR_TIPO[movimiento.tipo] ?? 'neutro']}`}
                aria-hidden="true"
              >
                <IconoTipo tipo={movimiento.tipo} />
              </span>
              <div className={estilos.contenido}>
                <p className={estilos.tipoMovimiento}>
                  {ETIQUETA_POR_TIPO[movimiento.tipo] ?? movimiento.tipo}
                </p>
                <p className={estilos.detalleMovimiento}>{movimiento.detalle}</p>
                <p className={estilos.meta}>
                  {formatearFechaHora(movimiento.fecha)} · {movimiento.usuario}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
