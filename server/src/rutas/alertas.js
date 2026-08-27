/**
 * Alertas (RQ-17, docs/07): calculadas a demanda desde dominio/alertas.js.
 * La pantalla /alertas y el badge del Sidebar llegan en B2; los endpoints
 * quedan listos desde A2 porque el KPI del panel ya las cuenta.
 */
import { Router } from 'express'
import { calcularAlertas } from '../dominio/alertas.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasAlertas = Router()

const PANEL = ['Administrador', 'Gestor de Activos', 'Consulta']

rutasAlertas.get('/', autorizar(...PANEL), async (_req, res, next) => {
  try {
    res.json(await calcularAlertas())
  } catch (err) {
    next(err)
  }
})

rutasAlertas.get('/resumen', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const alertas = await calcularAlertas()
    const porTipo = {}
    for (const alerta of alertas) porTipo[alerta.tipo] = (porTipo[alerta.tipo] ?? 0) + 1
    res.json({ total: alertas.length, porTipo })
  } catch (err) {
    next(err)
  }
})
