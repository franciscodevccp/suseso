/**
 * Serialización al contrato del mock (regla 3): la UI recibe exactamente
 * las formas de siempre — `valor` numérico (Prisma Decimal serializa como
 * string), `codigoBarras`/`rfid` como "" (en BD viven como null para el
 * único parcial), y `foto`/`documentos` presentes (los llena docs/06 en B3).
 */
export function serializarActivo(activo) {
  const { camposPersonalizados, adjuntos, ...resto } = activo
  return {
    ...resto,
    valor: Number(activo.valor),
    codigoBarras: activo.codigoBarras ?? '',
    rfid: activo.rfid ?? '',
    foto: activo.fotoPrincipalId ?? null,
    // "documentos" conserva el nombre del contrato original; son los
    // adjuntos (docs/06) cuando la consulta los incluye.
    documentos: adjuntos ?? [],
    ...(camposPersonalizados ? { camposPersonalizados } : {}),
  }
}

/** "" → null al escribir (los @unique parciales de la BD usan null). */
export function normalizarCodigo(valor) {
  const limpio = typeof valor === 'string' ? valor.trim() : valor
  return limpio || null
}
