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

// Campos personalizados (RQ-21, docs/08): la definición vive en
// Configuración; los ve todo el panel (el formulario de activos los
// necesita) y los edita solo el Administrador (D-10).
const esquemaCampos = z.array(
  z.object({
    id: z.string().min(1),
    nombre: z.string().min(1),
    tipo: z.enum(['texto', 'numero', 'fecha', 'lista']),
    opciones: z.array(z.string().min(1)).optional(),
    obligatorio: z.boolean().default(false),
    habilitado: z.boolean().default(true),
  }),
)

rutasConfiguracion.get('/campos-personalizados', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const fila = await db.configuracion.findUnique({ where: { clave: 'campos_personalizados' } })
    res.json(fila?.valor ?? [])
  } catch (err) {
    next(err)
  }
})

rutasConfiguracion.put('/campos-personalizados', autorizar('Administrador'), async (req, res, next) => {
  try {
    const campos = esquemaCampos.parse(req.body)
    const ids = new Set(campos.map((campo) => campo.id))
    if (ids.size !== campos.length) throw new ErrorHttp('CAMPO_DUPLICADO', 400)
    for (const campo of campos) {
      if (campo.tipo === 'lista' && !(campo.opciones?.length > 0)) {
        throw new ErrorHttp('OPCIONES_REQUERIDAS', 400)
      }
    }
    await db.configuracion.upsert({
      where: { clave: 'campos_personalizados' },
      update: { valor: campos },
      create: { clave: 'campos_personalizados', valor: campos },
    })
    await auditar(req, {
      modulo: 'configuracion',
      accion: 'campos_personalizados_actualizados',
      detalle: `Definición de campos personalizados actualizada (${campos.length}).`,
    })
    res.json(campos)
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
