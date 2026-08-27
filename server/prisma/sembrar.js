/**
 * Seed reproducible (docs/12): borra y recrea SIEMPRE los mismos datos
 * (PRNG con semilla fija). Este es el seed completo del bloque C2:
 * ~519 activos con distribución realista, 16 usuarios, 21 ubicaciones,
 * 40 funcionarios, 30 ítems de almacén con kardex consistente, 8 actas
 * (5 cerradas con sello), 6 solicitudes en estados variados y auditoría.
 *
 * Los 3 activos históricos del mock (AF-0001..0003) se conservan tal
 * cual: las pruebas E2E y la OC vinculada de Mercado Público dependen
 * de ellos.
 *
 * Prohibido (docs/12): RUT válidos, personas reales, dominios reales.
 */
import { createHash } from 'node:crypto'
import argon2 from 'argon2'
import { config } from '../src/config.js'
import {
  AREAS_HUERFANOS,
  TIPOS_ACTIVO,
  crearAzar,
  crearGeneradorEan,
  generarFuncionarios,
} from './generadores.js'

const anio = new Date().getFullYear()
const DIA_MS = 24 * 60 * 60 * 1000
const haceDias = (n) => new Date(Date.now() - n * DIA_MS)
const haceMeses = (n) => haceDias(n * 30)

// Código de OC real cacheada que se vincula a AF-0001 si está disponible
// (T-02b; el caché OrdenCompraMP sobrevive a los reinicios).
const OC_VINCULADA = { codigo: '1057062-336-AG26', folioActivo: `AF-${anio}-0001` }

// Las 4 cuentas de demostración (docs/04) + 12 usuarios ficticios para
// que el módulo Usuarios tenga contenido real (docs/12).
const USUARIOS_DEMO = [
  { nombre: 'María Fernanda Silva', email: 'admin@demo.cl', rol: 'ADMINISTRADOR' },
  { nombre: 'Camila Torres Riquelme', email: 'gestor@demo.cl', rol: 'GESTOR' },
  { nombre: 'Andrés Soto Vergara', email: 'consulta@demo.cl', rol: 'CONSULTA' },
  { nombre: 'Funcionario Demo', email: 'funcionario@demo.cl', rol: 'FUNCIONARIO' },
]

