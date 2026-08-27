import { Link, useNavigate } from 'react-router-dom'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { obtenerInfoEstado } from '../../activos/utils/estadoActivo'
import estilos from './MisBienesTabla.module.css'

/** Tabla de solo lectura con los bienes a cargo del usuario en sesión. */
export function MisBienesTabla({ activos, cargando }) {
  const navigate = useNavigate()

  if (cargando) {
    return <p className={estilos.cargando}>Buscando sus bienes…</p>
  }

  if (activos.length === 0) {
    return (
      <div className={estilos.vacio}>
        <p className={estilos.mensaje}>Aún no tiene bienes asignados a su nombre</p>
        <p className={estilos.detalle}>
          Cuando se le asigne un activo como responsable, aparecerá aquí.
        </p>
      </div>
    )
  }

  function manejarClicFila(evento, id) {
    if (evento.target.closest('a')) return
    navigate(`/autoconsulta/${id}`)
  }

  return (
    <div className={estilos.contenedorTabla}>
      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th scope="col">Folio</th>
            <th scope="col">Nombre</th>
            <th scope="col">Estado</th>
            <th scope="col">Ubicación</th>
          </tr>
        </thead>
        <tbody>
          {activos.map((activo) => (
            <tr key={activo.id} className={estilos.fila} onClick={(e) => manejarClicFila(e, activo.id)}>
              <td data-etiqueta="Folio">
                <Link to={`/autoconsulta/${activo.id}`} className={estilos.enlaceFolio}>
                  {activo.folio}
                </Link>
              </td>
              <td data-etiqueta="Nombre">{activo.nombre}</td>
              <td data-etiqueta="Estado">
                <BadgeEstado {...obtenerInfoEstado(activo.estado)} />
              </td>
              <td data-etiqueta="Ubicación">{activo.ubicacion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
