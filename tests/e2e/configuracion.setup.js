/**
 * Crea las sesiones de prueba UNA sola vez, vía API (sin pasar por el
 * formulario), y las guarda como storageState para todos los proyectos.
 * Si el estado de una corrida anterior sigue vivo se reusa: corridas
 * seguidas no consumen logins y el rate limit (10/15 min) no se gatilla.
 */
import { existsSync } from 'node:fs'
import { expect, test as setup } from '@playwright/test'

const CLAVE = process.env.CLAVE_DEMO

// El mismo origen que usan las páginas (el proxy de Vite): las cookies
// del estado guardado viven bajo localhost:5173.
const ORIGEN = 'http://localhost:5173'

async function asegurarSesion(playwright, email, ruta) {
  if (existsSync(ruta)) {
    const previa = await playwright.request.newContext({
      baseURL: ORIGEN,
      storageState: ruta,
    })
    // /sesion responde 200 con null cuando NO hay sesión: hay que mirar
    // el cuerpo, no el status.
    const vigente = await previa.get('/api/auth/sesion')
    const cuerpo = vigente.ok() ? await vigente.json().catch(() => null) : null
    await previa.dispose()
    if (cuerpo?.usuario) return
  }

  const contexto = await playwright.request.newContext({ baseURL: ORIGEN })
  const respuesta = await contexto.post('/api/auth/login', {
    data: { email, password: CLAVE },
  })
  expect(respuesta.ok(), `login de ${email} falló: ¿CLAVE_DEMO en .env, seed aplicado, rate limit?`).toBeTruthy()
  await contexto.storageState({ path: ruta })
  await contexto.dispose()
}

setup('sesión de administrador', async ({ playwright }) => {
  await asegurarSesion(playwright, 'admin@demo.cl', 'tests/e2e/.estado/admin.json')
})

setup('sesión de funcionario', async ({ playwright }) => {
  await asegurarSesion(playwright, 'funcionario@demo.cl', 'tests/e2e/.estado/funcionario.json')
})