const USUARIOS_EXTRA = [
  { nombre: 'Paula Riquelme Soto', email: 'paula.riquelme@demo.cl', rol: 'GESTOR' },
  { nombre: 'Jorge Fuentes Araya', email: 'jorge.fuentes@demo.cl', rol: 'GESTOR' },
  { nombre: 'Carolina Vidal Pino', email: 'carolina.vidal@demo.cl', rol: 'CONSULTA' },
  { nombre: 'Marcelo Garrido Leiva', email: 'marcelo.garrido@demo.cl', rol: 'CONSULTA' },
  { nombre: 'Daniela Paredes Cruz', email: 'daniela.paredes@demo.cl', rol: 'FUNCIONARIO' },
  { nombre: 'Ricardo Salas Bravo', email: 'ricardo.salas@demo.cl', rol: 'FUNCIONARIO' },
  { nombre: 'Lorena Cáceres Vega', email: 'lorena.caceres@demo.cl', rol: 'FUNCIONARIO' },
  { nombre: 'Hugo Navarro Pinto', email: 'hugo.navarro@demo.cl', rol: 'FUNCIONARIO' },
  { nombre: 'Marta Ibáñez Ruiz', email: 'marta.ibanez@demo.cl', rol: 'FUNCIONARIO' },
  { nombre: 'Óscar Peña Lagos', email: 'oscar.pena@demo.cl', rol: 'FUNCIONARIO' },
  { nombre: 'Teresa Bustos Mora', email: 'teresa.bustos@demo.cl', rol: 'CONSULTA', estado: 'inactivo' },
  { nombre: 'Iván Cárdenas Ríos', email: 'ivan.cardenas@demo.cl', rol: 'FUNCIONARIO', estado: 'bloqueado' },
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

// Los 3 activos históricos del mock (contrato de las pruebas E2E).
const ACTIVOS_HISTORICOS = [
  {
    folio: `AF-${anio}-0001`,
    codigoBarras: '7801112223334',
    rfid: 'RFID-A001',
    nombre: 'Notebook Lenovo ThinkPad E14',
    descripcion: 'Equipo portátil asignado para labores administrativas.',
    categoria: 'Equipos computacionales',
    ubicacion: 'Huérfanos 1376 — Piso 2, Administración y Finanzas',
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
    ubicacion: 'Huérfanos 1376 — Piso 2, Administración y Finanzas',
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
    ubicacion: 'Huérfanos 1376 — Piso 2, Administración y Finanzas',
    responsable: 'Funcionario Demo',
    estado: 'en_reparacion',
    valor: 95000,
    fechaAlta: haceMeses(6),
  },
]

// 30 ítems de almacén (docs/12): 3 bajo mínimo, 1 sin stock.
const ITEMS_ALMACEN = [
  { nombre: 'Resma de papel carta', categoria: 'Papelería', unidad: 'resma', stock: 8, stockMinimo: 15 },
  { nombre: 'Resma de papel oficio', categoria: 'Papelería', unidad: 'resma', stock: 4, stockMinimo: 10 },
  { nombre: 'Tóner HP 05A', categoria: 'Tinta y tóner', unidad: 'unidad', stock: 0, stockMinimo: 5 },
  { nombre: 'Tóner HP 26A', categoria: 'Tinta y tóner', unidad: 'unidad', stock: 12, stockMinimo: 5 },
  { nombre: 'Tóner Brother TN-2370', categoria: 'Tinta y tóner', unidad: 'unidad', stock: 9, stockMinimo: 4 },
  { nombre: 'Botella de tinta Epson 544 negra', categoria: 'Tinta y tóner', unidad: 'unidad', stock: 14, stockMinimo: 6 },
  { nombre: 'Lápices pasta azul', categoria: 'Papelería', unidad: 'caja', stock: 18, stockMinimo: 8 },
  { nombre: 'Lápices pasta negra', categoria: 'Papelería', unidad: 'caja', stock: 22, stockMinimo: 8 },
  { nombre: 'Destacadores surtidos', categoria: 'Papelería', unidad: 'caja', stock: 11, stockMinimo: 5 },
  { nombre: 'Corchetes 26/6', categoria: 'Papelería', unidad: 'caja', stock: 30, stockMinimo: 10 },
  { nombre: 'Clips metálicos', categoria: 'Papelería', unidad: 'caja', stock: 25, stockMinimo: 10 },
  { nombre: 'Carpetas colgantes', categoria: 'Papelería', unidad: 'paquete', stock: 16, stockMinimo: 8 },
  { nombre: 'Archivadores lomo ancho', categoria: 'Papelería', unidad: 'unidad', stock: 40, stockMinimo: 15 },
  { nombre: 'Notas adhesivas 76×76', categoria: 'Papelería', unidad: 'paquete', stock: 28, stockMinimo: 10 },
  { nombre: 'Sobres institucionales', categoria: 'Papelería', unidad: 'caja', stock: 12, stockMinimo: 6 },
  { nombre: 'Cuadernos institucionales', categoria: 'Papelería', unidad: 'unidad', stock: 35, stockMinimo: 12 },
  { nombre: 'Pilas AA', categoria: 'Insumos de oficina', unidad: 'paquete', stock: 20, stockMinimo: 8 },
  { nombre: 'Pilas AAA', categoria: 'Insumos de oficina', unidad: 'paquete', stock: 17, stockMinimo: 8 },
  { nombre: 'Alargador eléctrico 5 m', categoria: 'Insumos de oficina', unidad: 'unidad', stock: 9, stockMinimo: 4 },
  { nombre: 'Teclado USB de repuesto', categoria: 'Insumos de oficina', unidad: 'unidad', stock: 11, stockMinimo: 5 },
  { nombre: 'Mouse USB de repuesto', categoria: 'Insumos de oficina', unidad: 'unidad', stock: 13, stockMinimo: 5 },
  { nombre: 'Cable HDMI 2 m', categoria: 'Insumos de oficina', unidad: 'unidad', stock: 8, stockMinimo: 4 },
  { nombre: 'Toallas de papel', categoria: 'Aseo', unidad: 'paquete', stock: 26, stockMinimo: 10 },
  { nombre: 'Papel higiénico institucional', categoria: 'Aseo', unidad: 'paquete', stock: 3, stockMinimo: 12 },
  { nombre: 'Jabón líquido 5 L', categoria: 'Aseo', unidad: 'litro', stock: 15, stockMinimo: 6 },
  { nombre: 'Alcohol gel 5 L', categoria: 'Aseo', unidad: 'litro', stock: 18, stockMinimo: 6 },
  { nombre: 'Set de limpieza multiuso', categoria: 'Aseo', unidad: 'unidad', stock: 24, stockMinimo: 10 },
  { nombre: 'Bolsas de basura 80 L', categoria: 'Aseo', unidad: 'paquete', stock: 30, stockMinimo: 12 },
  { nombre: 'Guantes de aseo', categoria: 'Aseo', unidad: 'paquete', stock: 14, stockMinimo: 6 },
  { nombre: 'Cloro gel 2 L', categoria: 'Aseo', unidad: 'litro', stock: 21, stockMinimo: 8 },
]

const CATALOGOS_ALMACEN = {
  categorias: ['Papelería', 'Tinta y tóner', 'Aseo', 'Insumos de oficina'],
  ubicaciones: ['Bodega Central', 'Bodega Anexo'],
  unidades: ['unidad', 'caja', 'resma', 'litro', 'paquete'],
}

// Definición de campos personalizados (RQ-21, docs/08): texto + lista.
const CENTROS_DE_COSTO = [
  'Administración y Finanzas',
  'Fiscalía',
  'Tecnologías de la Información',
  'Intendencia de Beneficios',
  'Dirección',
]

const CAMPOS_PERSONALIZADOS = [
  { id: 'numero_serie', nombre: 'Número de serie', tipo: 'texto', obligatorio: false, habilitado: true },
  {
    id: 'centro_costo',
    nombre: 'Centro de costo',
    tipo: 'lista',
    opciones: CENTROS_DE_COSTO,
    obligatorio: false,
    habilitado: true,
  },
]

const CUENTAS_CONTABLES = {
  Mobiliario: '141.01',
  'Equipos computacionales': '141.02',
  Vehículos: '141.03',
  Maquinaria: '141.04',
  'Equipos audiovisuales': '141.05',
  Herramientas: '141.06',
  Instalaciones: '141.07',
  'Equipos de aire y refrigeración': '141.08',
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

/** Fecha de alta 2019–2026 con más peso en los años recientes. */
function fechaAltaAleatoria(rng) {
  const anios = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
  const pesos = [1, 1, 1.2, 1.4, 1.6, 1.8, 2, 1.4]
  const total = pesos.reduce((a, b) => a + b, 0)
  let corte = rng.azar() * total
  let elegido = anios[0]
  for (let i = 0; i < anios.length; i++) {
    corte -= pesos[i]
    if (corte <= 0) {
      elegido = anios[i]
      break
    }
  }
  const mesMaximo = elegido === 2026 ? 7 : 11
  const fecha = new Date(elegido, rng.entero(0, mesMaximo), rng.entero(1, 28), 10, 0, 0)
  return fecha > new Date() ? new Date() : fecha
}

/** Genera los ~516 activos del catálogo de tipos (docs/12). */
function generarActivos({ rng, ean, ubicacionesOficina, funcionarios }) {
  const activos = []
  let rfidContador = 100
  let serieContador = 5000

  for (const tipo of TIPOS_ACTIVO) {
    for (let i = 0; i < tipo.cantidad; i++) {
      const nombre = rng.de(tipo.modelos)
      const fechaAlta = fechaAltaAleatoria(rng)
      const esVehiculo = tipo.categoria === 'Vehículos'

      // Estados (docs/12): 8 % en reparación, 4 % de baja, 1 % extraviado.
      const dado = rng.azar()
      let estado = 'activo'
      if (dado < 0.08) estado = 'en_reparacion'
      else if (dado < 0.12) estado = 'dado_de_baja'
      else if (dado < 0.13) estado = 'extraviado'

      const activo = {
        codigoBarras: ean(),
        rfid: rng.probabilidad(0.3) ? `RFID-B${String(rfidContador++).padStart(3, '0')}` : null,
        nombre,
        descripcion: tipo.descripcion,
        categoria: tipo.categoria,
        ubicacion: esVehiculo
          ? 'Huérfanos 1376 — Subterráneo, Estacionamientos'
          : rng.de(ubicacionesOficina),
        responsable: rng.de(funcionarios).nombre,
        estado,
        valor: rng.entero(tipo.valor[0] / 1000, tipo.valor[1] / 1000) * 1000,
        fechaAlta,
      }

      if (estado === 'dado_de_baja') {
        activo.fechaBaja = haceDias(rng.entero(30, 700))
        if (activo.fechaBaja < fechaAlta) activo.fechaBaja = haceDias(15)
        activo.motivoBaja = rng.de([
          'Obsolescencia técnica',
          'Daño irreparable',
          'Término de vida útil',
          'Reposición por renovación',
        ])
      }

      // Campos personalizados con valores (~300 activos, RQ-21): claves =
      // ids de la definición sembrada en Configuración (docs/08).
      if (tipo.serie && rng.probabilidad(0.85)) {
        activo.camposPersonalizados = {
          numero_serie: `SN-${anio}-${serieContador++}`,
          centro_costo: rng.de(CENTROS_DE_COSTO),
        }
      }

      activos.push(activo)
    }
  }
  return activos
}

/**
 * Mantenciones y garantías (RQ-17, docs/12): reparte fechas y garantiza
 * los casos exactos que las alertas necesitan — 2 mantenciones y 1
 * garantía dentro de la ventana de 30 días, 1 mantención atrasada.
 */
function repartirMantenciones(activos, rng) {
  const conMantencion = activos.filter(
    (a) =>
      a.estado === 'activo' &&
      ['Equipos computacionales', 'Equipos de aire y refrigeración', 'Vehículos', 'Maquinaria'].includes(a.categoria),
  )
  conMantencion.forEach((activo, i) => {
    if (i === 0 || i === 1) activo.proximaMantencion = haceDias(-rng.entero(5, 25)) // dentro de la ventana
    else if (i === 2) activo.proximaMantencion = haceDias(rng.entero(5, 40)) // atrasada
    else if (rng.probabilidad(0.35)) activo.proximaMantencion = haceDias(-rng.entero(35, 360))

    if (i === 3) activo.finGarantia = haceDias(-rng.entero(5, 25)) // por vencer
    else if (rng.probabilidad(0.4)) activo.finGarantia = haceDias(-rng.entero(35, 720))
  })
}

/** Kardex consistente: por ítem, ingreso inicial + movimientos con stock corrido. */
function generarKardex(items, rng, gestores) {
  const movimientos = []
  for (const item of items) {
    // Se reconstruye hacia atrás: el último stock es el actual.
    const pasos = rng.entero(3, 6)
    const historia = []
    let stock = item.stock
    for (let i = 0; i < pasos; i++) {
      const esIngreso = rng.probabilidad(0.45)
      const cantidad = rng.entero(1, 12)
      historia.push({ tipo: esIngreso ? 'ingreso' : 'egreso', cantidad, stockResultante: stock })
      stock += esIngreso ? -cantidad : cantidad
      if (stock < 0) {
        historia[historia.length - 1].cantidad += stock
        stock = 0
        if (historia[historia.length - 1].cantidad <= 0) historia.pop()
      }
    }
    const inicial = stock
    historia.push({ tipo: 'ingreso', cantidad: inicial, stockResultante: inicial, inicial: true })

    historia.reverse().forEach((mov, i) => {
      if (mov.cantidad <= 0) return
      movimientos.push({
        itemNombre: item.nombre,
        tipo: mov.tipo,
        cantidad: mov.cantidad,
        stockResultante: mov.stockResultante,
        motivo: mov.inicial
          ? 'Stock inicial'
          : mov.tipo === 'ingreso'
            ? rng.de(['Compra según orden interna', 'Reposición de stock', 'Devolución de material'])
            : rng.de(['Retiro oficina de partes', 'Entrega a unidad solicitante', 'Consumo interno']),
        usuario: mov.inicial ? 'Sistema' : rng.de(gestores),
        fecha: haceDias(150 - i * rng.entero(12, 25)),
      })
    })
  }
  return movimientos
}

async function sembrar(db) {
  const rng = crearAzar(20260101)
  const ean = crearGeneradorEan('780', 200000)
  const claveHash = await argon2.hash(config.CLAVE_DEMO, { type: argon2.argon2id })

  // --- Usuarios, catálogos y funcionarios -------------------------------
  await db.usuario.createMany({
    data: [
      ...USUARIOS_DEMO.map((u) => ({ ...u, claveHash, esCuentaDemo: true })),
      ...USUARIOS_EXTRA.map(({ estado, ...u }) => ({
        ...u,
        claveHash,
        esCuentaDemo: false,
        ...(estado ? { estado } : {}),
      })),
    ],
  })
  const usuarios = await db.usuario.findMany()
  const usuarioPorEmail = new Map(usuarios.map((u) => [u.email, u]))

  await db.categoria.createMany({ data: CATEGORIAS })

  const ubicacionesOficina = AREAS_HUERFANOS.map((area) => `Huérfanos 1376 — ${area}`)
  await db.ubicacion.createMany({
    data: [
      ...ubicacionesOficina.map((nombre) => ({ nombre, tipo: 'oficina' })),
      { nombre: 'Bodega Central', tipo: 'bodega' },
      { nombre: 'Bodega Anexo', tipo: 'bodega' },
      { nombre: 'Archivo institucional', tipo: 'bodega' },
    ],
  })

  const funcionarios = generarFuncionarios(rng)
  await db.funcionario.createMany({ data: funcionarios })

  // --- Activos ----------------------------------------------------------
  const generados = generarActivos({ rng, ean, ubicacionesOficina, funcionarios })
  repartirMantenciones(generados, rng)

  const todos = [
    ...ACTIVOS_HISTORICOS,
    ...generados.map((activo, i) => ({
      ...activo,
      folio: `AF-${anio}-${String(i + 4).padStart(4, '0')}`,
    })),
  ]
  await db.activo.createMany({ data: todos })
  const activos = await db.activo.findMany({ orderBy: { folio: 'asc' } })

  // OC real de Mercado Público vinculada (T-02b), si el caché la tiene.
  const ocCacheada = await db.ordenCompraMP.findUnique({ where: { codigo: OC_VINCULADA.codigo } })
  if (ocCacheada) {
    await db.activo.update({
      where: { folio: OC_VINCULADA.folioActivo },
      data: { ordenCompraMPCodigo: OC_VINCULADA.codigo },
    })
  }

  // Movimiento de alta por activo + 120 traslados y las bajas (docs/12).
  const gestores = ['María Fernanda Silva', 'Camila Torres Riquelme', 'Paula Riquelme Soto', 'Jorge Fuentes Araya']
  const movimientosActivos = activos.map((activo) => ({
    activoId: activo.id,
    tipo: 'alta',
    detalle: `Alta del activo "${activo.nombre}" (folio ${activo.folio}).`,
    usuario: 'Sistema',
    fecha: activo.fechaAlta,
  }))

  const vigentes = activos.filter((a) => a.estado !== 'dado_de_baja')
  for (let i = 0; i < 120; i++) {
    const activo = rng.de(vigentes)
    const destino = rng.de(ubicacionesOficina)
    const responsableNuevo = rng.de(funcionarios).nombre
    const esTraslado = rng.probabilidad(0.75)
    movimientosActivos.push({
      activoId: activo.id,
      tipo: esTraslado ? 'traslado' : 'edicion',
      detalle: esTraslado
        ? `Traslado de "${activo.ubicacion}" (${activo.responsable || 'sin responsable'}) a "${destino}" (${responsableNuevo}).`
        : 'Se actualizaron los datos del activo.',
      usuario: rng.de(gestores),
      ...(esTraslado ? { ubicacionAnterior: activo.ubicacion, ubicacionNueva: destino } : {}),
      fecha: haceDias(rng.entero(10, 600)),
    })
  }

  for (const activo of activos.filter((a) => a.estado === 'dado_de_baja')) {
    movimientosActivos.push({
      activoId: activo.id,
      tipo: 'baja',
      detalle: `Baja del activo. Motivo: ${activo.motivoBaja}.`,
      usuario: rng.de(gestores),
      fecha: activo.fechaBaja ?? haceDias(60),
    })
  }
  await db.movimientoActivo.createMany({ data: movimientosActivos })

  // --- Almacén ----------------------------------------------------------
  const bodegas = ['Bodega Central', 'Bodega Anexo']
  await db.itemAlmacen.createMany({
    data: ITEMS_ALMACEN.map((item, i) => ({
      ...item,
      folio: `BOD-${anio}-${String(i + 1).padStart(4, '0')}`,
      ubicacion: bodegas[i % 5 === 0 ? 1 : 0],
    })),
  })
  const items = await db.itemAlmacen.findMany({ orderBy: { folio: 'asc' } })
  const itemPorNombre = new Map(items.map((item) => [item.nombre, item]))

  // Los ítems de la solicitud ENTREGADA cierran su kardex con el egreso de
  // la entrega: el kardex previo apunta a stock + cantidad entregada, así
  // toda la cadena queda consistente sin retoques.
  const AJUSTES_ENTREGA = { 'Archivadores lomo ancho': 5, 'Carpetas colgantes': 2 }
  const kardex = generarKardex(
    ITEMS_ALMACEN.map((item) => ({
      ...item,
      stock: item.stock + (AJUSTES_ENTREGA[item.nombre] ?? 0),
    })),
    rng,
    gestores,
  )
  await db.movimientoAlmacen.createMany({
    data: kardex.map((mov) => ({
      itemId: itemPorNombre.get(mov.itemNombre).id,
      tipo: mov.tipo,
      cantidad: mov.cantidad,
      stockResultante: mov.stockResultante,
      motivo: mov.motivo,
      usuario: mov.usuario,
      fecha: mov.fecha,
    })),
  })

  // --- Actas (8: 5 cerradas con sello, 3 pendientes; docs/12) -----------
  const actasBase = Array.from({ length: 8 }, (_, i) => {
    const activo = vigentes[rng.entero(3, vigentes.length - 1)]
    const tipo = i % 2 === 0 ? 'entrega' : 'recepcion'
    return {
      folio: `ACT-${anio}-${String(i + 1).padStart(4, '0')}`,
      tipo,
      activoId: activo.id,
      activoFolio: activo.folio,
      activoNombre: activo.nombre,
      responsable: activo.responsable || 'Funcionario Demo',
      contenido:
        tipo === 'entrega'
          ? `Se deja constancia de la entrega del bien ${activo.folio} — ${activo.nombre} a ${activo.responsable || 'la unidad solicitante'}, quien lo recibe conforme para su uso institucional.`
          : `Se deja constancia de la recepción del bien ${activo.folio} — ${activo.nombre}, verificado físicamente contra la orden de compra correspondiente, sin observaciones.`,
      creadaPor: rng.de(gestores),
      fecha: haceDias(rng.entero(10, 240)),
    }
  })
  const actas = actasBase.map((acta, i) => {
    if (i < 5) {
      const fechaCierre = new Date(acta.fecha.getTime() + rng.entero(1, 5) * DIA_MS)
      const cerradaPor = rng.de(gestores)
      return {
        ...acta,
        estado: 'cerrada',
        cerradaPor,
        fechaCierre,
        selloIntegridad: createHash('sha256')
          .update(`${acta.folio}|${acta.contenido}|${cerradaPor}|${fechaCierre.toISOString()}`)
          .digest('hex'),
      }
    }
    return { ...acta, estado: 'pendiente' }
  })
  await db.acta.createMany({ data: actas })

  // --- Solicitudes (6 en estados variados; docs/11, docs/12) ------------
  const funcionarioDemo = usuarioPorEmail.get('funcionario@demo.cl')
  const otraSolicitante = usuarioPorEmail.get('daniela.paredes@demo.cl')
  const resolutor = 'Camila Torres Riquelme'

  const definicionSolicitudes = [
    { solicitante: funcionarioDemo, estado: 'pendiente', dias: 1, items: [['Resma de papel carta', 4], ['Lápices pasta azul', 2]], observacion: 'Insumos para la oficina de partes.' },
    { solicitante: otraSolicitante, estado: 'pendiente', dias: 3, items: [['Tóner HP 26A', 1]], observacion: 'Impresora de Recursos Humanos sin tóner.' },
    { solicitante: funcionarioDemo, estado: 'aprobada', dias: 6, items: [['Notas adhesivas 76×76', 3], ['Destacadores surtidos', 1]], observacionResolucion: 'Aprobada; retirar en Bodega Central.' },
    { solicitante: otraSolicitante, estado: 'aprobada', dias: 8, items: [['Alcohol gel 5 L', 2]], observacionResolucion: 'Aprobada para el piso 6.' },
    { solicitante: funcionarioDemo, estado: 'rechazada', dias: 12, items: [['Tóner HP 05A', 2]], observacion: 'Repuesto para impresora del piso 1.', observacionResolucion: 'Sin stock del tóner; se repone la próxima semana con la compra en curso.' },
    { solicitante: otraSolicitante, estado: 'entregada', dias: 20, items: [['Archivadores lomo ancho', 5], ['Carpetas colgantes', 2]], observacionResolucion: 'Entregada en mano en el piso 6.' },
  ]

  for (const [indice, def] of definicionSolicitudes.entries()) {
    const folio = `SOL-${anio}-${String(indice + 1).padStart(4, '0')}`
    const resuelta = def.estado !== 'pendiente'
    const fecha = haceDias(def.dias)
    const solicitud = await db.solicitud.create({
      data: {
        folio,
        solicitanteId: def.solicitante.id,
        solicitanteNombre: def.solicitante.nombre,
        estado: def.estado,
        observacion: def.observacion ?? '',
        observacionResolucion: def.observacionResolucion ?? '',
        resueltaPor: resuelta ? resolutor : null,
        fechaResolucion: resuelta ? new Date(fecha.getTime() + DIA_MS) : null,
        fecha,
        items: {
          create: def.items.map(([nombre, cantidad]) => ({
            itemId: itemPorNombre.get(nombre).id,
            itemNombre: nombre,
            cantidad,
          })),
        },
      },
    })

    // La entregada deja sus egresos reales en el kardex (docs/11): el
    // kardex previo terminó en stock + cantidad (AJUSTES_ENTREGA), así
    // este egreso cierra exactamente en el stock actual del ítem.
    if (def.estado === 'entregada') {
      for (const [nombre, cantidad] of def.items) {
        const item = itemPorNombre.get(nombre)
        const ultimo = await db.movimientoAlmacen.findFirst({
          where: { itemId: item.id },
          orderBy: { fecha: 'desc' },
        })
        await db.movimientoAlmacen.create({
          data: {
            itemId: item.id,
            tipo: 'egreso',
            cantidad,
            stockResultante: item.stock,
            motivo: `Entrega solicitud ${folio}`,
            usuario: resolutor,
            solicitudId: solicitud.id,
            fecha: new Date(Math.max((ultimo?.fecha ?? fecha).getTime() + 60_000, fecha.getTime())),
          },
        })
      }
    }
  }

  // --- Configuración y secuencias ---------------------------------------
  await db.configuracion.create({ data: { clave: 'almacen_catalogos', valor: CATALOGOS_ALMACEN } })
  await db.configuracion.create({ data: { clave: 'cuentas_contables', valor: CUENTAS_CONTABLES } })
  await db.configuracion.create({
    data: { clave: 'campos_personalizados', valor: CAMPOS_PERSONALIZADOS },
  })

  await db.secuencia.createMany({
    data: [
      { nombre: `AF-${anio}`, valor: todos.length },
      { nombre: `BOD-${anio}`, valor: ITEMS_ALMACEN.length },
      { nombre: `ACT-${anio}`, valor: actas.length },
      { nombre: `SOL-${anio}`, valor: definicionSolicitudes.length },
    ],
  })

  // --- Auditoría (docs/12): 40 ingresos históricos + acciones coherentes.
  const auditoria = []
  const usuariosActivos = usuarios.filter((u) => u.estado === 'activo')
  for (let i = 0; i < 40; i++) {
    const usuario = rng.de(usuariosActivos)
    auditoria.push({
      usuarioNombre: usuario.nombre,
      usuarioId: usuario.id,
      modulo: 'acceso',
      accion: 'ingreso',
      detalle: 'Inicio de sesión correcto.',
      fecha: haceDias(rng.entero(0, 60)),
    })
  }
  for (const acta of actas.filter((a) => a.estado === 'cerrada')) {
    auditoria.push({
      usuarioNombre: acta.cerradaPor,
      modulo: 'actas',
      accion: 'cierre',
      entidad: 'acta',
      entidadFolio: acta.folio,
      detalle: `Cierre del acta ${acta.folio} con sello de integridad.`,
      fecha: acta.fechaCierre,
    })
  }
  for (let i = 0; i < 25; i++) {
    const activo = rng.de(vigentes)
    auditoria.push({
      usuarioNombre: rng.de(gestores),
      modulo: 'activos',
      accion: rng.de(['alta', 'edicion', 'traslado']),
      entidad: 'activo',
      entidadFolio: activo.folio,
      detalle: `Registro histórico sobre el activo ${activo.folio}.`,
      fecha: haceDias(rng.entero(5, 300)),
    })
  }
  await db.auditoria.createMany({ data: auditoria })
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
    funcionarios: await db.funcionario.count(),
    activos: await db.activo.count(),
    itemsAlmacen: await db.itemAlmacen.count(),
    movimientosAlmacen: await db.movimientoAlmacen.count(),
    actas: await db.acta.count(),
    solicitudes: await db.solicitud.count(),
    auditoria: await db.auditoria.count(),
  }
}
