import { defineConfig } from 'vitest/config'

/**
 * Pruebas de API (docs/15): corren contra el servidor de desarrollo en
 * marcha (pnpm dev) y la base con seed, igual que Playwright. Separadas
 * de las unitarias para que `pnpm test` no exija infraestructura.
 */
export default defineConfig({
  test: {
    include: ['tests/api/**/*.test.js'],
    // Secuencial: comparten sesiones y el rate limit de login.
    fileParallelism: false,
    testTimeout: 30_000,
  },
})
