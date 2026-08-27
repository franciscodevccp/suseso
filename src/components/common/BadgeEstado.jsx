import estilos from './BadgeEstado.module.css'

/**
 * Badge de color genérico para estados (activos, firma de actas, etc.).
 * Recibe la etiqueta y el tono ya resueltos — cada feature define su
 * propio mapeo estado -> { etiqueta, tono } (ver estadoActivo.js /
 * estadoActa.js) para no acoplar este componente a un dominio.
 */
export function BadgeEstado({ etiqueta, tono }) {
  return <span className={`${estilos.badge} ${estilos[tono]}`}>{etiqueta}</span>
}
