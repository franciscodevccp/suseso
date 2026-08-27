/**
 * API pública /api/v1, adjuntos, solicitudes con stock insuficiente y
 * auditoría por mutación (docs/15 §API).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { API_KEY, BASE, llamar, sesion } from './apoyo.js'

let admin, funcionario

beforeAll(async () => {
  admin = await sesion('admin@demo.cl')
  funcionario = await sesion('funcionario@demo.cl')
})

describe('API pública /api/v1 (AD-01)', () => {
  it('sin llave responde 401 con código estable', async () => {
    const { status, cuerpo } = await llamar('GET', '/api/v1/activos')
    expect(status).toBe(401)
    expect(cuerpo.codigo).toBe('NO_AUTORIZADO')
  })

  it('con llave inválida responde 401', async () => {
    const { status } = await llamar('GET', '/api/v1/activos', {
      headers: { 'x-api-key': 'llave-falsa' },
    })
    expect(status).toBe(401)
  })

  it('con la llave responde 200 con paginación de hasta 100', async () => {
    const { status, cuerpo } = await llamar('GET', '/api/v1/activos?pagina=1&porPagina=2', {
      headers: { 'x-api-key': API_KEY },
    })
    expect(status).toBe(200)
    expect(cuerpo.datos).toHaveLength(2)
    expect(cuerpo.paginacion.porPagina).toBe(2)
    expect(cuerpo.paginacion.total).toBeGreaterThan(500)

    // Más de 100 por página no se acepta: el contrato rechaza, no recorta.
    const tope = await llamar('GET', '/api/v1/activos?porPagina=9999', {
      headers: { 'x-api-key': API_KEY },
    })
    expect(tope.status).toBe(400)
    expect(tope.cuerpo.codigo).toBe('VALIDACION')
  })

  it('el webhook de contabilidad acusa recibo con 202', async () => {
    const { status, cuerpo } = await llamar('POST', '/api/v1/webhooks/contabilidad', {
      headers: { 'x-api-key': API_KEY },
      cuerpo: { referencia: 'SIGFE-TEST-1', fecha: '2026-08-31', asientos: [] },
    })
    expect(status).toBe(202)
    expect(cuerpo).toEqual({ recibido: true, referencia: 'SIGFE-TEST-1' })
  })
})

describe('adjuntos (docs/06, docs/14)', () => {
  it('un .txt disfrazado de .png se rechaza por magic bytes', async () => {
    const { cuerpo: activos } = await llamar('GET', '/api/activos?texto=AF-2026-0001', {
      cookie: admin,
    })
    const form = new FormData()
    form.append('tipo', 'foto')
    form.append('archivo', new Blob(['no soy una imagen'], { type: 'image/png' }), 'falsa.png')
    const respuesta = await fetch(`${BASE}/api/activos/${activos[0].id}/adjuntos`, {
      method: 'POST',
      headers: { cookie: admin },
      body: form,
    })
    expect(respuesta.status).toBe(415)
    const json = await respuesta.json()
    expect(json.codigo).toBe('TIPO_NO_PERMITIDO')
  })

  it('la descarga exige sesión y una ruta manipulada devuelve 404', async () => {
    const sinSesion = await llamar('GET', '/api/adjuntos/cualquiera')
    expect(sinSesion.status).toBe(401)

    const manipulada = await llamar('GET', '/api/adjuntos/..%2F..%2F.env', { cookie: admin })
    expect([404, 400]).toContain(manipulada.status)
  })
})

describe('solicitudes: la entrega con stock insuficiente no descuenta nada (docs/11)', () => {
  it('falla completa con STOCK_INSUFICIENTE y el stock queda intacto', async () => {
    const { cuerpo: catalogo } = await llamar('GET', '/api/solicitudes/catalogo', {
      cookie: funcionario,
    })
    const conStock = catalogo.filter((item) => item.stock > 0).slice(0, 2)
    expect(conStock.length).toBe(2)

    const creada = await llamar('POST', '/api/solicitudes', {
      cookie: funcionario,
      cuerpo: {
        items: [
          { itemId: conStock[0].id, cantidad: 1 },
          { itemId: conStock[1].id, cantidad: conStock[1].stock + 5000 },
        ],
        observacion: 'Prueba de stock insuficiente (test API)',
      },
    })
    expect(creada.status).toBe(201)

    const aprobada = await llamar('POST', `/api/solicitudes/${creada.cuerpo.id}/aprobar`, {
      cookie: admin,
      cuerpo: {},
    })
    expect(aprobada.status).toBe(200)

    const entrega = await llamar('POST', `/api/solicitudes/${creada.cuerpo.id}/entregar`, {
      cookie: admin,
    })
    expect(entrega.status).toBe(409)
    expect(entrega.cuerpo.codigo).toBe('STOCK_INSUFICIENTE')

    // Nada se descontó: ni siquiera el ítem que SÍ tenía stock suficiente.
    const { cuerpo: despues } = await llamar('GET', '/api/solicitudes/catalogo', {
      cookie: funcionario,
    })
    for (const item of conStock) {
      const actual = despues.find((fila) => fila.id === item.id)
      expect(actual.stock, item.nombre).toBe(item.stock)
    }
  })
})

describe('auditoría: cada mutación deja exactamente una fila (docs/05)', () => {
  it('un alta de activo produce una única entrada activos/alta con su folio', async () => {
    const creado = await llamar('POST', '/api/activos', {
      cookie: admin,
      cuerpo: {
        nombre: 'Activo de prueba auditoría',
        categoria: 'Mobiliario',
        ubicacion: 'Bodega Central',
        valor: 1000,
      },
    })
    expect(creado.status).toBe(201)
    const folio = creado.cuerpo.folio

    const { cuerpo } = await llamar(
      'GET',
      `/api/auditoria?folio=${encodeURIComponent(folio)}&accion=alta`,
      { cookie: admin },
    )
    expect(cuerpo.total).toBe(1)
    expect(cuerpo.filas[0].modulo).toBe('activos')
    expect(cuerpo.filas[0].detalle).toContain(folio)
  })
})

describe('folios correlativos bajo concurrencia (docs/15 §unitarias)', () => {
  it('20 creaciones en paralelo producen 20 folios distintos y consecutivos', async () => {
    const respuestas = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        llamar('POST', '/api/almacen/items', {
          cookie: admin,
          cuerpo: {
            nombre: `Ítem concurrente ${i + 1}`,
            categoria: 'Insumos de oficina',
            unidad: 'unidad',
            stock: 0,
            stockMinimo: 0,
            ubicacion: 'Bodega Central',
          },
        }),
      ),
    )
    const folios = respuestas.map((r) => {
      expect(r.status).toBe(201)
      return r.cuerpo.folio
    })
    expect(new Set(folios).size).toBe(20)
    const numeros = folios.map((f) => Number(f.slice(-4))).sort((a, b) => a - b)
    for (let i = 1; i < numeros.length; i++) {
      expect(numeros[i]).toBe(numeros[i - 1] + 1)
    }
  })
})
