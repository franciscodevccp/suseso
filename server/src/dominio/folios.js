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
