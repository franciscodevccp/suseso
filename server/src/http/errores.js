/**
 * Error de negocio con código estable (docs/02, docs/03). El servidor
 * responde SIEMPRE errores como { codigo, mensaje }; los servicios del
 * front mapean `codigo` a las clases que la UI ya espera (AuthError, etc.).
 */
import { ZodError } from 'zod'

export class ErrorHttp extends Error {
  constructor(codigo, status = 400, mensaje = '') {
    super(mensaje || codigo)
    this.name = 'ErrorHttp'
    this.codigo = codigo
    this.status = status
  }
}

/** Handler final de Express. Nunca expone stack traces (docs/14). */
export function manejadorErrores(logger) {
  // eslint-disable-next-line no-unused-vars -- Express exige la aridad 4
  return (err, req, res, _next) => {
    if (err instanceof ErrorHttp) {
      return res.status(err.status).json({ codigo: err.codigo, mensaje: err.message })
    }
    if (err instanceof ZodError) {
      const detalle = err.issues.map((p) => p.path.join('.') || 'entrada').join(', ')
      return res.status(400).json({ codigo: 'VALIDACION', mensaje: `Datos inválidos: ${detalle}.` })
    }
    // Violación de único en Prisma (p. ej. código de barras o RFID repetido).
    if (err?.code === 'P2002') {
      return res.status(409).json({
        codigo: 'VALOR_DUPLICADO',
        mensaje: 'Ya existe un registro con ese código de barras o RFID.',
      })
    }
    logger.error({ err, ruta: req.originalUrl }, 'error no controlado')
    return res.status(500).json({ codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
  }
}
