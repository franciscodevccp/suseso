import { urlEtiqueta } from '../services/activosService'
import estilos from './EtiquetaActivo.module.css'

/**
 * Etiqueta física de un activo (RQ-19, docs/08): nombre (2 líneas máx.),
 * código de barras Code128 generado por el servidor, folio e institución.
 * En pantalla se ve a escala; al imprimir mide 50×25 mm (la página que la
 * usa define el @page).
 */
export function EtiquetaActivo({ activo }) {
  return (
    <div className={estilos.etiqueta}>
      <p className={estilos.nombre}>{activo.nombre}</p>
      <img
        src={urlEtiqueta(activo.id)}
        alt={`Código de barras ${activo.codigoBarras || activo.folio}`}
        className={estilos.codigo}
      />
      <div className={estilos.pie}>
        <span className={estilos.folio}>{activo.folio}</span>
        <span>SUSESO — Activo fijo</span>
      </div>
    </div>
  )
}
