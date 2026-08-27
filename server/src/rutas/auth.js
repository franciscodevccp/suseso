/**
 * Módulo de acceso (docs/03 §Acceso, docs/04, docs/14). Replica EXACTAMENTE
 * el contrato del mock (regla 3 del CLAUDE.md): mismos códigos de error
 * (CLAVE_NO_CUMPLE_REQUISITOS, CLAVE_IGUAL_A_ACTUAL, …) y mismas formas de
 * respuesta ({ ok, tokenDemo } en recuperación, { usuario } en cambios).
 * La sesión es la cookie; el campo `token` del mock deja de existir.
 */
import { createHash, randomBytes } from 'node:crypto'
import { Router } from 'express'
import argon2 from 'argon2'
import { z } from 'zod'
import { evaluarClave } from '../../../shared/passwordRules.js'
import { config } from '../config.js'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { usuarioPublico } from '../dominio/roles.js'
import { auditar } from '../middleware/auditoria.js'
import { autorizar } from '../middleware/autorizar.js'
import { limitadorLogin, limitadorRecuperacion } from '../middleware/rateLimit.js'

const MAX_INTENTOS_FALLIDOS = 5
const DURACION_TOKEN_RECUPERACION_MS = 15 * 60 * 1000

export const rutasAuth = Router()

const esquemaLogin = z.object({ email: z.email(), password: z.string().min(1) })
const esquemaRecuperar = z.object({ email: z.email() })
const esquemaRestablecer = z.object({ token: z.string().min(1), nuevaClave: z.string().min(1) })
const esquemaClaveNueva = z.object({ nuevaClave: z.string().min(1) })
const esquemaCambioClave = z.object({
  claveActual: z.string().min(1),
  nuevaClave: z.string().min(1),
})

const hashToken = (token) => createHash('sha256').update(token).digest('hex')

function regenerarSesion(req) {
  return new Promise((resolver, rechazar) =>
    req.session.regenerate((err) => (err ? rechazar(err) : resolver())),
  )
}

function destruirSesion(req) {
  return new Promise((resolver) => req.session.destroy(() => resolver()))
}

rutasAuth.post('/login', limitadorLogin, async (req, res, next) => {
  try {
    const { email, password } = esquemaLogin.parse(req.body)
    const emailNormalizado = email.trim().toLowerCase()
    const usuario = await db.usuario.findUnique({ where: { email: emailNormalizado } })

    // Mismo orden que el mock: primero estado, después credenciales.
    if (usuario?.estado === 'bloqueado') throw new ErrorHttp('CUENTA_BLOQUEADA', 403)
    if (usuario?.estado === 'inactivo') throw new ErrorHttp('CUENTA_INACTIVA', 403)

    const claveCorrecta = usuario && (await argon2.verify(usuario.claveHash, password))
    if (!usuario || !claveCorrecta) {
      if (usuario) {
        const intentos = usuario.intentosFallidos + 1
        if (intentos >= MAX_INTENTOS_FALLIDOS) {
          await db.$transaction(async (tx) => {
            await tx.usuario.update({
              where: { id: usuario.id },
              data: { intentosFallidos: intentos, estado: 'bloqueado' },
            })
            await auditar(
              req,
              {
                modulo: 'acceso',
                accion: 'cuenta_bloqueada',
                detalle: `Cuenta bloqueada tras ${intentos} intentos fallidos.`,
                usuario: { id: usuario.id, nombre: usuario.nombre },
              },
              tx,
            )
          })
          throw new ErrorHttp('CUENTA_BLOQUEADA', 403)
        }
        await db.$transaction(async (tx) => {
          await tx.usuario.update({
            where: { id: usuario.id },
            data: { intentosFallidos: intentos },
          })
          await auditar(
            req,
            {
              modulo: 'acceso',
              accion: 'ingreso_fallido',
              detalle: `Intento de ingreso fallido (${intentos} de ${MAX_INTENTOS_FALLIDOS}).`,
              usuario: { id: usuario.id, nombre: usuario.nombre },
            },
            tx,
          )
        })
      }
      throw new ErrorHttp('CREDENCIALES_INVALIDAS', 401)
    }

    await db.$transaction(async (tx) => {
      if (usuario.intentosFallidos > 0) {
        await tx.usuario.update({ where: { id: usuario.id }, data: { intentosFallidos: 0 } })
      }
      await auditar(
        req,
        {
          modulo: 'acceso',
          accion: 'ingreso',
          detalle: 'Inicio de sesión.',
          usuario: { id: usuario.id, nombre: usuario.nombre },
        },
        tx,
      )
    })

    // Regenerar el id de sesión evita fijación de sesión (docs/14).
    await regenerarSesion(req)
    req.session.usuarioId = usuario.id
    req.session.creadaEn = Date.now()

    res.json({ usuario: usuarioPublico(usuario), requiereCambioClave: usuario.claveTemporal })
  } catch (err) {
    next(err)
  }
})

