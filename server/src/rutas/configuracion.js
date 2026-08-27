/**
 * Configuración del sistema: tabla de vida útil (docs/09) y reinicio de
 * la demo (docs/13, docs/14). La matriz de permisos es la D-10: la tabla
 * la VEN todos los roles del panel, la edita solo el Administrador.
 */
import { Router } from 'express'
import { z } from 'zod'
import { sembrarDemo } from '../../prisma/sembrar.js'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasConfiguracion = Router()

const PANEL = ['Administrador', 'Gestor de Activos', 'Consulta']

rutasConfiguracion.get('/vida-util', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const filas = await db.categoria.findMany({ orderBy: { nombre: 'asc' } })
    res.json(
      filas.map(({ nombre, vidaUtilAnios, vidaUtilAcelerada }) => ({
        categoria: nombre,
        vidaUtilAnios,
        vidaUtilAcelerada,
      })),
    )
  } catch (err) {
    next(err)
  }
})

rutasConfiguracion.put('/vida-util', autorizar('Administrador'), async (req, res, next) => {
  try {
    const filas = z
      .array(
        z.object({
          categoria: z.string().min(1),
          vidaUtilAnios: z.number(),
          vidaUtilAcelerada: z.number().nullish(),
        }),
      )
      .parse(req.body)
    for (const fila of filas) {
      if (!Number.isInteger(fila.vidaUtilAnios) || fila.vidaUtilAnios <= 0) {
        throw new ErrorHttp('VALOR_INVALIDO', 400)
      }
      if (
        fila.vidaUtilAcelerada != null &&
        (!Number.isInteger(fila.vidaUtilAcelerada) || fila.vidaUtilAcelerada <= 0)
      ) {
        throw new ErrorHttp('VALOR_INVALIDO', 400)
      }
    }

    const actualizadas = await db.$transaction(async (tx) => {
      for (const fila of filas) {
        await tx.categoria.update({
          where: { nombre: fila.categoria },
          data: {
            vidaUtilAnios: fila.vidaUtilAnios,
            vidaUtilAcelerada: fila.vidaUtilAcelerada ?? null,
          },
        })
      }
      await auditar(
        req,
        {
          modulo: 'configuracion',
          accion: 'vida_util_actualizada',
          detalle: `Tabla de vida útil actualizada (${filas.length} categorías).`,
        },
        tx,
      )
      return tx.categoria.findMany({ orderBy: { nombre: 'asc' } })
    })

    res.json(
      actualizadas.map(({ nombre, vidaUtilAnios, vidaUtilAcelerada }) => ({
        categoria: nombre,
        vidaUtilAnios,
        vidaUtilAcelerada,
      })),
    )
  } catch (err) {
    next(err)
  }
})

rutasConfiguracion.post('/reiniciar-demo', autorizar('Administrador'), async (req, res, next) => {
  try {
    // Quien reinicia queda registrado ANTES de vaciar (el usuario actual
    // deja de existir con el reseed; su sesión muere en el siguiente request).
    const quien = { nombre: req.usuario.nombre }
    await sembrarDemo(db)
    await auditar(req, {
      modulo: 'configuracion',
      accion: 'demo_reiniciada',
      detalle: 'Datos de demostración restaurados al estado inicial.',
      usuario: quien,
    })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})
