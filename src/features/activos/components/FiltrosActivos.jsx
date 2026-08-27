import { ESTADOS_ACTIVO } from '../utils/estadoActivo'
import { Desplegable } from '../../../components/common/Desplegable'
import estilos from './FiltrosActivos.module.css'

/** Búsqueda avanzada del listado: texto libre + filtros por categoría/ubicación/responsable/estado (RQ-13). */
export function FiltrosActivos({
  filtros,
  setFiltros,
  categorias,
  ubicaciones,
  responsables = [],
  hayFiltrosActivos,
  onLimpiarFiltros,
}) {
  function actualizarCampo(campo, valor) {
    setFiltros((anterior) => ({ ...anterior, [campo]: valor }))
  }

  return (
    <div className={estilos.contenedor}>
      <input
        type="search"
        aria-label="Buscar por folio, nombre, descripción o código de barras"
        placeholder="Buscar por folio, nombre, descripción o código de barras…"
        value={filtros.texto}
        onChange={(evento) => actualizarCampo('texto', evento.target.value)}
        className={estilos.busqueda}
      />

      <div className={estilos.selects}>
        <Desplegable
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
        </Desplegable>

        <Desplegable
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
        </Desplegable>

        <Desplegable
          aria-label="Filtrar por responsable"
          value={filtros.responsable}
          onChange={(evento) => actualizarCampo('responsable', evento.target.value)}
          className={estilos.select}
        >
          <option value="">Todos los responsables</option>
          {responsables.map((responsable) => (
            <option key={responsable.id} value={responsable.nombre}>
              {responsable.nombre}
            </option>
          ))}
        </Desplegable>

        <Desplegable
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
        </Desplegable>

        {hayFiltrosActivos && (
          <button type="button" className={estilos.limpiar} onClick={onLimpiarFiltros}>
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
