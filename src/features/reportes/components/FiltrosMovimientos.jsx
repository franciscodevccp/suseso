import estilos from './Filtros.module.css'

/** Filtro opcional por rango de fechas para el reporte de Movimientos. */
export function FiltrosMovimientos({ filtros, setFiltros }) {
  function actualizarCampo(campo, valor) {
    setFiltros((anterior) => ({ ...anterior, [campo]: valor }))
  }

  return (
    <div className={estilos.contenedor}>
      <label className={estilos.campoFecha}>
        <span>Desde</span>
        <input
          type="date"
          value={filtros.desde}
          onChange={(evento) => actualizarCampo('desde', evento.target.value)}
          className={estilos.inputFecha}
        />
      </label>
      <label className={estilos.campoFecha}>
        <span>Hasta</span>
        <input
          type="date"
          value={filtros.hasta}
          onChange={(evento) => actualizarCampo('hasta', evento.target.value)}
          className={estilos.inputFecha}
        />
      </label>
    </div>
  )
}
