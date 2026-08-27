/**
 * Importador Vista General (docs/15 §importador): sugerencia de mapeo,
 * normalización de celdas y validación con duplicados y celdas corruptas.
 */
import { describe, expect, it } from 'vitest'
import {
  comoFecha,
  comoValor,
  sugerirDestino,
  validar,
  vidaUtilPorNombre,
} from '../../server/src/dominio/importacion.js'

describe('sugerirDestino (mapeo por encabezados)', () => {
  it('reconoce los encabezados de la respuesta 8 del foro', () => {
    expect(sugerirDestino('Código')).toBe('codigoBarras')
    expect(sugerirDestino('Codificación')).toBe('codigoBarras')
    expect(sugerirDestino('Nombre / Descripción')).toBe('nombre')
    expect(sugerirDestino('Características')).toBe('descripcion')
    expect(sugerirDestino('Ubicación física')).toBe('ubicacion')
    expect(sugerirDestino('Categoría')).toBe('categoria')
    expect(sugerirDestino('Valor contable')).toBe('valor')
    expect(sugerirDestino('Fecha adquisición')).toBe('fechaAlta')
    expect(sugerirDestino('Responsable')).toBe('responsable')
    expect(sugerirDestino('Serie')).toBe('numero_serie')
  })

  it('un encabezado desconocido queda como ignorar (la UI ofrece el selector)', () => {
    expect(sugerirDestino('Observaciones internas')).toBe('ignorar')
  })
})

describe('comoValor (valores contables)', () => {
  it('entiende formatos chilenos con puntos y símbolo', () => {
    expect(comoValor('620000')).toBe(620000)
    expect(comoValor('$ 1.234.567')).toBe(1234567)
    expect(comoValor('95.000')).toBe(95000)
    expect(comoValor('1234,56')).toBe(1235)
  })

  it('celdas corruptas devuelven null (fila con observación)', () => {
    expect(comoValor('sin valor')).toBeNull()
    expect(comoValor('N/A')).toBeNull()
    expect(comoValor('')).toBeNull()
  })
})

describe('comoFecha', () => {
  it('acepta dd-mm-aaaa e ISO', () => {
    expect(comoFecha('15-03-2024').getFullYear()).toBe(2024)
    expect(comoFecha('15-03-2024').getMonth()).toBe(2)
    expect(comoFecha('2024-03-15').getFullYear()).toBe(2024)
  })

  it('fechas ilegibles devuelven null (se usa hoy y se observa)', () => {
    expect(comoFecha('ayer')).toBeNull()
    expect(comoFecha('')).toBeNull()
  })
})

describe('validar (planilla completa)', () => {
  const columnas = ['Código', 'Nombre / Descripción', 'Valor contable', 'Fecha adquisición']
  const mapeo = {
    Código: 'codigoBarras',
    'Nombre / Descripción': 'nombre',
    'Valor contable': 'valor',
    'Fecha adquisición': 'fechaAlta',
  }

  it('planilla válida: todas las filas pasan', () => {
    const filas = [
      ['779000000001', 'Notebook', '500000', '10-01-2024'],
      ['779000000002', 'Silla', '80000', '11-01-2024'],
    ]
    const resultado = validar(filas, columnas, mapeo, new Set())
    expect(resultado.validas).toBe(2)
    expect(resultado.errores).toHaveLength(0)
    expect(resultado.conObservaciones).toBe(0)
  })

  it('duplicados internos y contra la BD se omiten con motivo', () => {
    const filas = [
      ['779000000001', 'Notebook', '500000', '10-01-2024'],
      ['779000000001', 'Notebook repetido', '500000', '10-01-2024'],
      ['7801112223334', 'Ya existe en el sistema', '100', '10-01-2024'],
    ]
    const resultado = validar(filas, columnas, mapeo, new Set(['7801112223334']))
    expect(resultado.validas).toBe(1)
    expect(resultado.errores).toHaveLength(2)
    expect(resultado.errores[0].motivo).toContain('repetido en el archivo')
    expect(resultado.errores[1].motivo).toContain('ya existe en el sistema')
  })

  it('filas vacías y sin nombre son errores; valor y fecha corruptos son observaciones', () => {
    const filas = [
      ['', '', '', ''],
      ['779000000003', '', '1000', '10-01-2024'],
      ['779000000004', 'Con valor corrupto', 'no-numérico', '10-01-2024'],
      ['779000000005', 'Con fecha corrupta', '1000', 'mañana'],
    ]
    const resultado = validar(filas, columnas, mapeo, new Set())
    expect(resultado.validas).toBe(2)
    expect(resultado.errores).toHaveLength(2)
    expect(resultado.conObservaciones).toBe(2)
    expect(resultado.observaciones[0].motivo).toContain('no numérico')
    expect(resultado.observaciones[1].motivo).toContain('inválida')
  })
})

describe('vidaUtilPorNombre (categorías nuevas del importador)', () => {
  it('asigna vida útil por familia y 5 años por defecto', () => {
    expect(vidaUtilPorNombre('Equipos computacionales')).toBe(6)
    expect(vidaUtilPorNombre('Mobiliario de oficina')).toBe(7)
    expect(vidaUtilPorNombre('Maquinaria pesada')).toBe(15)
    expect(vidaUtilPorNombre('Otra cosa rara')).toBe(5)
  })
})
