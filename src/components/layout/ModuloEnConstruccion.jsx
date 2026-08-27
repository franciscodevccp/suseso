import estilos from './ModuloEnConstruccion.module.css'

/** Placeholder para módulos del sidebar que todavía no están construidos. */
export function ModuloEnConstruccion({ titulo }) {
  return (
    <div className={estilos.contenedor}>
      <h1 className={estilos.titulo}>{titulo}</h1>
      <p className={estilos.mensaje}>Módulo en construcción</p>
      <p className={estilos.detalle}>
        Esta sección del sistema todavía no está disponible. Vuelva a
        revisar más adelante.
      </p>
    </div>
  )
}
