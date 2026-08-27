/**
 * Reglas de clave COMPARTIDAS front/servidor (docs/15): el mismo módulo
 * alimenta a ambos, así que basta probarlo una vez aquí.
 */
import { describe, expect, it } from 'vitest'
import { evaluarClave } from '../../shared/passwordRules.js'

describe('evaluarClave', () => {
  it('acepta una clave que cumple las 5 reglas', () => {
    const resultado = evaluarClave('SisgaDemo#2026')
    expect(resultado.esValida).toBe(true)
    expect(resultado.longitudMinima).toBe(true)
    expect(resultado.tieneMayuscula).toBe(true)
    expect(resultado.tieneMinuscula).toBe(true)
    expect(resultado.tieneNumero).toBe(true)
    expect(resultado.tieneSimbolo).toBe(true)
  })

  it('rechaza cada regla por separado', () => {
    expect(evaluarClave('Ab#1').longitudMinima).toBe(false) // corta
    expect(evaluarClave('minuscula#1').tieneMayuscula).toBe(false)
    expect(evaluarClave('MAYUSCULA#1').tieneMinuscula).toBe(false)
    expect(evaluarClave('SinNumero#').tieneNumero).toBe(false)
    expect(evaluarClave('SinSimbolo1').tieneSimbolo).toBe(false)
    expect(evaluarClave('').esValida).toBe(false)
  })

  it('acepta letras con tilde y eñe como mayúsculas/minúsculas', () => {
    expect(evaluarClave('Ñandú#123').esValida).toBe(true)
  })
})
