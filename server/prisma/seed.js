/** CLI del seed (`pnpm db:seed`): borra y recrea los datos de demostración. */
import { PrismaClient } from '@prisma/client'
import { sembrarDemo } from './sembrar.js'

const db = new PrismaClient()
try {
  const resumen = await sembrarDemo(db)
  console.log('Seed completado:', JSON.stringify(resumen))
} finally {
  await db.$disconnect()
}
