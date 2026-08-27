/** PrismaClient único del proceso (docs/02). */
import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient()
