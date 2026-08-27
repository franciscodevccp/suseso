import { TIPOS_REPORTE } from '../constants/tiposReporte'
import estilos from './SelectorTipoReporte.module.css'

/** Selector del tipo de reporte activo (control de estado, no de router: es una sola página). */
export function SelectorTipoReporte({ tipoSeleccionado, onCambiar }) {
  return (
    <div className={estilos.nav} role="tablist" aria-label="Tipo de reporte">
      {TIPOS_REPORTE.map((tipo) => (
        <button
          key={tipo.id}
          type="button"
          role="tab"
          aria-selected={tipo.id === tipoSeleccionado}
          className={tipo.id === tipoSeleccionado ? `${estilos.pestana} ${estilos.activa}` : estilos.pestana}
          onClick={() => onCambiar(tipo.id)}
        >
          {tipo.etiqueta}
        </button>
      ))}
    </div>
  )
}
