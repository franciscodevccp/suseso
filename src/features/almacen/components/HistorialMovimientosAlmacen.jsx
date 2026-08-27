import estilos from './HistorialMovimientosAlmacen.module.css'

/* Tono visual por tipo de movimiento, mismos tonos que BadgeEstado/estadoStock.js. */
const TONO_POR_TIPO = {
  ingreso: 'exito',
  egreso: 'advertencia',
}

const ETIQUETA_POR_TIPO = {
  ingreso: 'Ingreso',
  egreso: 'Egreso',
}

function IconoTipo({ tipo }) {
  if (tipo === 'ingreso') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 4v16M6 14l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20V4M6 10l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const formatearFechaHora = (fecha) =>
  new Date(fecha).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

/** Trazabilidad del ítem (ingresos y egresos de stock), como línea de tiempo. */
export function HistorialMovimientosAlmacen({ movimientos = [], unidad }) {
  return (
    <section className={estilos.tarjeta} aria-label="Historial de movimientos">
      <h2 className={estilos.titulo}>Historial de movimientos</h2>
      {movimientos.length === 0 ? (
        <div className={estilos.vacio}>
          <p className={estilos.mensaje}>Sin movimientos registrados</p>
          <p className={estilos.detalle}>Los ingresos y egresos de stock aparecerán aquí.</p>
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
                  {' · '}
                  {movimiento.tipo === 'ingreso' ? '+' : '-'}
                  {movimiento.cantidad} {unidad}
                </p>
                <p className={estilos.detalleMovimiento}>{movimiento.motivo}</p>
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
