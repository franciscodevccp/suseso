/**
 * Bitácora (RQ-08, docs/05). `auditar` registra una acción con el usuario
 * de la sesión (o "Sistema"), sin contraseñas, tokens ni cuerpos.
 * Cuando la acción muta datos, se pasa el cliente transaccional para que
 * la auditoría viva o muera con la transacción.
 */
import { db } from '../db.js'

/**
 * @param {import('express').Request} req
 * @param {{modulo:string, accion:string, entidad?:string, entidadId?:string,
 *          entidadFolio?:string, detalle:string, usuario?:{id?:string,nombre:string}}} datos
 * @param {{auditoria:{create:Function}}} [cliente] cliente Prisma (tx) — por defecto el global
 */
export function auditar(req, datos, cliente = db) {
  const { modulo, accion, entidad, entidadId, entidadFolio, detalle, usuario } = datos
  const quien = usuario ?? req.usuario ?? { nombre: 'Sistema' }
  return cliente.auditoria.create({
    data: {
      usuarioId: quien.id ?? null,
      usuarioNombre: quien.nombre,
      modulo,
      accion,
      entidad: entidad ?? null,
      entidadId: entidadId ?? null,
      entidadFolio: entidadFolio ?? null,
      detalle,
      ip: req.ip ?? null,
    },
  })
}
