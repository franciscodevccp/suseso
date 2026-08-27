/**
 * Límites de tasa (docs/14): login 10 por IP cada 15 min; recuperación de
 * clave 5 por IP cada hora. Respuesta en el formato { codigo, mensaje }.
 *
 * LOGIN_INTENTOS_15MIN permite subir el límite SOLO en desarrollo (las
 * suites de prueba inician sesión legítimamente muchas veces); si el .env
 * de producción no lo define, queda el valor de docs/14.
 */
import { rateLimit } from 'express-rate-limit'

const LIMITE_LOGIN = Number(process.env.LOGIN_INTENTOS_15MIN) > 0
  ? Number(process.env.LOGIN_INTENTOS_15MIN)
  : 10

function limitador(windowMs, limit) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        codigo: 'DEMASIADOS_INTENTOS',
        mensaje: 'Demasiados intentos. Espere unos minutos y vuelva a intentarlo.',
      }),
  })
}

export const limitadorLogin = limitador(15 * 60 * 1000, LIMITE_LOGIN)
export const limitadorRecuperacion = limitador(60 * 60 * 1000, 5)
