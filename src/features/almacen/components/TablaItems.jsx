import { Link, useNavigate } from 'react-router-dom'
import { BadgeEstado } from '../../../components/common/BadgeEstado'
import { obtenerInfoStock } from '../utils/estadoStock'
import estilos from './TablaItems.module.css'

function IconoVacio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 7h18M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  )
}

const formatearStock = (item) => `${item.stock} ${item.stock === 1 ? item.unidad : `${item.unidad}s`}`

/** Tabla del listado de ítems de bodega, con su estado vacío. */
export function TablaItems({ items, cargando }) {
  const navigate = useNavigate()

  if (cargando) {
    return <p className={estilos.cargando}>Cargando ítems…</p>
  }

  if (items.length === 0) {
    return (
      <div className={estilos.vacio}>
        <span className={estilos.icono}>
          <IconoVacio />
        </span>
        <p className={estilos.mensaje}>Aún no hay ítems registrados</p>
        <p className={estilos.detalle}>Los ítems de bodega que registres aparecerán aquí.</p>
      </div>
    )
  }

  function manejarClicFila(evento, id) {
    if (evento.target.closest('a')) return
    navigate(`/almacen/${id}`)
  }

  return (
    <div className={estilos.contenedorTabla}>
      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th scope="col">Folio</th>
            <th scope="col">Nombre</th>
            <th scope="col">Categoría</th>
            <th scope="col">Stock</th>
            <th scope="col">Stock mínimo</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={estilos.fila} onClick={(evento) => manejarClicFila(evento, item.id)}>
              <td data-etiqueta="Folio">
                <Link to={`/almacen/${item.id}`} className={estilos.enlaceFolio}>
                  {item.folio}
                </Link>
              </td>
              <td data-etiqueta="Nombre">{item.nombre}</td>
              <td data-etiqueta="Categoría">{item.categoria}</td>
              <td data-etiqueta="Stock">{formatearStock(item)}</td>
              <td data-etiqueta="Stock mínimo">
                {item.stockMinimo} {item.unidad}
              </td>
              <td data-etiqueta="Estado">
                <BadgeEstado {...obtenerInfoStock(item)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
