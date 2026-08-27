/**
 * Crea las sesiones de prueba UNA sola vez, vía API (sin pasar por el
 * formulario), y las guarda como storageState para todos los proyectos.
 * Así el run completo consume 2 logins y no gatilla el rate limit.
 */
import { expect, test as setup } from '@playwright/test'

const CLAVE = process.env.CLAVE_DEMO

setup('sesión de administrador', async ({ request }) => {
  const respuesta = await request.post('/api/auth/login', {
    data: { email: 'admin@demo.cl', password: CLAVE },
  })
  expect(respuesta.ok(), 'login admin falló: ¿CLAVE_DEMO en .env y seed aplicado?').toBeTruthy()
  await request.storageState({ path: 'tests/e2e/.estado/admin.json' })
})

setup('sesión de funcionario', async ({ request }) => {
  const respuesta = await request.post('/api/auth/login', {
    data: { email: 'funcionario@demo.cl', password: CLAVE },
  })
  expect(respuesta.ok(), 'login funcionario falló').toBeTruthy()
  await request.storageState({ path: 'tests/e2e/.estado/funcionario.json' })
})
