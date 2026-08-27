/**
 * Módulo Usuarios (docs/04, RQ-06/07, DEMO-07). Solo Administrador.
 * La clave temporal se genera acá, se responde UNA sola vez en texto y
 * queda `claveTemporal = true`: el primer ingreso fuerza el cambio (flujo
 * que la UI ya tiene). Las cuentas demo no se tocan (CUENTA_DEMO) y el
 * último Administrador activo no se puede desactivar (ULTIMO_ADMINISTRADOR).
 */
import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import argon2 from 'argon2'
import { z } from 'zod'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { ROL_ENUM, usuarioPublico } from '../dominio/roles.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasUsuarios = Router()

rutasUsuarios.use(autorizar('Administrador'))

const esquemaCrear = z.object({
  nombre: z.string().trim().min(1),
  email: z.email(),
  rol: z.enum(['Administrador', 'Gestor de Activos', 'Consulta', 'Funcionario']),
})
const esquemaEditar = z.object({
  nombre: z.string().trim().min(1),
  rol: z.enum(['Administrador', 'Gestor de Activos', 'Consulta', 'Funcionario']),
})

/** Clave temporal legible que cumple las reglas (mayúscula/minúscula/número/símbolo). */
function generarClaveTemporal() {
  return `Tmp#${randomBytes(6).toString('base64url')}9a`
}

function comoFila(usuario) {
  return { ...usuarioPublico(usuario), esCuentaDemo: usuario.esCuentaDemo }
}

async function usuarioExistente(id) {
  const usuario = await db.usuario.findUnique({ where: { id } })
  if (!usuario) throw new ErrorHttp('USUARIO_NO_ENCONTRADO', 404)
  return usuario
}

function soloNoDemo(usuario) {
  if (usuario.esCuentaDemo) throw new ErrorHttp('CUENTA_DEMO', 403)
}

rutasUsuarios.get('/', async (_req, res, next) => {
  try {
    const usuarios = await db.usuario.findMany({ orderBy: { nombre: 'asc' } })
    res.json(usuarios.map(comoFila))
  } catch (err) {
    next(err)
  }
})

rutasUsuarios.post('/', async (req, res, next) => {
  try {
    const datos = esquemaCrear.parse(req.body)
    const email = datos.email.trim().toLowerCase()
    if (await db.usuario.findUnique({ where: { email } })) {
      throw new ErrorHttp('CORREO_EN_USO', 409)
    }

    const claveTemporal = generarClaveTemporal()
    const claveHash = await argon2.hash(claveTemporal, { type: argon2.argon2id })

    const creado = await db.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nombre: datos.nombre,
          email,
          rol: ROL_ENUM[datos.rol],
          claveHash,
          claveTemporal: true,
        },
      })
      await auditar(
        req,
        {
          modulo: 'usuarios',
          accion: 'creacion',
          entidad: 'usuario',
          entidadId: usuario.id,
          detalle: `Creación del usuario ${usuario.nombre} (${usuario.email}) con rol ${datos.rol}.`,
        },
        tx,
      )
      return usuario
    })

    // La clave temporal viaja UNA sola vez; nunca se guarda en texto.
    res.status(201).json({ usuario: comoFila(creado), claveTemporal })
  } catch (err) {
    next(err)
  }
})

rutasUsuarios.put('/:id', async (req, res, next) => {
  try {
    const datos = esquemaEditar.parse(req.body)
    const usuario = await usuarioExistente(req.params.id)
    soloNoDemo(usuario)

    // Quitarle el rol al último Administrador dejaría el sistema sin admin.
    if (usuario.rol === 'ADMINISTRADOR' && datos.rol !== 'Administrador') {
      const admins = await db.usuario.count({ where: { rol: 'ADMINISTRADOR', estado: 'activo' } })
      if (admins <= 1) throw new ErrorHttp('ULTIMO_ADMINISTRADOR', 409)
    }

    const actualizado = await db.$transaction(async (tx) => {
      const fila = await tx.usuario.update({
        where: { id: usuario.id },
        data: { nombre: datos.nombre, rol: ROL_ENUM[datos.rol] },
      })
      await auditar(
        req,
        {
          modulo: 'usuarios',
          accion: 'edicion',
          entidad: 'usuario',
          entidadId: usuario.id,
          detalle: `Edición del usuario ${fila.nombre} (rol ${datos.rol}).`,
        },
        tx,
      )
      return fila
    })

    res.json({ usuario: comoFila(actualizado) })
  } catch (err) {
    next(err)
  }
})

function accionEstado(accion, datos, textoAuditoria, validar) {
  return async (req, res, next) => {
    try {
      const usuario = await usuarioExistente(req.params.id)
      soloNoDemo(usuario)
      if (validar) await validar(usuario)

      const actualizado = await db.$transaction(async (tx) => {
        const fila = await tx.usuario.update({ where: { id: usuario.id }, data: datos })
        await auditar(
          req,
          {
            modulo: 'usuarios',
            accion,
            entidad: 'usuario',
            entidadId: usuario.id,
            detalle: `${textoAuditoria} ${usuario.nombre} (${usuario.email}).`,
          },
          tx,
        )
        return fila
      })
      res.json({ usuario: comoFila(actualizado) })
    } catch (err) {
      next(err)
    }
  }
}

rutasUsuarios.post('/:id/activar', accionEstado('activacion', { estado: 'activo', intentosFallidos: 0 }, 'Activación de'))

rutasUsuarios.post(
  '/:id/desactivar',
  accionEstado('desactivacion', { estado: 'inactivo' }, 'Desactivación de', async (usuario) => {
    if (usuario.rol === 'ADMINISTRADOR') {
      const admins = await db.usuario.count({ where: { rol: 'ADMINISTRADOR', estado: 'activo' } })
      if (admins <= 1) throw new ErrorHttp('ULTIMO_ADMINISTRADOR', 409)
    }
  }),
)

rutasUsuarios.post('/:id/desbloquear', accionEstado('desbloqueo', { estado: 'activo', intentosFallidos: 0 }, 'Desbloqueo de'))

rutasUsuarios.post('/:id/restablecer-clave', async (req, res, next) => {
  try {
    const usuario = await usuarioExistente(req.params.id)
    soloNoDemo(usuario)

    const claveTemporal = generarClaveTemporal()
    const claveHash = await argon2.hash(claveTemporal, { type: argon2.argon2id })

    const actualizado = await db.$transaction(async (tx) => {
      const fila = await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          claveHash,
          claveTemporal: true,
          intentosFallidos: 0,
          ...(usuario.estado === 'bloqueado' ? { estado: 'activo' } : {}),
        },
      })
      await auditar(
        req,
        {
          modulo: 'usuarios',
          accion: 'restablecimiento_clave',
          entidad: 'usuario',
          entidadId: usuario.id,
          detalle: `Restablecimiento de clave de ${usuario.nombre} (${usuario.email}).`,
        },
        tx,
      )
      return fila
    })

    res.json({ usuario: comoFila(actualizado), claveTemporal })
  } catch (err) {
    next(err)
  }
})
