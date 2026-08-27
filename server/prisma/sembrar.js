/**
 * Seed reproducible (docs/12): borra y recrea. Esta versión es el "seed
 * mínimo" del bloque A1 (docs/16): 4 cuentas demo, catálogos y los mismos
 * 3 activos y 4 ítems que traían los mocks, para que la demo se vea igual
 * que hoy pero contra la base de datos. El seed completo (~500 activos)
 * llega en el bloque C2.
 *
 * Prohibido (docs/12): RUT válidos, personas reales, dominios reales.
 */
import argon2 from 'argon2'
import { config } from '../src/config.js'

const anio = new Date().getFullYear()
const haceMeses = (n) => new Date(Date.now() - n * 30 * 24 * 60 * 60 * 1000)

// Las 4 cuentas de demostración (docs/04). "Funcionario Demo" conserva su
// nombre porque los activos semilla lo tienen de responsable y el portal
// de autoconsulta ("Mis bienes") enlaza por ese nombre.
const USUARIOS = [
  { nombre: 'María Fernanda Silva', email: 'admin@demo.cl', rol: 'ADMINISTRADOR' },
  { nombre: 'Camila Torres Riquelme', email: 'gestor@demo.cl', rol: 'GESTOR' },
  { nombre: 'Andrés Soto Vergara', email: 'consulta@demo.cl', rol: 'CONSULTA' },
  { nombre: 'Funcionario Demo', email: 'funcionario@demo.cl', rol: 'FUNCIONARIO' },
]

// Las 8 categorías de docs/09 (vida útil normal / acelerada, referencia SII).
const CATEGORIAS = [
  { nombre: 'Mobiliario', vidaUtilAnios: 7, vidaUtilAcelerada: 2 },
  { nombre: 'Equipos computacionales', vidaUtilAnios: 6, vidaUtilAcelerada: 2 },
  { nombre: 'Vehículos', vidaUtilAnios: 7, vidaUtilAcelerada: 2 },
  { nombre: 'Maquinaria', vidaUtilAnios: 15, vidaUtilAcelerada: 5 },
  { nombre: 'Equipos audiovisuales', vidaUtilAnios: 6, vidaUtilAcelerada: 2 },
  { nombre: 'Herramientas', vidaUtilAnios: 8, vidaUtilAcelerada: 2 },
  { nombre: 'Instalaciones', vidaUtilAnios: 10, vidaUtilAcelerada: 3 },
  { nombre: 'Equipos de aire y refrigeración', vidaUtilAnios: 10, vidaUtilAcelerada: 3 },
]

// Ubicaciones de activos (mock) + bodegas del almacén.
const UBICACIONES = [
  { nombre: 'Edificio Central - Piso 1', tipo: 'oficina' },
  { nombre: 'Edificio Central - Piso 2', tipo: 'oficina' },
  { nombre: 'Edificio Central - Piso 3', tipo: 'oficina' },
  { nombre: 'Bodega Regional Norte', tipo: 'bodega' },
  { nombre: 'Bodega Regional Sur', tipo: 'bodega' },
  { nombre: 'Oficina Regional Valparaíso', tipo: 'oficina' },
  { nombre: 'Bodega Central', tipo: 'bodega' },
  { nombre: 'Bodega Anexo', tipo: 'bodega' },
]

// Los 3 activos que traía el mock, con la categoría ya corregida (D del
// 2026-08-26: teléfono IP en Equipos computacionales).
const ACTIVOS = [
  {
    folio: `AF-${anio}-0001`,
    codigoBarras: '7801112223334',
    rfid: 'RFID-A001',
    nombre: 'Notebook Lenovo ThinkPad E14',
    descripcion: 'Equipo portátil asignado para labores administrativas.',
    categoria: 'Equipos computacionales',
    ubicacion: 'Edificio Central - Piso 2',
    responsable: 'Funcionario Demo',
    estado: 'activo',
    valor: 620000,
    fechaAlta: haceMeses(6),
  },
  {
    folio: `AF-${anio}-0002`,
    codigoBarras: '7801112223335',
    rfid: 'RFID-A002',
    nombre: 'Escritorio ejecutivo',
    descripcion: 'Escritorio de melamina con cajonera.',
    categoria: 'Mobiliario',
    ubicacion: 'Edificio Central - Piso 2',
    responsable: 'Funcionario Demo',
    estado: 'activo',
    valor: 145000,
    fechaAlta: haceMeses(6),
  },
  {
    folio: `AF-${anio}-0003`,
    codigoBarras: '7801112223336',
    rfid: 'RFID-A003',
    nombre: 'Teléfono IP Cisco 8841',
    descripcion: 'Teléfono de escritorio para anexo institucional.',
    categoria: 'Equipos computacionales',
    ubicacion: 'Edificio Central - Piso 2',
    responsable: 'Funcionario Demo',
    estado: 'en_reparacion',
    valor: 95000,
    fechaAlta: haceMeses(6),
  },
]

