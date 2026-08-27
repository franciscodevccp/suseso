/**
 * Consulta de la bitácora (RQ-08, docs/05): filtros por usuario, módulo,
 * acción, folio y rango de fechas, con paginación (50 por página; tope
 * 5.000 para la exportación). La escritura vive en middleware/auditoria.js.
 */
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasAuditoria = Router()

const PANEL = ['Administrador', 'Gestor de Activos', 'Consulta']

const esquemaConsulta = z.object({
  usuario: z.string().optional().default(''),
  modulo: z.string().optional().default(''),
  accion: z.string().optional().default(''),
  folio: z.string().optional().default(''),
  desde: z.string().optional().default(''),
  hasta: z.string().optional().default(''),
  pagina: z.coerce.number().int().min(1).optional().default(1),
  porPagina: z.coerce.number().int().min(1).max(5000).optional().default(50),
})

rutasAuditoria.get('/', autorizar(...PANEL), async (req, res, next) => {
  try {
    const filtros = esquemaConsulta.parse(req.query)
    const where = {
      ...(filtros.usuario ? { usuarioNombre: filtros.usuario } : {}),
      ...(filtros.modulo ? { modulo: filtros.modulo } : {}),
      ...(filtros.accion ? { accion: { contains: filtros.accion, mode: 'insensitive' } } : {}),
      ...(filtros.folio ? { entidadFolio: { contains: filtros.folio, mode: 'insensitive' } } : {}),
      ...(filtros.desde || filtros.hasta
        ? {
            fecha: {
              ...(filtros.desde ? { gte: new Date(filtros.desde) } : {}),
              ...(filtros.hasta ? { lte: new Date(`${filtros.hasta}T23:59:59`) } : {}),
            },
          }
        : {}),
    }

    const [total, filas] = await Promise.all([
      db.auditoria.count({ where }),
      db.auditoria.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
      }),
    ])

    res.json({ filas, total, pagina: filtros.pagina, porPagina: filtros.porPagina })
  } catch (err) {
    next(err)
  }
})

// Nombres de usuario presentes en la bitácora, para el select del filtro.
rutasAuditoria.get('/usuarios', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const filas = await db.auditoria.findMany({
      select: { usuarioNombre: true },
      distinct: ['usuarioNombre'],
      orderBy: { usuarioNombre: 'asc' },
    })
    res.json(filas.map((f) => f.usuarioNombre))
  } catch (err) {
    next(err)
  }
})
