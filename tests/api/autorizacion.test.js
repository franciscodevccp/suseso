/**
 * Matriz de autorización (docs/15 §API, docs/04): el servidor niega
 * aunque la UI esconda. Corre contra `pnpm dev` con el seed cargado.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { llamar, sesion } from './apoyo.js'

let admin, gestor, consulta, funcionario

beforeAll(async () => {
  admin = await sesion('admin@demo.cl')
  gestor = await sesion('gestor@demo.cl')
  consulta = await sesion('consulta@demo.cl')
  funcionario = await sesion('funcionario@demo.cl')
})

describe('sin sesión', () => {
  it('las rutas protegidas responden 401', async () => {
    for (const ruta of ['/api/activos', '/api/almacen/items', '/api/auditoria', '/api/usuarios']) {
      const { status, cuerpo } = await llamar('GET', ruta)
      expect(status, ruta).toBe(401)
      expect(cuerpo.codigo).toBe('NO_AUTENTICADO')
    }
  })
})

describe('los 4 roles entran y ven su sesión', () => {
  it('cada login expone el rol visible correcto', async () => {
    const esperados = [
      [admin, 'Administrador'],
      [gestor, 'Gestor de Activos'],
      [consulta, 'Consulta'],
      [funcionario, 'Funcionario'],
    ]
    for (const [cookie, rol] of esperados) {
      const { status, cuerpo } = await llamar('GET', '/api/auth/sesion', { cookie })
      expect(status).toBe(200)
      expect(cuerpo.usuario.rol).toBe(rol)
    }
  })
})

describe('rol Consulta: lectura sí, mutación jamás', () => {
  it('lee el panel (200)', async () => {
    for (const ruta of ['/api/activos', '/api/almacen/items', '/api/dashboard/resumen', '/api/auditoria']) {
      const { status } = await llamar('GET', ruta, { cookie: consulta })
      expect(status, ruta).toBe(200)
    }
  })

  it('recibe 403 en TODAS las mutaciones', async () => {
    const mutaciones = [
      ['POST', '/api/activos', { nombre: 'x', categoria: 'Mobiliario', ubicacion: 'Bodega Central' }],
      ['POST', '/api/almacen/items', { nombre: 'x', categoria: 'Aseo', unidad: 'unidad', ubicacion: 'Bodega Central' }],
      ['POST', '/api/actas', { tipo: 'entrega', responsable: 'x', contenido: 'x' }],
      ['PUT', '/api/configuracion/vida-util', []],
      ['PUT', '/api/configuracion/campos-personalizados', []],
      ['POST', '/api/configuracion/reiniciar-demo', {}],
      ['POST', '/api/importaciones/vista-general/confirmar', {}],
    ]
    for (const [metodo, ruta, cuerpo] of mutaciones) {
      const { status, cuerpo: respuesta } = await llamar(metodo, ruta, { cookie: consulta, cuerpo })
      expect(status, `${metodo} ${ruta}`).toBe(403)
      expect(respuesta.codigo, `${metodo} ${ruta}`).toBe('NO_AUTORIZADO')
    }
  })

  it('el módulo Usuarios completo le queda vedado', async () => {
    const { status } = await llamar('GET', '/api/usuarios', { cookie: consulta })
    expect(status).toBe(403)
  })
})

describe('rol Funcionario: solo el portal', () => {
  it('recibe 403 en las rutas del panel', async () => {
    for (const ruta of [
      '/api/almacen/items',
      '/api/auditoria',
      '/api/dashboard/resumen',
      '/api/usuarios',
      '/api/alertas',
      '/api/solicitudes', // la bandeja es del panel; él usa /mias
    ]) {
      const { status } = await llamar('GET', ruta, { cookie: funcionario })
      expect(status, ruta).toBe(403)
    }
  })

  it('en el listado de activos SIEMPRE ve solo sus bienes, aunque manipule el filtro', async () => {
    const { status, cuerpo } = await llamar(
      'GET',
      '/api/activos?responsable=' + encodeURIComponent('María Fernanda Silva'),
      { cookie: funcionario },
    )
    expect(status).toBe(200)
    expect(cuerpo.length).toBeGreaterThan(0)
    for (const activo of cuerpo) {
      expect(activo.responsable).toBe('Funcionario Demo')
    }
  })

  it('solo ve sus propias solicitudes', async () => {
    const { status, cuerpo } = await llamar('GET', '/api/solicitudes/mias', { cookie: funcionario })
    expect(status).toBe(200)
    for (const solicitud of cuerpo) {
      expect(solicitud.solicitanteNombre).toBe('Funcionario Demo')
    }
  })
})

describe('cuentas de demostración protegidas (docs/04)', () => {
  it('no se pueden desactivar ni restablecer: CUENTA_DEMO', async () => {
    const { cuerpo: usuarios } = await llamar('GET', '/api/usuarios', { cookie: admin })
    const demo = usuarios.find((u) => u.email === 'consulta@demo.cl')
    expect(demo).toBeTruthy()

    const desactivar = await llamar('POST', `/api/usuarios/${demo.id}/desactivar`, {
      cookie: admin,
      cuerpo: {},
    })
    expect(desactivar.status).toBe(403)
    expect(desactivar.cuerpo.codigo).toBe('CUENTA_DEMO')

    const restablecer = await llamar('POST', `/api/usuarios/${demo.id}/restablecer-clave`, {
      cookie: admin,
      cuerpo: {},
    })
    expect(restablecer.status).toBe(403)
    expect(restablecer.cuerpo.codigo).toBe('CUENTA_DEMO')
  })

  it('una cuenta demo no puede cambiar su propia clave: CUENTA_DEMO', async () => {
    const { status, cuerpo } = await llamar('POST', '/api/auth/cambiar-mi-clave', {
      cookie: funcionario,
      cuerpo: { claveActual: 'x', nuevaClave: 'Xx1234567#' },
    })
    expect(status).toBe(403)
    expect(cuerpo.codigo).toBe('CUENTA_DEMO')
  })
})
