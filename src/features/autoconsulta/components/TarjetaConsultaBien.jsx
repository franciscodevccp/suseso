import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { obtenerInfoEstado } from '../../activos/utils/estadoActivo'
import estilos from './TarjetaConsultaBien.module.css'

/**
 * Ficha de solo lectura de un activo para el portal de autoconsulta:
 * datos básicos, sin valor contable ni botones de acción. Se usa tanto
 * inline (resultado único de una búsqueda) como dentro de
 * ConsultaActivoPage (/autoconsulta/:id).
 */
export function TarjetaConsultaBien({ activo }) {
  return (
    <section className={estilos.tarjeta} aria-label={`Consulta del bien ${activo.folio}`}>
      <div className={estilos.encabezado}>
        <div>
          <p className={estilos.folio}>{activo.folio}</p>
          <h2 className={estilos.nombre}>{activo.nombre}</h2>
        </div>
        <BadgeEstado {...obtenerInfoEstado(activo.estado)} />
      </div>

      <dl className={estilos.listaDatos}>
        <div>
          <dt>Categoría</dt>
          <dd>{activo.categoria}</dd>
        </div>
        <div>
          <dt>Ubicación</dt>
          <dd>{activo.ubicacion}</dd>
        </div>
        <div>
          <dt>Responsable</dt>
          <dd>{activo.responsable || '—'}</dd>
        </div>
      </dl>
    </section>
  )
}
