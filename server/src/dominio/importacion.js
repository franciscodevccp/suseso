/**
 * Lógica PURA del importador de la planilla "Vista General" (RQ-24,
 * docs/12): sugerencia de mapeo, normalización de celdas y validación.
 * Sin base de datos ni Express: probado por las pruebas unitarias.
 */

// Destinos de mapeo que entiende el confirmador.
export const DESTINOS = [
  'codigoBarras',
  'nombre',
  'descripcion',
  'ubicacion',
  'categoria',
  'valor',
  'fechaAlta',
  'responsable',
  'numero_serie', // campo personalizado (docs/08, docs/12)
  'ignorar',
]

// Heurística de encabezados → destino (docs/12 §previsualizar).
const SUGERENCIAS = [
  [/c[oó]digo|codificaci[oó]n/i, 'codigoBarras'],
  [/nombre|descripci[oó]n del bien/i, 'nombre'],
  [/caracter[ií]sticas/i, 'descripcion'],
  [/ubicaci[oó]n/i, 'ubicacion'],
  [/categor[ií]a|familia/i, 'categoria'],
  [/valor|monto/i, 'valor'],
  [/fecha/i, 'fechaAlta'],
  [/responsable|encargado/i, 'responsable'],
  [/serie/i, 'numero_serie'],
]

export function sugerirDestino(encabezado) {
  for (const [patron, destino] of SUGERENCIAS) {
    if (patron.test(encabezado)) return destino
  }
  return 'ignorar'
}

/** Vida útil por defecto para categorías nuevas (docs/12: por nombre, o 5). */
export function vidaUtilPorNombre(nombre) {
  if (/comput|inform[aá]t|impresora|notebook|monitor/i.test(nombre)) return 6
  if (/mobiliario|mueble/i.test(nombre)) return 7
  if (/veh[ií]culo/i.test(nombre)) return 7
  if (/maquinaria/i.test(nombre)) return 15
  if (/audiovisual/i.test(nombre)) return 6
  if (/herramienta/i.test(nombre)) return 8
  if (/instalaci[oó]n/i.test(nombre)) return 10
  if (/aire|refrigeraci[oó]n|clima/i.test(nombre)) return 10
  return 5
}

export function comoTextoCelda(valor) {
  if (valor == null) return ''
  if (valor instanceof Date) return valor.toISOString().slice(0, 10)
  if (typeof valor === 'object') {
    // exceljs entrega richText/fórmulas como objetos.
    if ('richText' in valor) return valor.richText.map((t) => t.text).join('')
    if ('result' in valor) return String(valor.result ?? '')
    if ('text' in valor) return String(valor.text ?? '')
  }
  return String(valor)
}

/** "12-05-2024", "2024-05-12" o Date → Date; null si no se entiende. */
export function comoFecha(texto) {
  if (!texto) return null
  const ddmmaaaa = /^([0-3]?\d)-([01]?\d)-(\d{4})$/.exec(texto)
  if (ddmmaaaa) {
    const fecha = new Date(Number(ddmmaaaa[3]), Number(ddmmaaaa[2]) - 1, Number(ddmmaaaa[1]))
    return Number.isNaN(fecha.getTime()) ? null : fecha
  }
  const fecha = new Date(texto)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

export function comoValor(texto) {
  if (texto === '') return null
  const limpio = texto.replace(/\$|\s/g, '').replace(/\./g, '').replace(',', '.')
  const numero = Number(limpio)
  return Number.isFinite(numero) ? Math.round(numero) : null
}

/** Aplica el mapeo columna→destino a una fila cruda. */
export function mapearFila(fila, columnas, mapeo) {
  const registro = {}
  columnas.forEach((columna, indice) => {
    const destino = mapeo[columna]
    if (!destino || destino === 'ignorar') return
    registro[destino] = comoTextoCelda(fila[indice]).trim()
  })
  return registro
}

/**
 * Valida las filas con un mapeo dado. Duplicados (en el archivo y contra
 * la BD) se omiten; valor/fecha inválidos quedan como observación (se
 * importan con 0 / hoy si el usuario confirma, docs/12).
 */
export function validar(filas, columnas, mapeo, codigosExistentes) {
  const errores = []
  const observaciones = []
  const vistos = new Set()
  let validas = 0

  filas.forEach((fila, i) => {
    const numeroFila = i + 2 // 1 es el encabezado
    const registro = mapearFila(fila, columnas, mapeo)

    if (!registro.nombre && !registro.codigoBarras) {
      errores.push({ fila: numeroFila, columna: '—', motivo: 'Fila vacía o sin nombre ni código.' })
      return
    }
    if (!registro.nombre) {
      errores.push({ fila: numeroFila, columna: 'nombre', motivo: 'Sin nombre del bien.' })
      return
    }
    const codigo = registro.codigoBarras ?? ''
    if (codigo && vistos.has(codigo)) {
      errores.push({ fila: numeroFila, columna: 'código', motivo: `Código ${codigo} repetido en el archivo; se omite.` })
      return
    }
    if (codigo && codigosExistentes.has(codigo)) {
      errores.push({ fila: numeroFila, columna: 'código', motivo: `Código ${codigo} ya existe en el sistema; se omite.` })
      return
    }
    if (codigo) vistos.add(codigo)

    if (registro.valor !== undefined && registro.valor !== '' && comoValor(registro.valor) === null) {
      observaciones.push({ fila: numeroFila, columna: 'valor', motivo: `Valor "${registro.valor}" no numérico; se importará con 0.` })
    }
    if (registro.fechaAlta && comoFecha(registro.fechaAlta) === null) {
      observaciones.push({ fila: numeroFila, columna: 'fecha', motivo: `Fecha "${registro.fechaAlta}" inválida; se usará la fecha de hoy.` })
    }
    validas++
  })

  return { validas, conObservaciones: observaciones.length, errores, observaciones }
}