// Tarjetas del login (docs/13): las 4 cuentas demo con su clave visible.
// Activo solo si MOSTRAR_CUENTAS_DEMO=true; se apaga tras la adjudicación.
rutasAuth.get('/cuentas-demo', async (_req, res, next) => {
  try {
    if (config.MOSTRAR_CUENTAS_DEMO !== 'true') {
      throw new ErrorHttp('NO_ENCONTRADO', 404)
    }
    const cuentas = await db.usuario.findMany({
      where: { esCuentaDemo: true },
      orderBy: { rol: 'asc' },
    })
    res.json({
      claveDemo: config.CLAVE_DEMO,
      cuentas: cuentas.map((u) => usuarioPublico(u)).map(({ nombre, email, rol }) => ({ nombre, email, rol })),
    })
  } catch (err) {
    next(err)
  }
})

rutasAuth.get('/sesion', (req, res) => {
  // 200 con null cuando no hay sesión (docs/03), nunca 401.
  res.json(req.usuario ? { usuario: req.usuario } : null)
})

rutasAuth.post('/salir', async (req, res, next) => {
  try {
    if (req.usuario) {
      await auditar(req, { modulo: 'acceso', accion: 'cierre_sesion', detalle: 'Cierre de sesión.' })
    }
    await destruirSesion(req)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

rutasAuth.post('/recuperar', limitadorRecuperacion, async (req, res, next) => {
  try {
    const { email } = esquemaRecuperar.parse(req.body)
    const emailNormalizado = email.trim().toLowerCase()
    const usuario = await db.usuario.findUnique({ where: { email: emailNormalizado } })

    // Respuesta genérica siempre: no revela si el correo existe. El enlace
    // simulado solo se emite para cuentas NO demo (docs/14).
    let tokenDemo = null
    if (usuario && !usuario.esCuentaDemo) {
      const token = randomBytes(32).toString('hex')
      await db.$transaction(async (tx) => {
        await tx.tokenRecuperacion.deleteMany({ where: { usuarioId: usuario.id } })
        await tx.tokenRecuperacion.create({
          data: {
            token: hashToken(token),
            usuarioId: usuario.id,
            expiraEn: new Date(Date.now() + DURACION_TOKEN_RECUPERACION_MS),
          },
        })
        await auditar(
          req,
          {
            modulo: 'acceso',
            accion: 'recuperacion_solicitada',
            detalle: 'Solicitud de recuperación de clave.',
            usuario: { id: usuario.id, nombre: usuario.nombre },
          },
          tx,
        )
      })
      tokenDemo = token
    }

    res.json({ ok: true, tokenDemo })
  } catch (err) {
    next(err)
  }
})

rutasAuth.post('/restablecer', async (req, res, next) => {
  try {
    const { token, nuevaClave } = esquemaRestablecer.parse(req.body)
    const registro = await db.tokenRecuperacion.findUnique({ where: { token: hashToken(token) } })

    if (!registro) throw new ErrorHttp('TOKEN_INVALIDO', 400)
    if (registro.expiraEn < new Date()) {
      await db.tokenRecuperacion.delete({ where: { token: registro.token } })
      throw new ErrorHttp('TOKEN_EXPIRADO', 400)
    }
    if (!evaluarClave(nuevaClave).esValida) throw new ErrorHttp('CLAVE_NO_CUMPLE_REQUISITOS', 400)

    const usuario = await db.usuario.findUnique({ where: { id: registro.usuarioId } })
    if (!usuario) throw new ErrorHttp('USUARIO_NO_ENCONTRADO', 404)
    if (usuario.esCuentaDemo) throw new ErrorHttp('CUENTA_DEMO', 403)

    const claveHash = await argon2.hash(nuevaClave, { type: argon2.argon2id })
    await db.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: usuario.id },
        data: {
          claveHash,
          claveTemporal: false,
          fechaUltimoCambioClave: new Date(),
          intentosFallidos: 0,
          // Igual que el mock: restablecer desbloquea una cuenta bloqueada.
          ...(usuario.estado === 'bloqueado' ? { estado: 'activo' } : {}),
        },
      })
      await tx.tokenRecuperacion.delete({ where: { token: registro.token } })
      await auditar(
        req,
        {
          modulo: 'acceso',
          accion: 'cambio_clave',
          detalle: 'Clave restablecida mediante enlace de recuperación.',
          usuario: { id: usuario.id, nombre: usuario.nombre },
        },
        tx,
      )
    })

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

rutasAuth.post('/cambiar-clave-obligatoria', autorizar(), async (req, res, next) => {
  try {
    // El usuarioId del contrato del mock se ignora: manda la sesión (docs/03).
    const { nuevaClave } = esquemaClaveNueva.parse(req.body)
    if (!evaluarClave(nuevaClave).esValida) throw new ErrorHttp('CLAVE_NO_CUMPLE_REQUISITOS', 400)

    const usuario = await db.usuario.findUnique({ where: { id: req.usuario.id } })
    if (usuario.esCuentaDemo) throw new ErrorHttp('CUENTA_DEMO', 403)

    const claveHash = await argon2.hash(nuevaClave, { type: argon2.argon2id })
    const actualizado = await db.$transaction(async (tx) => {
      const fila = await tx.usuario.update({
        where: { id: usuario.id },
        data: { claveHash, claveTemporal: false, fechaUltimoCambioClave: new Date() },
      })
      await auditar(
        req,
        { modulo: 'acceso', accion: 'cambio_clave', detalle: 'Cambio de clave obligatorio.' },
        tx,
      )
      return fila
    })

    res.json({ usuario: usuarioPublico(actualizado) })
  } catch (err) {
    next(err)
  }
})

rutasAuth.post('/cambiar-mi-clave', autorizar(), async (req, res, next) => {
  try {
    const { claveActual, nuevaClave } = esquemaCambioClave.parse(req.body)
    const usuario = await db.usuario.findUnique({ where: { id: req.usuario.id } })

    if (usuario.esCuentaDemo) throw new ErrorHttp('CUENTA_DEMO', 403)
    if (!(await argon2.verify(usuario.claveHash, claveActual))) {
      throw new ErrorHttp('CLAVE_ACTUAL_INCORRECTA', 400)
    }
    if (nuevaClave === claveActual) throw new ErrorHttp('CLAVE_IGUAL_A_ACTUAL', 400)
    if (!evaluarClave(nuevaClave).esValida) throw new ErrorHttp('CLAVE_NO_CUMPLE_REQUISITOS', 400)

    const claveHash = await argon2.hash(nuevaClave, { type: argon2.argon2id })
    const actualizado = await db.$transaction(async (tx) => {
      const fila = await tx.usuario.update({
        where: { id: usuario.id },
        data: { claveHash, claveTemporal: false, fechaUltimoCambioClave: new Date() },
      })
      await auditar(
        req,
        { modulo: 'acceso', accion: 'cambio_clave', detalle: 'Cambio de clave desde el perfil.' },
        tx,
      )
      return fila
    })

    res.json({ usuario: usuarioPublico(actualizado) })
  } catch (err) {
    next(err)
  }
})
