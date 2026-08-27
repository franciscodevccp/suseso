import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { BloqueCodigo } from '../../../components/common/BloqueCodigo'
import estilos from './TarjetaEndpoint.module.css'

const TONO_POR_METODO = { GET: 'exito', POST: 'advertencia' }

/** Documentación de un endpoint: método, ruta, formato y ejemplos de request/response. */
export function TarjetaEndpoint({ endpoint }) {
  return (
    <section id={endpoint.id} className={estilos.tarjeta}>
      <div className={estilos.encabezado}>
        <BadgeEstado etiqueta={endpoint.metodo} tono={TONO_POR_METODO[endpoint.metodo] ?? 'neutro'} />
        <code className={estilos.ruta}>{endpoint.ruta}</code>
      </div>

      <p className={estilos.descripcion}>{endpoint.descripcion}</p>

      <dl className={estilos.formato}>
        <div>
          <dt>Formato de entrada</dt>
          <dd>{endpoint.entrada}</dd>
        </div>
        <div>
          <dt>Formato de salida</dt>
          <dd>JSON (UTF-8)</dd>
        </div>
      </dl>

      {endpoint.requestEjemplo && (
        <BloqueCodigo etiqueta="Ejemplo de solicitud">{endpoint.requestEjemplo}</BloqueCodigo>
      )}
      <BloqueCodigo etiqueta="Ejemplo de respuesta">{endpoint.responseEjemplo}</BloqueCodigo>
    </section>
  )
}
