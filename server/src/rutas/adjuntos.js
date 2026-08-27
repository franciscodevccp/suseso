/**
 * Adjuntos y fotos georreferenciadas (RQ-12, RQ-22 — docs/06, docs/14).
 *
 * Seguridad: multer EN MEMORIA con límite de 10 MB; whitelist por
 * CONTENIDO (magic bytes, nunca por extensión); nombre aleatorio en
 * disco; `storage/` jamás se sirve como estático — la descarga pasa por
 * sesión y la ruta se resuelve y verifica contra el directorio permitido
 * (anti path-traversal).
 */
import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Router } from 'express'
import exifr from 'exifr'
import multer from 'multer'
import { z } from 'zod'
import { config } from '../config.js'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasAdjuntos = Router()

const GESTION = ['Administrador', 'Gestor de Activos']
const DIRECTORIO = path.resolve(config.STORAGE_DIR, 'adjuntos')
await mkdir(DIRECTORIO, { recursive: true })

const subir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
})

// Whitelist por contenido (docs/14): jpeg, png, webp y pdf.
const FIRMAS = [
  { mime: 'image/jpeg', ext: 'jpg', firma: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', ext: 'png', firma: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', ext: 'webp', firma: [0x52, 0x49, 0x46, 0x46], extra: (b) => b.slice(8, 12).toString('ascii') === 'WEBP' },
  { mime: 'application/pdf', ext: 'pdf', firma: [0x25, 0x50, 0x44, 0x46] },
]

function detectarTipoReal(buffer) {
  return FIRMAS.find(
    ({ firma, extra }) =>
      buffer.length > 12 &&
      firma.every((byte, i) => buffer[i] === byte) &&
      (!extra || extra(buffer)),
  )
}

/** Resuelve la ruta en disco de un adjunto, verificando el prefijo. */
function rutaSegura(nombreArchivo) {
  const absoluta = path.resolve(DIRECTORIO, nombreArchivo)
  if (!absoluta.startsWith(DIRECTORIO + path.sep)) {
    throw new ErrorHttp('ADJUNTO_NO_ENCONTRADO', 404)
  }
  return absoluta
}

const esquemaSubida = z.object({
  tipo: z.enum(['foto', 'pdf', 'orden_compra', 'garantia', 'otro']),
  latitud: z.coerce.number().min(-90).max(90).optional(),
  longitud: z.coerce.number().min(-180).max(180).optional(),
})

rutasAdjuntos.post(
  '/activos/:id/adjuntos',
  autorizar(...GESTION),
  subir.single('archivo'),
  async (req, res, next) => {
    try {
      if (!req.file) throw new ErrorHttp('ARCHIVO_REQUERIDO', 400)
      const datos = esquemaSubida.parse(req.body)

      const activo = await db.activo.findUnique({ where: { id: req.params.id } })
      if (!activo) throw new ErrorHttp('ACTIVO_NO_ENCONTRADO', 404)

      const tipoReal = detectarTipoReal(req.file.buffer)
      if (!tipoReal) throw new ErrorHttp('TIPO_NO_PERMITIDO', 415)

      // GPS: EXIF de la foto primero; si no trae, las coordenadas del
      // formulario ("Usar mi ubicación") si vinieron (docs/06).
      let latitud = datos.latitud ?? null
      let longitud = datos.longitud ?? null
      if (tipoReal.mime.startsWith('image/')) {
        const gps = await exifr.gps(req.file.buffer).catch(() => null)
        if (gps?.latitude != null && gps?.longitude != null) {
          latitud = gps.latitude
          longitud = gps.longitude
        }
      }

      const nombreEnDisco = `${randomUUID()}.${tipoReal.ext}`
      await writeFile(rutaSegura(nombreEnDisco), req.file.buffer)

      const creado = await db.$transaction(async (tx) => {
        const adjunto = await tx.adjunto.create({
          data: {
            activoId: activo.id,
            tipo: datos.tipo,
            nombreOriginal: req.file.originalname || nombreEnDisco,
            ruta: nombreEnDisco,
            mime: tipoReal.mime,
            tamano: req.file.size,
            latitud,
            longitud,
            subidoPor: req.usuario.nombre,
          },
        })
        // La primera foto pasa a ser la principal (docs/06).
        if (datos.tipo === 'foto' && !activo.fotoPrincipalId) {
          await tx.activo.update({
            where: { id: activo.id },
            data: { fotoPrincipalId: adjunto.id },
          })
        }
        await auditar(
          req,
          {
            modulo: 'activos',
            accion: 'adjunto_agregado',
            entidad: 'activo',
            entidadId: activo.id,
            entidadFolio: activo.folio,
            detalle: `Adjunto "${adjunto.nombreOriginal}" (${datos.tipo}) agregado a ${activo.folio}.`,
          },
          tx,
        )
        return adjunto
      })

      res.status(201).json(creado)
    } catch (err) {
      // El límite de multer llega como MulterError con código propio.
      if (err?.code === 'LIMIT_FILE_SIZE') {
        return next(new ErrorHttp('ARCHIVO_MUY_GRANDE', 413, 'El archivo supera los 10 MB.'))
      }
      next(err)
    }
  },
)

