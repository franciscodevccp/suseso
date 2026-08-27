/**
 * Pruebas E2E y de responsive (docs/15, RQ-02, RQ-05).
 * Matriz de dispositivos: móvil 360px (exigencia de docs/13), iPhone con
 * motor WebKit real (lo más cercano a iOS Safari), tablet y escritorio.
 * La sesión se crea UNA vez por rol vía API (configuracion.setup.js) para
 * no gatillar el rate limit de login (docs/14).
 */
import { loadEnvFile } from 'node:process'
import { defineConfig, devices } from '@playwright/test'

try {
  loadEnvFile()
} catch {
  // Sin .env: las variables deben venir del entorno (CI).
}

const ESTADO_ADMIN = 'tests/e2e/.estado/admin.json'
const ESTADO_FUNCIONARIO = 'tests/e2e/.estado/funcionario.json'

export default defineConfig({
  testDir: 'tests/e2e',
  // Margen para picos de contención: 4 navegadores + Vite recompilando.
  timeout: 45_000,
  fullyParallel: true,
  workers: 4,
  // Un reintento absorbe los picos de contención de la corrida completa
  // (4 navegadores + flujos seriales simultáneos); un fallo real persiste.
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: 'configuracion', testMatch: /configuracion\.setup\.js/ },
    {
      name: 'movil-360',
      dependencies: ['configuracion'],
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
        storageState: ESTADO_ADMIN,
      },
    },
    {
      name: 'iphone-webkit',
      dependencies: ['configuracion'],
      use: { ...devices['iPhone 13'], storageState: ESTADO_ADMIN },
    },
    {
      name: 'tablet',
      dependencies: ['configuracion'],
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        storageState: ESTADO_ADMIN,
      },
    },
    {
      name: 'escritorio',
      dependencies: ['configuracion'],
      use: {
        browserName: 'chromium',
        viewport: { width: 1366, height: 768 },
        storageState: ESTADO_ADMIN,
      },
    },
  ],
})

export { ESTADO_ADMIN, ESTADO_FUNCIONARIO }
