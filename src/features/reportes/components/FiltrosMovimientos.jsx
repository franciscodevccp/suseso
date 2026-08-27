import { CampoFecha } from '../../../components/common/CampoFecha'
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
        <CampoFecha
          aria-label="Desde"
          value={filtros.desde}
          onChange={(evento) => actualizarCampo('desde', evento.target.value)}
          className={estilos.inputFecha}
        />
      </label>
      <label className={estilos.campoFecha}>
        <span>Hasta</span>
        <CampoFecha
          aria-label="Hasta"
          value={filtros.hasta}
          onChange={(evento) => actualizarCampo('hasta', evento.target.value)}
          className={estilos.inputFecha}
        />
      </label>
    </div>
  )
}
