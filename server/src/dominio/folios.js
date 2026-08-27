/**
 * Folios correlativos atómicos (docs/02, RQ-14). Único lugar del sistema
 * con SQL crudo (docs/14): el UPSERT con RETURNING garantiza que dos
 * transacciones concurrentes nunca reciban el mismo número.
 *
 * Se llama SIEMPRE dentro de la transacción que crea el registro, con el
 * cliente transaccional (`tx`), para que un fallo posterior no queme el
 * folio fuera de la transacción.
 */

const FORMATO = /^[A-Z]{2,4}$/

/**
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {'AF'|'BOD'|'ACT'|'SOL'} prefijo
 * @returns {Promise<string>} p. ej. "AF-2026-0001"
 */
export async function siguienteFolio(tx, prefijo) {
  if (!FORMATO.test(prefijo)) throw new Error(`Prefijo de folio inválido: ${prefijo}`)
  const nombre = `${prefijo}-${new Date().getFullYear()}`
  const filas = await tx.$queryRaw`
    INSERT INTO "Secuencia" ("nombre", "valor") VALUES (${nombre}, 1)
    ON CONFLICT ("nombre") DO UPDATE SET "valor" = "Secuencia"."valor" + 1
    RETURNING "valor"`
  return `${nombre}-${String(filas[0].valor).padStart(4, '0')}`
}

/**
 * Reserva un bloque de folios correlativos en una sola operación atómica
 * (importador, docs/12: lotes de hasta 3.530 filas sin quemar el contador
 * de a uno). Devuelve los folios en orden.
 */
export async function reservarFolios(tx, prefijo, cantidad) {
  if (!FORMATO.test(prefijo)) throw new Error(`Prefijo de folio inválido: ${prefijo}`)
  if (!Number.isInteger(cantidad) || cantidad <= 0) return []
  const nombre = `${prefijo}-${new Date().getFullYear()}`
  const filas = await tx.$queryRaw`
    INSERT INTO "Secuencia" ("nombre", "valor") VALUES (${nombre}, ${cantidad})
    ON CONFLICT ("nombre") DO UPDATE SET "valor" = "Secuencia"."valor" + ${cantidad}
    RETURNING "valor"`
  const ultimo = Number(filas[0].valor)
  return Array.from(
    { length: cantidad },
    (_, i) => `${nombre}-${String(ultimo - cantidad + 1 + i).padStart(4, '0')}`,
  )
}
