import { ESTADOS_ACTIVO } from '../../activos/utils/estadoActivo'
import estilos from './Filtros.module.css'

/** Filtros del reporte de Inventario: categoría, ubicación y estado (mismo patrón que FiltrosActivos). */
export function FiltrosInventario({ filtros, setFiltros, categorias, ubicaciones }) {
  function actualizarCampo(campo, valor) {
    setFiltros((anterior) => ({ ...anterior, [campo]: valor }))
  }

  return (
    <div className={estilos.contenedor}>
      <select
        aria-label="Filtrar por categoría"
        value={filtros.categoria}
        onChange={(evento) => actualizarCampo('categoria', evento.target.value)}
        className={estilos.select}
      >
        <option value="">Todas las categorías</option>
        {categorias.map((categoria) => (
          <option key={categoria.id} value={categoria.nombre}>
            {categoria.nombre}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por ubicación"
        value={filtros.ubicacion}
        onChange={(evento) => actualizarCampo('ubicacion', evento.target.value)}
        className={estilos.select}
      >
        <option value="">Todas las ubicaciones</option>
        {ubicaciones.map((ubicacion) => (
          <option key={ubicacion.id} value={ubicacion.nombre}>
            {ubicacion.nombre}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por estado"
        value={filtros.estado}
        onChange={(evento) => actualizarCampo('estado', evento.target.value)}
        className={estilos.select}
      >
        <option value="">Todos los estados</option>
        {ESTADOS_ACTIVO.map((estado) => (
          <option key={estado.valor} value={estado.valor}>
            {estado.etiqueta}
          </option>
        ))}
      </select>
    </div>
  )
}
