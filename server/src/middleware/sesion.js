/**
 * Carga el usuario de la sesión en req.usuario (forma pública, rol
 * visible). No rechaza: eso lo hace `autorizar`. Aplica el TTL absoluto
 * de 8 h (docs/14) — la inactividad de 30 min la maneja la cookie rolling.
 * Si el usuario ya no existe o dejó de estar activo, la sesión se destruye.
 */
import { db } from '../db.js'
import { usuarioPublico } from '../dominio/roles.js'

const TTL_ABSOLUTO_MS = 8 * 60 * 60 * 1000

function destruir(req) {
  return new Promise((resolver) => req.session.destroy(() => resolver()))
}

export async function cargarUsuario(req, _res, next) {
  try {
    const { usuarioId, creadaEn } = req.session ?? {}
    if (!usuarioId) return next()

    if (!creadaEn || Date.now() - creadaEn > TTL_ABSOLUTO_MS) {
      await destruir(req)
      return next()
    }

    const usuario = await db.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario || usuario.estado !== 'activo') {
      await destruir(req)
      return next()
    }

    req.usuario = usuarioPublico(usuario)
    next()
  } catch (err) {
    next(err)
  }
}
