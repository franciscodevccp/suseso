/** Generadores del seed: EAN-13 válidos y PRNG determinista (docs/12). */
import { describe, expect, it } from 'vitest'
import { crearAzar, crearGeneradorEan } from '../../server/prisma/generadores.js'

/** Verificador EAN-13 estándar: suma ponderada 1/3 módulo 10. */
function esEanValido(codigo) {
  if (!/^\d{13}$/.test(codigo)) return false
  const digitos = codigo.split('').map(Number)
  const suma = digitos.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0)
  return (10 - (suma % 10)) % 10 === digitos[12]
}

describe('crearGeneradorEan', () => {
  it('produce EAN-13 VÁLIDOS y únicos', () => {
    const ean = crearGeneradorEan('780', 200000)
    const codigos = Array.from({ length: 600 }, () => ean())
    expect(new Set(codigos).size).toBe(600)
    for (const codigo of codigos) {
      expect(esEanValido(codigo), `${codigo} debería tener verificador válido`).toBe(true)
    }
  })

  it('la planilla usa otro prefijo y no choca con los sembrados', () => {
    const sembrados = crearGeneradorEan('780', 200000)
    const planilla = crearGeneradorEan('779', 500000)
    expect(sembrados().startsWith('780')).toBe(true)
    expect(planilla().startsWith('779')).toBe(true)
  })
})

describe('crearAzar (PRNG del seed)', () => {
  it('con la misma semilla produce SIEMPRE la misma secuencia (seed reproducible)', () => {
    const a = crearAzar(20260101)
    const b = crearAzar(20260101)
    for (let i = 0; i < 200; i++) {
      expect(a.azar()).toBe(b.azar())
    }
  })

  it('entero(min, max) respeta los bordes', () => {
    const rng = crearAzar(7)
    for (let i = 0; i < 500; i++) {
      const n = rng.entero(3, 9)
      expect(n).toBeGreaterThanOrEqual(3)
      expect(n).toBeLessThanOrEqual(9)
    }
  })
})
