/**
 * Configuración del sistema. Por ahora solo el reinicio de la demo
 * (docs/13, docs/14): restaura el seed en segundos, solo Administrador.
 * La pantalla Configuración → Reiniciar demo llega en el bloque B2.
 */
import { Router } from 'express'
import { sembrarDemo } from '../../prisma/sembrar.js'
import { db } from '../db.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasConfiguracion = Router()

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
