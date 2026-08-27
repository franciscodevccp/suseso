import estilos from './GraficoBarras.module.css'

/**
 * Barras horizontales simples en CSS, sin librerías (docs/07): suficiente
 * para que el panel "se vea vivo" ante la comisión. `series` viene como
 * [{ etiqueta, cantidad, secundario? }].
 */
export function GraficoBarras({ titulo, series }) {
  const maximo = Math.max(...series.map((s) => s.cantidad), 1)

  return (
    <section className={estilos.tarjeta} aria-label={titulo}>
      <h2 className={estilos.titulo}>{titulo}</h2>
      <ul className={estilos.lista}>
        {series.map((serie) => (
          <li key={serie.etiqueta} className={estilos.fila}>
            <div className={estilos.encabezadoFila}>
              <span className={estilos.etiqueta}>{serie.etiqueta}</span>
              <span className={estilos.cantidad}>
                {serie.cantidad.toLocaleString('es-CL')}
                {serie.secundario ? ` · ${serie.secundario}` : ''}
              </span>
            </div>
            <div className={estilos.pista} aria-hidden="true">
              <div
                className={estilos.barra}
                style={{ width: `${Math.max((serie.cantidad / maximo) * 100, 4)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
