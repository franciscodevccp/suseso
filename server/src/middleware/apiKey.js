/**
 * Autenticación de la API pública /api/v1 (AD-01 — docs/10, docs/14):
 * cabecera X-API-Key comparada en TIEMPO CONSTANTE (timingSafeEqual sobre
 * hashes de largo fijo). Cada request queda auditado como api/consulta_v1
 * (una fila por request, sin cuerpos).
 */
import { createHash, timingSafeEqual } from 'node:crypto'
import { rateLimit } from 'express-rate-limit'
import { config } from '../config.js'
import { auditar } from './auditoria.js'

const hash = (texto) => createHash('sha256').update(String(texto)).digest()
const HASH_CLAVE = hash(config.API_DEMO_KEY)

export function exigirApiKey(req, res, next) {
  const entregada = req.get('x-api-key')
  if (!entregada || !timingSafeEqual(hash(entregada), HASH_CLAVE)) {
    return res.status(401).json({ codigo: 'NO_AUTORIZADO', mensaje: 'Llave de API inválida.' })
  }
  // Auditoría en segundo plano: no bloquea ni rompe la respuesta.
  auditar(req, {
    modulo: 'api',
    accion: 'consulta_v1',
    detalle: `${req.method} ${req.originalUrl}`,
    usuario: { nombre: 'API' },
  }).catch(() => {})
  next()
}

/** 60 requests por minuto por IP (docs/10). */
export const limitadorV1 = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ codigo: 'DEMASIADAS_CONSULTAS', mensaje: 'Límite de 60 consultas por minuto.' }),
})