rutasAdjuntos.post('/activos/:id/foto-principal', autorizar(...GESTION), async (req, res, next) => {
  try {
    const { adjuntoId } = z.object({ adjuntoId: z.string().min(1) }).parse(req.body)
    const [activo, adjunto] = await Promise.all([
      db.activo.findUnique({ where: { id: req.params.id } }),
      db.adjunto.findUnique({ where: { id: adjuntoId } }),
    ])
    if (!activo) throw new ErrorHttp('ACTIVO_NO_ENCONTRADO', 404)
    if (!adjunto || adjunto.activoId !== activo.id || adjunto.tipo !== 'foto') {
      throw new ErrorHttp('ADJUNTO_NO_ENCONTRADO', 404)
    }
    await db.activo.update({ where: { id: activo.id }, data: { fotoPrincipalId: adjunto.id } })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// Descarga autenticada: cualquier rol con sesión (docs/14) — el
// Funcionario también ve las fichas de sus bienes en el portal.
rutasAdjuntos.get('/adjuntos/:id', autorizar(), async (req, res, next) => {
  try {
    const adjunto = await db.adjunto.findUnique({ where: { id: req.params.id } })
    if (!adjunto) throw new ErrorHttp('ADJUNTO_NO_ENCONTRADO', 404)

    const disposicion = adjunto.mime.startsWith('image/') ? 'inline' : 'attachment'
    const nombreLimpio = adjunto.nombreOriginal.replaceAll(/["\\\r\n]/g, '_')
    res.setHeader('Content-Type', adjunto.mime)
    res.setHeader('Content-Disposition', `${disposicion}; filename="${nombreLimpio}"`)
    res.sendFile(rutaSegura(adjunto.ruta), (err) => {
      if (err) next(new ErrorHttp('ADJUNTO_NO_ENCONTRADO', 404))
    })
  } catch (err) {
    next(err)
  }
})

rutasAdjuntos.delete('/adjuntos/:id', autorizar(...GESTION), async (req, res, next) => {
  try {
    const adjunto = await db.adjunto.findUnique({
      where: { id: req.params.id },
      include: { activo: true },
    })
    if (!adjunto) throw new ErrorHttp('ADJUNTO_NO_ENCONTRADO', 404)

    await db.$transaction(async (tx) => {
      if (adjunto.activo.fotoPrincipalId === adjunto.id) {
        await tx.activo.update({
          where: { id: adjunto.activoId },
          data: { fotoPrincipalId: null },
        })
      }
      await tx.adjunto.delete({ where: { id: adjunto.id } })
      await auditar(
        req,
        {
          modulo: 'activos',
          accion: 'adjunto_eliminado',
          entidad: 'activo',
          entidadId: adjunto.activoId,
          entidadFolio: adjunto.activo.folio,
          detalle: `Adjunto "${adjunto.nombreOriginal}" eliminado de ${adjunto.activo.folio}.`,
        },
        tx,
      )
    })
    // El archivo se borra fuera de la transacción; si falla, el registro
    // ya no existe y el huérfano lo limpia el respaldo/rotación.
    await unlink(rutaSegura(adjunto.ruta)).catch(() => {})

    res.status(204).end()
  } catch (err) {
    next(err)
  }
})
