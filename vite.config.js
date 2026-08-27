import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En desarrollo la API corre aparte (docs/02); en producción el mismo
  // proceso Express sirve dist/ y /api, así que no hay proxy que configurar.
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
