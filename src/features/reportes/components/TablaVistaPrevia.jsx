import estilos from './TablaVistaPrevia.module.css'

function IconoVacio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 3v3h3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  )
}

/** Vista previa genérica de un reporte { columnas, filas }, con su estado vacío. */
export function TablaVistaPrevia({ columnas, filas, cargando }) {
  if (cargando) {
    return <p className={estilos.cargando}>Generando vista previa…</p>
  }

  if (filas.length === 0) {
    return (
      <div className={estilos.vacio}>
        <span className={estilos.icono}>
          <IconoVacio />
        </span>
        <p className={estilos.mensaje}>No hay datos para este reporte con los filtros actuales</p>
        <p className={estilos.detalle}>Ajusta los filtros o revisa que existan registros en el sistema.</p>
      </div>
    )
  }

  return (
    <div className={estilos.contenedorTabla}>
      <table className={estilos.tabla}>
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th key={columna.clave} scope="col">
                {columna.etiqueta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, indice) => (
            // Las filas del reporte no tienen id propio, solo se listan de una vez (sin reordenar).
            <tr key={indice}>
              {columnas.map((columna) => (
                <td key={columna.clave}>{fila[columna.clave]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
