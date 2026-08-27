import estilos from './EmptyChartCard.module.css'

function IconoGrafico() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 20V10" strokeLinecap="round" />
      <path d="M11 20V4" strokeLinecap="round" />
      <path d="M18 20v-7" strokeLinecap="round" />
      <path d="M3 20h18" strokeLinecap="round" />
    </svg>
  )
}

/** Contenedor de gráfico en estado vacío, reutilizado por ambos gráficos del panel. */
export function EmptyChartCard({ titulo }) {
  return (
    <section className={estilos.tarjeta} aria-label={titulo}>
      <h2 className={estilos.titulo}>{titulo}</h2>
      <div className={estilos.vacio}>
        <span className={estilos.icono}>
          <IconoGrafico />
        </span>
        <p className={estilos.mensaje}>Sin datos para mostrar aún</p>
        <p className={estilos.detalle}>
          Aparecerá aquí en cuanto se registren activos.
        </p>
      </div>
    </section>
  )
}
