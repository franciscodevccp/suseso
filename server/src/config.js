/**
 * Configuración del servidor (docs/02). Lee `.env` (Node 21+: loadEnvFile)
 * y valida con zod: TODAS las variables son obligatorias y el proceso
 * aborta si falta o es inválida alguna, para que un despliegue a medias
 * falle de inmediato y no en el primer request.
 */
import { loadEnvFile } from 'node:process'
import { z } from 'zod'

try {
  loadEnvFile()
} catch {
  // Sin archivo .env: las variables deben venir del entorno (p. ej. systemd).
}

const esquema = z.object({
  DATABASE_URL: z.string().startsWith('postgresql://'),
  SESSION_SECRET: z.string().min(32),
  CLAVE_DEMO: z.string().min(8),
  API_DEMO_KEY: z.string().min(16),
  MP_API_TICKET: z.string().min(1),
  PUERTO: z.coerce.number().int().positive(),
  ORIGEN_PERMITIDO: z.string().min(1),
  STORAGE_DIR: z.string().min(1),
})

const resultado = esquema.safeParse(process.env)
if (!resultado.success) {
  console.error('Configuración inválida: revise el archivo .env (ver .env.ejemplo).')
  for (const problema of resultado.error.issues) {
    console.error(`  - ${problema.path.join('.')}: ${problema.message}`)
  }
  process.exit(1)
}

export const config = resultado.data
export const esProduccion = process.env.NODE_ENV === 'production'
