/**
 * Capa de servicio SIMULADA del módulo de acceso.
 *
 * Único archivo que concentra la "base de datos" en memoria/localStorage y
 * todas las funciones async del módulo. El contrato (nombres, parámetros,
 * forma de la respuesta y de los errores) está pensado para reemplazarse
 * más adelante por llamadas reales a una API REST sin tocar las vistas,
 * hooks ni el contexto que consumen este módulo.
 */
import { evaluarClave } from '../utils/passwordRules'

const CLAVE_STORAGE = 'sisga_mock_usuarios'
const SESION_STORAGE = 'sisga_mock_sesion'
const TOKENS_STORAGE = 'sisga_mock_tokens_recuperacion'
const MAX_INTENTOS_FALLIDOS = 5
const DURACION_TOKEN_RECUPERACION_MS = 15 * 60 * 1000

export class AuthError extends Error {
  constructor(code) {
    super(code)
    this.name = 'AuthError'
    this.code = code
  }
}

function retraso(ms = 450) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// --- Datos de prueba -------------------------------------------------------
// Dos cuentas de demostración, sin clave temporal: entran directo a su
// pantalla de inicio (Administrador -> /inicio, Funcionario ->
// /autoconsulta, ver rutaInicio.js). Los demás estados (bloqueo tras 5
// intentos, etc.) se siguen pudiendo ejercitar dinámicamente contra
// cualquiera de estas cuentas a través de la lógica de login normal.
function usuariosSemilla() {
  const ahora = new Date().toISOString()
  return [
    {
      id: 'u-001',
      nombre: 'María Fernanda Silva',
      email: 'admin@suseso.gob.cl',
      clave: 'Admin#2024',
      rol: 'Administrador',
      estado: 'activo',
      claveTemporal: false,
      fechaUltimoCambioClave: ahora,
      intentosFallidos: 0,
    },
    {
      id: 'u-002',
      nombre: 'Funcionario Demo',
      email: 'funcionario@suseso.gob.cl',
      clave: 'Funcionario#2024',
      rol: 'Funcionario',
      estado: 'activo',
      claveTemporal: false,
      fechaUltimoCambioClave: ahora,
      intentosFallidos: 0,
    },
  ]
}

// --- Persistencia local ------------------------------------------------
function leerUsuarios() {
  try {
    const crudo = localStorage.getItem(CLAVE_STORAGE)
    if (!crudo) {
      const semilla = usuariosSemilla()
      guardarUsuarios(semilla)
      return semilla
    }
    return JSON.parse(crudo)
  } catch {
    const semilla = usuariosSemilla()
    guardarUsuarios(semilla)
    return semilla
  }
}

function guardarUsuarios(usuarios) {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(usuarios))
}

function leerTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_STORAGE)) ?? {}
  } catch {
    return {}
  }
}

function guardarTokens(tokens) {
  localStorage.setItem(TOKENS_STORAGE, JSON.stringify(tokens))
}

function generarToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function sinClave(usuario) {
  const { id, nombre, email, rol, estado, claveTemporal, fechaUltimoCambioClave } = usuario
  return { id, nombre, email, rol, estado, claveTemporal, fechaUltimoCambioClave }
}

// --- API pública de la capa mock ---------------------------------------

/**
 * Autentica al usuario. Lanza AuthError con código CREDENCIALES_INVALIDAS,
 * CUENTA_BLOQUEADA o CUENTA_INACTIVA según corresponda. En éxito retorna
 * el usuario (sin datos sensibles), un token de sesión y si corresponde
 * forzar el cambio de clave por ser temporal.
 */
export async function login({ email, password }) {
  await retraso()
  const usuarios = leerUsuarios()
  const emailNormalizado = email.trim().toLowerCase()
  const usuario = usuarios.find((u) => u.email.toLowerCase() === emailNormalizado)

  if (usuario?.estado === 'bloqueado') {
    throw new AuthError('CUENTA_BLOQUEADA')
  }
  if (usuario?.estado === 'inactivo') {
    throw new AuthError('CUENTA_INACTIVA')
  }

  if (!usuario || usuario.clave !== password) {
    if (usuario) {
      usuario.intentosFallidos += 1
      if (usuario.intentosFallidos >= MAX_INTENTOS_FALLIDOS) {
        usuario.estado = 'bloqueado'
        guardarUsuarios(usuarios)
        throw new AuthError('CUENTA_BLOQUEADA')
      }
      guardarUsuarios(usuarios)
    }
    throw new AuthError('CREDENCIALES_INVALIDAS')
  }

  usuario.intentosFallidos = 0
  guardarUsuarios(usuarios)

  const token = generarToken()
  localStorage.setItem(
    SESION_STORAGE,
    JSON.stringify({ token, usuarioId: usuario.id, creadaEn: new Date().toISOString() }),
  )

  return {
    usuario: sinClave(usuario),
    token,
    requiereCambioClave: usuario.claveTemporal,
  }
}

