import estilos from './KpiCard.module.css'

/**
 * Tarjeta de indicador. `tono` distingue un cero que es un vacío operativo
 * ("neutro": aún no hay datos) de un cero que es una buena noticia
 * ("positivo": nada pendiente/alertando). El mensaje explica el CERO, así
 * que solo se muestra cuando el valor es cero; con datos reales sobraría.
 */
export function KpiCard({ titulo, valor, formatear, mensaje, tono = 'neutro' }) {
  const valorFormateado = formatear ? formatear(valor) : valor.toLocaleString('es-CL')

  return (
    <article className={estilos.tarjeta}>
      <p className={estilos.titulo}>{titulo}</p>
      <p className={estilos.valor}>{valorFormateado}</p>
      {!valor && <p className={`${estilos.mensaje} ${estilos[tono]}`}>{mensaje}</p>}
    </article>
  )
}
