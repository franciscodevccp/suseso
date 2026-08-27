/**
 * CLI del seed (`pnpm db:seed`): borra y recrea los datos de demostración
 * y escribe la planilla de ejemplo para la importación (docs/12). El
 * reinicio de demo del servidor usa solo `sembrarDemo`; la planilla es un
 * entregable que se genera únicamente desde esta CLI.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { sembrarDemo } from './sembrar.js'
import { generarPlanilla } from './planilla.js'

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const db = new PrismaClient()
try {
  const resumen = await sembrarDemo(db)
  console.log('Seed completado:', JSON.stringify(resumen))
  const planilla = await generarPlanilla(
    path.join(raiz, 'entregables', 'planilla-ejemplo-vista-general.xlsx'),
  )
  console.log(`Planilla escrita: ${planilla.archivo} (${planilla.filas} filas)`)
} finally {
  await db.$disconnect()
}
