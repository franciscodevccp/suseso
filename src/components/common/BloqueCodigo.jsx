import estilos from './BloqueCodigo.module.css'

/**
 * Bloque de código monoespaciado genérico (JSON, rutas, ejemplos de
 * request/response). Scroll horizontal propio, nunca de la página.
 */
export function BloqueCodigo({ etiqueta, children }) {
  return (
    <div className={estilos.contenedor}>
      {etiqueta && <p className={estilos.etiqueta}>{etiqueta}</p>}
      <pre className={estilos.bloque}>
        <code>{children}</code>
      </pre>
    </div>
  )
}
