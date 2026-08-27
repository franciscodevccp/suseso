/**
 * Apoyo de las pruebas de API (docs/15): sesiones por rol contra el
 * servidor de desarrollo. Una sola sesión por rol por corrida — el rate
 * limit del login (10/15 min) alcanza justo para dos corridas seguidas.
 */
import { readFileSync } from 'node:fs'

export const BASE = 'http://127.0.0.1:3001'

function claveDemo() {
  const env = readFileSync(new URL('../../.env', import.meta.url), 'utf8')
  const linea = env.split(/\r?\n/).find((l) => l.startsWith('CLAVE_DEMO='))
  return linea.slice('CLAVE_DEMO='.length).replace(/^"|"$/g, '')
}

function apiDemoKey() {
  const env = readFileSync(new URL('../../.env', import.meta.url), 'utf8')
  const linea = env.split(/\r?\n/).find((l) => l.startsWith('API_DEMO_KEY='))
  return linea.slice('API_DEMO_KEY='.length).replace(/^"|"$/g, '')
}

export const API_KEY = apiDemoKey()

const RUTA_ESTADO = new URL('./.estado-api.json', import.meta.url)
const sesiones = new Map()

// Cookies persistidas de corridas anteriores: se reusan si siguen vivas,
// así corridas seguidas no agotan el rate limit del login (10/15 min).
try {
  const guardadas = JSON.parse(readFileSync(RUTA_ESTADO, 'utf8'))
  for (const [email, cookie] of Object.entries(guardadas)) sesiones.set(email, cookie)
} catch {
  // primera corrida: sin estado previo
}

async function cookieViva(cookie) {
  // /sesion responde 200 con null sin sesión: se valida el cuerpo.
  const r = await fetch(`${BASE}/api/auth/sesion`, { headers: { cookie } })
  if (r.status !== 200) return false
  const cuerpo = await r.json().catch(() => null)
  return Boolean(cuerpo?.usuario)
}

/** Cookie de sesión para un rol (cacheada en disco entre corridas). */
export async function sesion(email) {
  const previa = sesiones.get(email)
  if (previa && (await cookieViva(previa))) return previa

  const respuesta = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: claveDemo() }),
  })
  if (respuesta.status !== 200) {
    throw new Error(`Login de ${email} falló con ${respuesta.status} (¿rate limit? reinicie la API)`)
  }
  const cookie = respuesta.headers.getSetCookie()[0].split(';')[0]
  sesiones.set(email, cookie)
  const { writeFileSync } = await import('node:fs')
  writeFileSync(RUTA_ESTADO, JSON.stringify(Object.fromEntries(sesiones)))
  return cookie
}

/** Llamada JSON con o sin sesión; devuelve { status, cuerpo }. */
export async function llamar(metodo, ruta, { cookie, cuerpo, headers } = {}) {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      ...(cuerpo !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  })
  const texto = await respuesta.text()
  let json = null
  try {
    json = JSON.parse(texto)
  } catch {
    // respuestas no-JSON (SVG, binarios) quedan como texto
  }
  return { status: respuesta.status, cuerpo: json, texto }
}
