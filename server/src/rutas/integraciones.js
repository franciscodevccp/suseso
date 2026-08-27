/**
 * Apoyo interno de la página de Integraciones (docs/10):
 * - la exportación SIGFE con sesión (la misma función de dominio que
 *   sirve /api/v1/contabilidad/activos),
 * - las cuentas contables por categoría (T-05, editables por Administrador),
 * - y el botón "Probar": ejecuta la llamada a /api/v1 DESDE el servidor
 *   con la API key demo, que así nunca viaja al navegador (docs/14).
 */
import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config.js'
import { exportacionContable, obtenerCuentasContables } from '../dominio/contabilidad.js'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasIntegraciones = Router()

const PANEL = ['Administrador', 'Gestor de Activos', 'Consulta']

rutasIntegraciones.get('/sigfe', autorizar(...PANEL), async (req, res, next) => {
  try {
    const fechaCorte = req.query.fechaCorte ? new Date(String(req.query.fechaCorte)) : undefined
    res.json(await exportacionContable(fechaCorte))
  } catch (err) {
    next(err)
  }
})

rutasIntegraciones.get('/cuentas-contables', autorizar(...PANEL), async (_req, res, next) => {
  try {
    res.json(await obtenerCuentasContables())
  } catch (err) {
    next(err)
  }
})

rutasIntegraciones.put('/cuentas-contables', autorizar('Administrador'), async (req, res, next) => {
  try {
    const cuentas = z.record(z.string(), z.string()).parse(req.body)
    await db.configuracion.upsert({
      where: { clave: 'cuentas_contables' },
      update: { valor: cuentas },
      create: { clave: 'cuentas_contables', valor: cuentas },
    })
    await auditar(req, {
      modulo: 'configuracion',
      accion: 'cuentas_contables_actualizadas',
      detalle: `Cuentas contables por categoría actualizadas (${Object.keys(cuentas).length}).`,
    })
    res.json(cuentas)
  } catch (err) {
    next(err)
  }
})

// Botón "Probar" (docs/10): solo GET dentro de /api/v1 y el webhook demo.
rutasIntegraciones.post('/probar', autorizar(...PANEL), async (req, res, next) => {
  try {
    const { metodo, ruta, cuerpo } = z
      .object({
        metodo: z.enum(['GET', 'POST']),
        ruta: z.string().startsWith('/api/v1/'),
        cuerpo: z.unknown().optional(),
      })
      .parse(req.body)
    if (metodo === 'POST' && ruta !== '/api/v1/webhooks/contabilidad') {
      throw new ErrorHttp('RUTA_NO_PERMITIDA', 400)
    }

    const respuesta = await fetch(`http://127.0.0.1:${config.PUERTO}${ruta}`, {
      method: metodo,
      headers: {
        'x-api-key': config.API_DEMO_KEY,
        ...(cuerpo !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}),
    })
    res.json({ status: respuesta.status, cuerpo: await respuesta.json().catch(() => null) })
  } catch (err) {
    next(err)
  }
})
