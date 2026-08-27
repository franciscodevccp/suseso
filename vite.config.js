import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En desarrollo la API corre aparte (docs/02); en producción el mismo
  // proceso Express sirve dist/ y /api, así que no hay proxy que configurar.
  // 127.0.0.1 explícito: en Windows, "localhost" intenta IPv6 primero y
  // eso agregaba ~2,2 s de espera A CADA request proxiado.
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  // Vitest (unitarias): separado de tests/e2e, que es de Playwright.
  test: {
    include: ['tests/unitarias/**/*.test.js'],
  },
})
