/**
 * Exporta los pantallazos del portal para el Anexo 2A (docs/11): las
 * pantallas del flujo en 1366×768 (escritorio) y 390×844 (móvil),
 * numeradas en el orden de la revisión. Corre con `pnpm dev` arriba y el
 * seed cargado:
 *
 *   node scripts/pantallazos.mjs
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const destino = path.join(raiz, 'entregables', 'pantallazos-portal')
const ORIGEN = 'http://localhost:5173'

process.loadEnvFile(path.join(raiz, '.env'))
const CLAVE = process.env.CLAVE_DEMO

const TAMANOS = [
  { sufijo: 'escritorio', viewport: { width: 1366, height: 768 } },
  { sufijo: 'movil', viewport: { width: 390, height: 844 } },
]

async function sesionDe(navegador, email, viewport) {
  const contexto = await navegador.newContext({ viewport, baseURL: ORIGEN })
  const respuesta = await contexto.request.post('/api/auth/login', {
    data: { email, password: CLAVE },
  })
  if (!respuesta.ok()) throw new Error(`login de ${email} falló: ${respuesta.status()}`)
  return contexto
}

async function capturar(pagina, nombre, sufijo) {
  await pagina.waitForLoadState('networkidle')
  await pagina.waitForTimeout(400)
  await pagina.screenshot({ path: path.join(destino, `${nombre}-${sufijo}.png`), fullPage: false })
  console.log(`  ✓ ${nombre}-${sufijo}.png`)
}

await mkdir(destino, { recursive: true })
const navegador = await chromium.launch()

for (const { sufijo, viewport } of TAMANOS) {
  console.log(`— ${sufijo} (${viewport.width}×${viewport.height})`)

  // 01: login con las tarjetas de demostración (sin sesión).
  const anonimo = await navegador.newContext({ viewport, baseURL: ORIGEN })
  const login = await anonimo.newPage()
  await login.goto('/login')
  await capturar(login, '01-login', sufijo)
  await anonimo.close()

  // Portal del Funcionario.
  const funcionario = await sesionDe(navegador, 'funcionario@demo.cl', viewport)
  const portal = await funcionario.newPage()

  await portal.goto('/autoconsulta')
  await capturar(portal, '02-mis-bienes', sufijo)

  await portal.locator('a[href^="/autoconsulta/"]').first().click()
  await capturar(portal, '03-ficha-bien', sufijo)

  await portal.goto('/autoconsulta/solicitudes/nueva')
  await capturar(portal, '04-nueva-solicitud', sufijo)

  await portal.goto('/autoconsulta/solicitudes')
  await capturar(portal, '05-mis-solicitudes', sufijo)
  await funcionario.close()

  // Bandeja del panel (Administrador) con la misma solicitud.
  const admin = await sesionDe(navegador, 'admin@demo.cl', viewport)
  const panel = await admin.newPage()
  await panel.goto('/solicitudes')
  await capturar(panel, '06-bandeja-panel', sufijo)
  await admin.close()
}

await navegador.close()
console.log(`Listo: ${destino}`)
