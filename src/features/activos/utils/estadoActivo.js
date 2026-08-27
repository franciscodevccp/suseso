/**
 * Estados posibles de un activo y cómo se representan (etiqueta + tono de
 * color). Fuente única usada por el filtro de estado, el badge de la tabla
 * y el de la ficha, para que no se puedan desincronizar.
 */
export const ESTADOS_ACTIVO = [
  { valor: 'activo', etiqueta: 'Activo', tono: 'exito' },
  { valor: 'en_reparacion', etiqueta: 'En reparación', tono: 'advertencia' },
  { valor: 'dado_de_baja', etiqueta: 'Dado de baja', tono: 'neutro' },
  { valor: 'extraviado', etiqueta: 'Extraviado', tono: 'error' },
]

export function obtenerInfoEstado(valor) {
  return ESTADOS_ACTIVO.find((estado) => estado.valor === valor) ?? ESTADOS_ACTIVO[0]
}
