/**
 * Aplana la especificación OpenAPI en el modelo que dibujan las tarjetas
 * de la página de documentación. La fuente de verdad es /openapi.yaml:
 * aquí no se inventa nada, solo se reordena.
 */

/** "/activos/{folio}" → "/activos/AF-2026-0001" usando los example del yaml. */
function rutaDeEjemplo(ruta, parametros) {
  let ejemplo = ruta.replace(/\{(\w+)\}/g, (coincidencia, nombre) => {
    const parametro = parametros.find((p) => p.en === 'path' && p.nombre === nombre)
    return parametro?.ejemplo ?? coincidencia
  })
  const requeridos = parametros.filter((p) => p.en === 'query' && p.requerido && p.ejemplo)
  if (requeridos.length > 0) {
    const consulta = requeridos.map((p) => `${p.nombre}=${encodeURIComponent(p.ejemplo)}`).join('&')
    ejemplo = `${ejemplo}?${consulta}`
  }
  return ejemplo
}

function comoParametro(parametro) {
  return {
    nombre: parametro.name,
    en: parametro.in,
    requerido: Boolean(parametro.required),
    tipo: parametro.schema?.enum ? parametro.schema.enum.join(' | ') : (parametro.schema?.type ?? ''),
    ejemplo: parametro.example ?? parametro.schema?.default ?? '',
  }
}

/** Lista plana de endpoints en el orden del yaml, con ruta lista para "Probar". */
export function extraerEndpoints(especificacion) {
  const base = especificacion.servers?.[0]?.url ?? ''
  const endpoints = []

  for (const [ruta, operaciones] of Object.entries(especificacion.paths ?? {})) {
    for (const [metodo, operacion] of Object.entries(operaciones)) {
      const parametros = (operacion.parameters ?? []).map(comoParametro)
      endpoints.push({
        id: `${metodo}-${ruta}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, ''),
        metodo: metodo.toUpperCase(),
        ruta: `${base}${ruta}`,
        resumen: operacion.summary ?? '',
        descripcion: operacion.description?.trim() ?? '',
        parametros,
        rutaEjemplo: `${base}${rutaDeEjemplo(ruta, parametros)}`,
        cuerpoEjemplo: operacion.requestBody?.content?.['application/json']?.example ?? null,
      })
    }
  }
  return endpoints
}