// Los 4 ítems del mock de almacén; el primero bajo mínimo a propósito.
const ITEMS = [
  { folio: `BOD-${anio}-0001`, nombre: 'Resma de papel carta', categoria: 'Papelería', unidad: 'resma', stock: 8, stockMinimo: 15, ubicacion: 'Bodega Central' },
  { folio: `BOD-${anio}-0002`, nombre: 'Tóner HP 05A', categoria: 'Tinta y tóner', unidad: 'unidad', stock: 12, stockMinimo: 5, ubicacion: 'Bodega Central' },
  { folio: `BOD-${anio}-0003`, nombre: 'Set de limpieza multiuso', categoria: 'Aseo', unidad: 'unidad', stock: 30, stockMinimo: 10, ubicacion: 'Bodega Anexo' },
  { folio: `BOD-${anio}-0004`, nombre: 'Lápices pasta azul', categoria: 'Papelería', unidad: 'caja', stock: 20, stockMinimo: 8, ubicacion: 'Bodega Central' },
]

// Catálogos propios del almacén (docs/03: /api/almacen/catalogos); viven en
// Configuracion porque no llevan vida útil ni son ubicaciones de activos.
const CATALOGOS_ALMACEN = {
  categorias: ['Papelería', 'Tinta y tóner', 'Aseo', 'Insumos de oficina'],
  ubicaciones: ['Bodega Central', 'Bodega Anexo', 'Bodega Regional Norte'],
  unidades: ['unidad', 'caja', 'resma', 'litro', 'paquete'],
}

async function limpiar(db) {
  // Orden inverso a las dependencias (FK).
  await db.movimientoAlmacen.deleteMany()
  await db.solicitudItem.deleteMany()
  await db.solicitud.deleteMany()
  await db.adjunto.deleteMany()
  await db.movimientoActivo.deleteMany()
  await db.acta.deleteMany()
  await db.itemAlmacen.deleteMany()
  await db.activo.deleteMany()
  // OrdenCompraMP NO se limpia: es caché de datos EXTERNOS reales
  // (docs/10) y reconstruirlo cuesta 16-20 s por consulta; el reinicio de
  // la demo restaura los datos del sistema, no el caché de Mercado Público.
  await db.auditoria.deleteMany()
  await db.tokenRecuperacion.deleteMany()
  await db.usuario.deleteMany()
  await db.funcionario.deleteMany()
  await db.ubicacion.deleteMany()
  await db.categoria.deleteMany()
  await db.configuracion.deleteMany()
  await db.secuencia.deleteMany()
}

async function sembrar(db) {
  const claveHash = await argon2.hash(config.CLAVE_DEMO, { type: argon2.argon2id })

  await db.usuario.createMany({
    data: USUARIOS.map((u) => ({ ...u, claveHash, esCuentaDemo: true })),
  })
  await db.categoria.createMany({ data: CATEGORIAS })
  await db.ubicacion.createMany({ data: UBICACIONES })
  await db.funcionario.create({ data: { nombre: 'Funcionario Demo', cargo: 'Funcionario' } })
  await db.activo.createMany({ data: ACTIVOS })

  for (const item of ITEMS) {
    const creado = await db.itemAlmacen.create({ data: item })
    // Mismo comportamiento del mock: un ingreso inicial consistente con el stock.
    await db.movimientoAlmacen.create({
      data: {
        itemId: creado.id,
        tipo: 'ingreso',
        cantidad: item.stock,
        stockResultante: item.stock,
        motivo: 'Stock inicial',
        usuario: 'Sistema',
        fecha: haceMeses(3),
      },
    })
  }

  await db.configuracion.create({
    data: { clave: 'almacen_catalogos', valor: CATALOGOS_ALMACEN },
  })

  // Cuentas contables por categoría para la exportación SIGFE (T-05):
  // plan de cuentas GENÉRICO y referencial, editable desde la pantalla.
  await db.configuracion.create({
    data: {
      clave: 'cuentas_contables',
      valor: {
        Mobiliario: '141.01',
        'Equipos computacionales': '141.02',
        Vehículos: '141.03',
        Maquinaria: '141.04',
        'Equipos audiovisuales': '141.05',
        Herramientas: '141.06',
        Instalaciones: '141.07',
        'Equipos de aire y refrigeración': '141.08',
      },
    },
  })

  // Contadores de folios alineados con lo sembrado (docs/02 §folios).
  await db.secuencia.createMany({
    data: [
      { nombre: `AF-${anio}`, valor: ACTIVOS.length },
      { nombre: `BOD-${anio}`, valor: ITEMS.length },
    ],
  })
}

/**
 * Borra y recrea los datos de demostración. La usan `pnpm db:seed` (CLI) y
 * `POST /api/configuracion/reiniciar-demo` (docs/13, docs/14).
 */
export async function sembrarDemo(db) {
  await limpiar(db)
  await sembrar(db)
  return {
    usuarios: await db.usuario.count(),
    categorias: await db.categoria.count(),
    ubicaciones: await db.ubicacion.count(),
    activos: await db.activo.count(),
    itemsAlmacen: await db.itemAlmacen.count(),
    movimientosAlmacen: await db.movimientoAlmacen.count(),
  }
}
