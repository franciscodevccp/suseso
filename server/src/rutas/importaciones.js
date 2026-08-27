/**
 * Importador de la planilla "Vista General" (RQ-24, criterio B.3 —
 * docs/12). Dos pasos: previsualizar (sube el .xlsx, propone el mapeo y
 * valida) y confirmar (inserta en lotes con folios correlativos). La
 * previsualización queda 30 minutos en Configuración; el resultado deja
 * un reporte descargable en Excel.
 *
 * Lo operan Administrador y Gestor de Activos (D-10).
 */
import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import ExcelJS from 'exceljs'
import multer from 'multer'
import { z } from 'zod'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { reservarFolios } from '../dominio/folios.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasImportaciones = Router()

const GESTION = ['Administrador', 'Gestor de Activos']
const TTL_PREVISUALIZACION_MS = 30 * 60 * 1000
const TAMANO_LOTE = 500

const subida = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

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

function sugerirDestino(encabezado) {
  // "Nombre / Descripción" debe ganar como nombre; por eso el orden de la
  // tabla importa y "descripción del bien" se evalúa junto a "nombre".
  for (const [patron, destino] of SUGERENCIAS) {
    if (patron.test(encabezado)) return destino
  }
  return 'ignorar'
}

/** Vida útil por defecto para categorías nuevas (docs/12: por nombre, o 5). */
function vidaUtilPorNombre(nombre) {
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

function comoTextoCelda(valor) {
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
function comoFecha(texto) {
  if (!texto) return null
  const ddmmaaaa = /^([0-3]?\d)-([01]?\d)-(\d{4})$/.exec(texto)
  if (ddmmaaaa) {
    const fecha = new Date(Number(ddmmaaaa[3]), Number(ddmmaaaa[2]) - 1, Number(ddmmaaaa[1]))
    return Number.isNaN(fecha.getTime()) ? null : fecha
  }
  const fecha = new Date(texto)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

function comoValor(texto) {
  if (texto === '') return null
  const limpio = texto.replace(/\$|\s/g, '').replace(/\./g, '').replace(',', '.')
  const numero = Number(limpio)
  return Number.isFinite(numero) ? Math.round(numero) : null
}

/** Aplica el mapeo columna→destino a una fila cruda. */
function mapearFila(fila, columnas, mapeo) {
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
function validar(filas, columnas, mapeo, codigosExistentes) {
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

// --- Paso 1: previsualizar ---------------------------------------------

rutasImportaciones.post(
  '/vista-general/previsualizar',
  autorizar(...GESTION),
  subida.single('archivo'),
  async (req, res, next) => {
    try {
      if (!req.file) throw new ErrorHttp('ARCHIVO_REQUERIDO', 400)
      // .xlsx es un zip: magic bytes "PK" (docs/14: whitelist real, no extensión).
      if (!(req.file.buffer[0] === 0x50 && req.file.buffer[1] === 0x4b)) {
        throw new ErrorHttp('TIPO_NO_PERMITIDO', 415, 'El archivo debe ser una planilla .xlsx.')
      }

      const libro = new ExcelJS.Workbook()
      await libro.xlsx.load(req.file.buffer)
      const hoja = libro.worksheets[0]
      if (!hoja || hoja.rowCount < 2) throw new ErrorHttp('PLANILLA_VACIA', 400)

      const columnas = []
      hoja.getRow(1).eachCell({ includeEmpty: false }, (celda) => {
        columnas.push(comoTextoCelda(celda.value).trim())
      })

      const filas = []
      hoja.eachRow((fila, numero) => {
        if (numero === 1) return
        const celdas = columnas.map((_, i) => {
          const valor = fila.getCell(i + 1).value
          return valor instanceof Date ? valor.toISOString() : (valor ?? '')
        })
        if (celdas.some((c) => comoTextoCelda(c).trim() !== '')) filas.push(celdas)
      })

      const mapeoSugerido = Object.fromEntries(columnas.map((c) => [c, sugerirDestino(c)]))

      // Duplicados contra la BD: se compara por código de barras.
      const indiceCodigo = columnas.findIndex((c) => mapeoSugerido[c] === 'codigoBarras')
      const codigos = indiceCodigo >= 0
        ? filas.map((f) => comoTextoCelda(f[indiceCodigo]).trim()).filter(Boolean)
        : []
      const existentes = new Set(
        (
          await db.activo.findMany({
            where: { codigoBarras: { in: codigos } },
            select: { codigoBarras: true },
          })
        ).map((a) => a.codigoBarras),
      )

      const validacion = validar(filas, columnas, mapeoSugerido, existentes)

      // Catálogos que habría que crear (docs/12).
      const destinoDe = (nombreDestino) => columnas.findIndex((c) => mapeoSugerido[c] === nombreDestino)
      const valoresUnicos = (indice) =>
        indice >= 0
          ? [...new Set(filas.map((f) => comoTextoCelda(f[indice]).trim()).filter(Boolean))]
          : []
      const ubicacionesPlanilla = valoresUnicos(destinoDe('ubicacion'))
      const categoriasPlanilla = valoresUnicos(destinoDe('categoria'))
      const ubicacionesConocidas = new Set((await db.ubicacion.findMany()).map((u) => u.nombre))
      const categoriasConocidas = new Set((await db.categoria.findMany()).map((c) => c.nombre))
      const ubicacionesNuevas = ubicacionesPlanilla.filter((u) => !ubicacionesConocidas.has(u))
      const categoriasNuevas = categoriasPlanilla.filter((c) => !categoriasConocidas.has(c))

      const idPrevisualizacion = randomUUID()
      await db.configuracion.create({
        data: {
          clave: `importacion:${idPrevisualizacion}`,
          valor: { columnas, filas, creadoEn: Date.now(), archivo: req.file.originalname },
        },
      })

      res.json({
        idPrevisualizacion,
        columnas,
        mapeoSugerido,
        muestra: filas.slice(0, 20).map((f) => f.map((c) => comoTextoCelda(c))),
        totalFilas: filas.length,
        validacion: {
          validas: validacion.validas,
          conObservaciones: validacion.conObservaciones,
          errores: [...validacion.errores, ...validacion.observaciones].slice(0, 200),
        },
        ubicacionesNuevas,
        categoriasNuevas,
      })
    } catch (err) {
      next(err)
    }
  },
)

// --- Paso 2: confirmar --------------------------------------------------

const esquemaConfirmar = z.object({
  idPrevisualizacion: z.string().uuid(),
  mapeo: z.record(z.string(), z.enum(DESTINOS)),
  crearCatalogosFaltantes: z.boolean().default(true),
})

rutasImportaciones.post('/vista-general/confirmar', autorizar(...GESTION), async (req, res, next) => {
  const inicio = Date.now()
  try {
    const { idPrevisualizacion, mapeo, crearCatalogosFaltantes } = esquemaConfirmar.parse(req.body)

    const guardada = await db.configuracion.findUnique({
      where: { clave: `importacion:${idPrevisualizacion}` },
    })
    if (!guardada) throw new ErrorHttp('PREVISUALIZACION_NO_ENCONTRADA', 404)
    const { columnas, filas, creadoEn } = guardada.valor
    if (Date.now() - creadoEn > TTL_PREVISUALIZACION_MS) {
      await db.configuracion.delete({ where: { clave: guardada.clave } })
      throw new ErrorHttp('PREVISUALIZACION_EXPIRADA', 410, 'La previsualización expiró; vuelva a subir la planilla.')
    }

    // Codigos ya existentes (pudieron cambiar desde la previsualización).
    const indiceCodigo = columnas.findIndex((c) => mapeo[c] === 'codigoBarras')
    const codigosPlanilla = indiceCodigo >= 0
      ? filas.map((f) => comoTextoCelda(f[indiceCodigo]).trim()).filter(Boolean)
      : []
    const existentes = new Set(
      (
        await db.activo.findMany({
          where: { codigoBarras: { in: codigosPlanilla } },
          select: { codigoBarras: true },
        })
      ).map((a) => a.codigoBarras),
    )

    // Registros a insertar (los inválidos se omiten y se informan).
    const registros = []
    const errores = []
    const vistos = new Set()
    filas.forEach((fila, i) => {
      const numeroFila = i + 2
      const registro = mapearFila(fila, columnas, mapeo)
      if (!registro.nombre) {
        errores.push({ fila: numeroFila, motivo: 'Sin nombre del bien.' })
        return
      }
      const codigo = registro.codigoBarras ?? ''
      if (codigo && (vistos.has(codigo) || existentes.has(codigo))) {
        errores.push({ fila: numeroFila, motivo: `Código ${codigo} duplicado; fila omitida.` })
        return
      }
      if (codigo) vistos.add(codigo)
      registros.push(registro)
    })

    // Catálogos faltantes (docs/12): vida útil por nombre o 5 años.
    const nombresUbicaciones = [...new Set(registros.map((r) => r.ubicacion).filter(Boolean))]
    const nombresCategorias = [...new Set(registros.map((r) => r.categoria).filter(Boolean))]
    const ubicacionesConocidas = new Set((await db.ubicacion.findMany()).map((u) => u.nombre))
    const categoriasConocidas = new Set((await db.categoria.findMany()).map((c) => c.nombre))
    if (crearCatalogosFaltantes) {
      const nuevasUbicaciones = nombresUbicaciones.filter((u) => !ubicacionesConocidas.has(u))
      if (nuevasUbicaciones.length > 0) {
        await db.ubicacion.createMany({
          data: nuevasUbicaciones.map((nombre) => ({
            nombre,
            tipo: /bodega|archivo/i.test(nombre) ? 'bodega' : 'oficina',
          })),
        })
      }
      const nuevasCategorias = nombresCategorias.filter((c) => !categoriasConocidas.has(c))
      if (nuevasCategorias.length > 0) {
        await db.categoria.createMany({
          data: nuevasCategorias.map((nombre) => ({
            nombre,
            vidaUtilAnios: vidaUtilPorNombre(nombre),
          })),
        })
      }
    }

    // Inserción por lotes de 500 con folios correlativos (docs/12).
    const hoy = new Date()
    let creados = 0
    for (let desde = 0; desde < registros.length; desde += TAMANO_LOTE) {
      const lote = registros.slice(desde, desde + TAMANO_LOTE)
      await db.$transaction(async (tx) => {
        const folios = await reservarFolios(tx, 'AF', lote.length)
        await tx.activo.createMany({
          data: lote.map((registro, i) => ({
            folio: folios[i],
            codigoBarras: registro.codigoBarras || folios[i],
            nombre: registro.nombre,
            descripcion: registro.descripcion ?? '',
            categoria: registro.categoria || 'Mobiliario',
            ubicacion: registro.ubicacion || 'Bodega Central',
            responsable: registro.responsable ?? '',
            estado: 'activo',
            valor: comoValor(registro.valor ?? '') ?? 0,
            fechaAlta: comoFecha(registro.fechaAlta ?? '') ?? hoy,
            ...(registro.numero_serie
              ? { camposPersonalizados: { numero_serie: registro.numero_serie } }
              : {}),
          })),
        })
        const insertados = await tx.activo.findMany({
          where: { folio: { in: folios } },
          select: { id: true, fechaAlta: true },
        })
        await tx.movimientoActivo.createMany({
          data: insertados.map((activo) => ({
            activoId: activo.id,
            tipo: 'alta',
            detalle: 'Importado desde planilla Vista General.',
            usuario: req.usuario.nombre,
            usuarioId: req.usuario.id,
            fecha: activo.fechaAlta,
          })),
        })
      })
      creados += lote.length
    }

    await auditar(req, {
      modulo: 'activos',
      accion: 'importacion',
      detalle: `Importación de planilla Vista General: ${creados} activos creados, ${errores.length} filas omitidas.`,
    })

    const duracionMs = Date.now() - inicio
    const resultado = { creados, omitidos: errores.length, errores: errores.slice(0, 500), duracionMs }
    await db.configuracion.update({
      where: { clave: guardada.clave },
      data: { valor: { resultado, archivo: guardada.valor.archivo, creadoEn } },
    })

    res.json({ ...resultado, reporteUrl: `/api/importaciones/${idPrevisualizacion}/reporte` })
  } catch (err) {
    next(err)
  }
})

// Reporte del resultado, descargable como Excel (docs/12).
rutasImportaciones.get('/:id/reporte', autorizar(...GESTION), async (req, res, next) => {
  try {
    const guardada = await db.configuracion.findUnique({
      where: { clave: `importacion:${req.params.id}` },
    })
    const resultado = guardada?.valor?.resultado
    if (!resultado) throw new ErrorHttp('REPORTE_NO_ENCONTRADO', 404)

    const libro = new ExcelJS.Workbook()
    const hoja = libro.addWorksheet('Resultado')
    hoja.columns = [
      { header: 'Fila', key: 'fila', width: 10 },
      { header: 'Motivo', key: 'motivo', width: 80 },
    ]
    hoja.getRow(1).font = { bold: true }
    hoja.addRow({ fila: '—', motivo: `Activos creados: ${resultado.creados}. Filas omitidas: ${resultado.omitidos}. Duración: ${Math.round(resultado.duracionMs / 100) / 10} s.` })
    for (const error of resultado.errores) hoja.addRow(error)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="resultado-importacion.xlsx"')
    await libro.xlsx.write(res)
    res.end()
  } catch (err) {
    next(err)
  }
})
