import { CampoFecha } from '../../../components/common/CampoFecha'
import { Desplegable } from '../../../components/common/Desplegable'
import estilos from './Filtros.module.css'

/** Filtros del reporte de Depreciación: categoría y fecha de corte (docs/09). */
export function FiltrosDepreciacion({ filtros, setFiltros, categorias }) {
  function actualizarCampo(campo, valor) {
    setFiltros((anterior) => ({ ...anterior, [campo]: valor }))
  }

  return (
    <div className={estilos.contenedor}>
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

      <label className={estilos.campoFecha}>
        <span>Fecha de corte</span>
        <CampoFecha
          aria-label="Fecha de corte"
          placeholder="Hoy"
          value={filtros.fechaCorte}
          onChange={(evento) => actualizarCampo('fechaCorte', evento.target.value)}
          className={estilos.inputFecha}
        />
      </label>
    </div>
  )
}