/**
 * Solicita el restablecimiento de clave. Siempre resuelve con éxito
 * genérico (no revela si el correo existe). Como no hay servicio de
 * correo real, la respuesta incluye el enlace simulado para fines de
 * demostración; una API real solo enviaría el correo.
 */
export async function solicitarRecuperacion({ email }) {
  await retraso()
  const usuarios = leerUsuarios()
  const emailNormalizado = email.trim().toLowerCase()
  const usuario = usuarios.find((u) => u.email.toLowerCase() === emailNormalizado)

  let tokenDemo = null
  if (usuario) {
    const tokens = leerTokens()
    const token = generarToken()
    tokens[token] = {
      usuarioId: usuario.id,
      expiraEn: Date.now() + DURACION_TOKEN_RECUPERACION_MS,
    }
    guardarTokens(tokens)
    tokenDemo = token
  }

  return { ok: true, tokenDemo }
}

export async function restablecerClave({ token, nuevaClave }) {
  await retraso()
  const tokens = leerTokens()
  const registro = tokens[token]

  if (!registro) {
    throw new AuthError('TOKEN_INVALIDO')
  }
  if (registro.expiraEn < Date.now()) {
    delete tokens[token]
    guardarTokens(tokens)
    throw new AuthError('TOKEN_EXPIRADO')
  }
  if (!evaluarClave(nuevaClave).esValida) {
    throw new AuthError('CLAVE_NO_CUMPLE_REQUISITOS')
  }

  const usuarios = leerUsuarios()
  const usuario = usuarios.find((u) => u.id === registro.usuarioId)
  if (!usuario) {
    throw new AuthError('USUARIO_NO_ENCONTRADO')
  }

  usuario.clave = nuevaClave
  usuario.claveTemporal = false
  usuario.fechaUltimoCambioClave = new Date().toISOString()
  usuario.intentosFallidos = 0
  if (usuario.estado === 'bloqueado') {
    usuario.estado = 'activo'
  }
  guardarUsuarios(usuarios)

  delete tokens[token]
  guardarTokens(tokens)

  return { ok: true }
}

/** Cambio de clave obligatorio por clave temporal (vista 4). */
export async function cambiarClaveObligatoria({ usuarioId, nuevaClave }) {
  await retraso()
  if (!evaluarClave(nuevaClave).esValida) {
    throw new AuthError('CLAVE_NO_CUMPLE_REQUISITOS')
  }

  const usuarios = leerUsuarios()
  const usuario = usuarios.find((u) => u.id === usuarioId)
  if (!usuario) {
    throw new AuthError('USUARIO_NO_ENCONTRADO')
  }

  usuario.clave = nuevaClave
  usuario.claveTemporal = false
  usuario.fechaUltimoCambioClave = new Date().toISOString()
  guardarUsuarios(usuarios)

  return { usuario: sinClave(usuario) }
}

/** Cambio de clave voluntario desde el perfil, con sesión activa (vista 7). */
export async function cambiarMiClave({ usuarioId, claveActual, nuevaClave }) {
  await retraso()
  const usuarios = leerUsuarios()
  const usuario = usuarios.find((u) => u.id === usuarioId)
  if (!usuario) {
    throw new AuthError('USUARIO_NO_ENCONTRADO')
  }
  if (usuario.clave !== claveActual) {
    throw new AuthError('CLAVE_ACTUAL_INCORRECTA')
  }
  if (nuevaClave === claveActual) {
    throw new AuthError('CLAVE_IGUAL_A_ACTUAL')
  }
  if (!evaluarClave(nuevaClave).esValida) {
    throw new AuthError('CLAVE_NO_CUMPLE_REQUISITOS')
  }

  usuario.clave = nuevaClave
  usuario.claveTemporal = false
  usuario.fechaUltimoCambioClave = new Date().toISOString()
  guardarUsuarios(usuarios)

  return { usuario: sinClave(usuario) }
}

/** Restaura la sesión activa (si existe) al recargar la aplicación. */
export async function obtenerSesionActual() {
  await retraso(150)
  try {
    const sesion = JSON.parse(localStorage.getItem(SESION_STORAGE))
    if (!sesion) return null

    const usuarios = leerUsuarios()
    const usuario = usuarios.find((u) => u.id === sesion.usuarioId)
    if (!usuario || usuario.estado !== 'activo') {
      localStorage.removeItem(SESION_STORAGE)
      return null
    }

    return { usuario: sinClave(usuario), token: sesion.token }
  } catch {
    localStorage.removeItem(SESION_STORAGE)
    return null
  }
}

export async function cerrarSesion() {
  await retraso(150)
  localStorage.removeItem(SESION_STORAGE)
  return { ok: true }
}

/**
 * Borra la "BD" simulada, la sesión y los tokens de recuperación, para
 * volver a las cuentas de demostración en su estado original (útil solo
 * durante pruebas manuales; no tiene equivalente en la futura API real).
 */
export function reiniciarDatosDemo() {
  localStorage.removeItem(CLAVE_STORAGE)
  localStorage.removeItem(SESION_STORAGE)
  localStorage.removeItem(TOKENS_STORAGE)
}
