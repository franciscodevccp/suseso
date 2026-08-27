/**
 * Barrido visual: a 390px, mide todos los controles (input/select/textarea/
 * botón de desplegable) de cada ruta y reporta los que superan 64px de
 * alto — el síntoma del bug flex-basis-en-columna.
 */
import path from 'node:path'
import { chromium } from '@playwright/test'

import { fileURLToPath } from 'node:url'
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
process.loadEnvFile(path.join(raiz, '.env'))
const CLAVE = process.env.CLAVE_DEMO
const ORIGEN = 'http://localhost:5173'

const RUTAS_ADMIN = [
  '/inicio', '/activos-fijos', '/activos-fijos/nuevo', '/almacen', '/almacen/nuevo',
  '/solicitudes', '/alertas', '/actas', '/actas/nueva', '/integraciones',
  '/integraciones/sigfe', '/integraciones/mercadopublico', '/reportes', '/auditoria',
  '/usuarios', '/configuracion/vida-util', '/configuracion/campos-personalizados',
  '/configuracion/importar', '/configuracion/perfiles', '/autoconsulta',
]
const RUTAS_FUNCIONARIO = [
  '/autoconsulta', '/autoconsulta/solicitudes', '/autoconsulta/solicitudes/nueva',
]

async function sesionDe(navegador, email) {
  const contexto = await navegador.newContext({
    viewport: { width: 390, height: 844 },
    baseURL: ORIGEN,
  })
  const r = await contexto.request.post('/api/auth/login', { data: { email, password: CLAVE } })
  if (!r.ok()) throw new Error(`login ${email}: ${r.status()}`)
  return contexto
}

async function medir(pagina, ruta) {
  await pagina.goto(ruta)
  await pagina.waitForLoadState('networkidle')
  await pagina.waitForTimeout(300)
  return pagina.evaluate(() => {
    const controles = document.querySelectorAll('main input, main textarea, main select, main [role="combobox"]')
    const sospechosos = []
    for (const el of controles) {
      const caja = el.getBoundingClientRect()
      // textarea con rows>=3 puede medir ~90px legítimamente
      const esTextarea = el.tagName === 'TEXTAREA'
      const limite = esTextarea ? 140 : 64
      if (caja.height > limite && caja.width > 0) {
        sospechosos.push({
          tag: el.tagName,
          alto: Math.round(caja.height),
          etiqueta: (el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.className || '').toString().slice(0, 60),
        })
      }
    }
    return sospechosos
  })
}

const navegador = await chromium.launch()
let hallazgos = 0

const admin = await sesionDe(navegador, 'admin@demo.cl')
const paginaAdmin = await admin.newPage()
for (const ruta of RUTAS_ADMIN) {
  const sospechosos = await medir(paginaAdmin, ruta)
  if (sospechosos.length) {
    hallazgos += sospechosos.length
    console.log(`✗ ${ruta}:`, JSON.stringify(sospechosos))
  }
}
await admin.close()

const funcionario = await sesionDe(navegador, 'funcionario@demo.cl')
const paginaFunc = await funcionario.newPage()
for (const ruta of RUTAS_FUNCIONARIO) {
  const sospechosos = await medir(paginaFunc, ruta)
  if (sospechosos.length) {
    hallazgos += sospechosos.length
    console.log(`✗ funcionario ${ruta}:`, JSON.stringify(sospechosos))
  }
}
await funcionario.close()
await navegador.close()

console.log(hallazgos === 0 ? 'BARRIDO LIMPIO: ningún control sobredimensionado a 390px' : `${hallazgos} hallazgo(s)`)
