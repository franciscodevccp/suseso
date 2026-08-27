/**
 * Pruebas de la depreciación lineal mensual (docs/09 §Tests, docs/15):
 * la comisión es de Finanzas y esto se revisa con lupa.
 */
import { describe, expect, it } from 'vitest'
import { calcularDepreciacion } from '../../shared/depreciacion.js'

// $1.200.001 a 10 años con residual $1 → depreciable $1.200.000 exactos,
// cuota mensual $10.000: números redondos para leer los asertos.
const BASE = { valor: 1_200_001, fechaAlta: '2026-03-15', vidaUtilAnios: 10 }

describe('calcularDepreciacion (lineal mensual, residual $1)', () => {
  it('el mes de la compra ya cuenta: 1 mes transcurrido', () => {
    const r = calcularDepreciacion({ ...BASE, fechaCorte: '2026-03-31' })
    expect(r.mesesTranscurridos).toBe(1)
    expect(r.cuotaMensual).toBeCloseTo(10_000, 6)
    expect(r.depreciacionAcumulada).toBeCloseTo(10_000, 6)
    expect(r.valorLibro).toBeCloseTo(1_190_001, 6)
  })

  it('a los 18 meses acumula 18 cuotas', () => {
    const r = calcularDepreciacion({ ...BASE, fechaCorte: '2027-08-20' })
    expect(r.mesesTranscurridos).toBe(18)
    expect(r.depreciacionAcumulada).toBeCloseTo(180_000, 6)
    expect(r.valorLibro).toBeCloseTo(1_020_001, 6)
    expect(r.vidaUtilRestanteMeses).toBe(102)
  })

  it('con la vida útil cumplida el valor libro queda en $1 exacto', () => {
    const r = calcularDepreciacion({ ...BASE, fechaCorte: '2040-03-31' })
    expect(r.mesesTranscurridos).toBe(120)
    expect(r.valorLibro).toBe(1)
    expect(r.depreciacionAcumulada).toBeCloseTo(1_200_000, 6)
    expect(r.vidaUtilRestanteMeses).toBe(0)
  })

  it('una fecha de corte anterior a la compra no deprecia nada', () => {
    const r = calcularDepreciacion({ ...BASE, fechaCorte: '2025-12-31' })
    expect(r.mesesTranscurridos).toBe(0)
    expect(r.depreciacionAcumulada).toBe(0)
    expect(r.valorLibro).toBe(BASE.valor)
  })

  it('la vida acelerada usa la misma fórmula con menos años', () => {
    const r = calcularDepreciacion({
      ...BASE,
      vidaUtilAcelerada: 3,
      fechaCorte: '2027-08-20', // 18 meses
    })
    expect(r.acelerada.cuotaMensual).toBeCloseTo(1_200_000 / 36, 6)
    expect(r.acelerada.depreciacionAcumulada).toBeCloseTo((1_200_000 / 36) * 18, 6)
    expect(r.acelerada.valorLibro).toBeCloseTo(BASE.valor - (1_200_000 / 36) * 18, 6)
  })

  it('calcula con decimales y nunca baja del residual', () => {
    const r = calcularDepreciacion({
      valor: 99_999,
      fechaAlta: '2020-01-10',
      vidaUtilAnios: 7,
      fechaCorte: '2040-01-10', // vida cumplida hace rato
    })
    expect(r.cuotaMensual).toBeCloseTo(99_998 / 84, 6)
    expect(r.valorLibro).toBe(1)
    expect(r.mesesTranscurridos).toBe(84)
  })

  it('la tabla anual coincide con el acumulado mensual al cierre de cada año', () => {
    const r = calcularDepreciacion(BASE)
    expect(r.tablaEvolucion).toHaveLength(10)
    for (const fila of r.tablaEvolucion) {
      const alCierre = calcularDepreciacion({
        ...BASE,
        // Cierre del año N: el mes 12·N contado desde el mes de alta.
        fechaCorte: new Date(2026, 2 + fila.anio * 12 - 1, 28),
      })
      expect(fila.depreciacionAcumulada).toBeCloseTo(alCierre.depreciacionAcumulada, 6)
      expect(fila.valorLibro).toBeCloseTo(alCierre.valorLibro, 6)
    }
    // La suma de los años es exactamente el monto depreciable.
    const suma = r.tablaEvolucion.reduce((total, fila) => total + fila.depreciacionDelAnio, 0)
    expect(suma).toBeCloseTo(1_200_000, 6)
  })
})
