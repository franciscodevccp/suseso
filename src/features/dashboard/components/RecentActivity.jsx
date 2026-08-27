import estilos from './RecentActivity.module.css'

/** Bloque "Actividad reciente". Hoy siempre vacío; ya soporta una lista real. */
export function RecentActivity({ items = [] }) {
  return (
    <section className={estilos.tarjeta} aria-label="Actividad reciente">
      <h2 className={estilos.titulo}>Actividad reciente</h2>
      {items.length === 0 ? (
        <div className={estilos.vacio}>
          <p className={estilos.mensaje}>Aún no hay actividad reciente para mostrar</p>
          <p className={estilos.detalle}>
            Los movimientos de activos e inventario aparecerán aquí.
          </p>
        </div>
      ) : (
        <ul className={estilos.lista}>
          {items.map((item) => (
            <li key={item.id} className={estilos.item}>
              <span className={estilos.descripcion}>{item.descripcion}</span>
              <span className={estilos.fecha}>{item.fecha}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
