/**
 * Capa de servicio SIMULADA del módulo de Almacén / Bodega. Aislada del
 * resto de los mocks (no depende de activos ni auth): a diferencia de
 * Activos Fijos, acá no hay bienes individuales con ficha única, sino
 * ítems de consumo que se administran por CANTIDAD (stock) y sus
 * movimientos de ingreso/egreso.
 *
 * Persiste en localStorage (mismo patrón que activosService.mock.js).
 */
const CLAVE_ITEMS = 'sisga_almacen_items'
const CLAVE_MOVIMIENTOS = 'sisga_almacen_movimientos'

export class AlmacenError extends Error {
  constructor(code) {
    super(code)
    this.name = 'AlmacenError'
    this.code = code
  }
}

function retraso(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generarId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// --- Catálogos ------------------------------------------------------------
const CATEGORIAS = [
  { id: 'cat-001', nombre: 'Papelería' },
  { id: 'cat-002', nombre: 'Tinta y tóner' },
  { id: 'cat-003', nombre: 'Aseo' },
  { id: 'cat-004', nombre: 'Insumos de oficina' },
]

const UBICACIONES = [
  { id: 'ubi-001', nombre: 'Bodega Central' },
  { id: 'ubi-002', nombre: 'Bodega Anexo' },
  { id: 'ubi-003', nombre: 'Bodega Regional Norte' },
]

const UNIDADES = [
  { id: 'uni-001', nombre: 'unidad' },
  { id: 'uni-002', nombre: 'caja' },
  { id: 'uni-003', nombre: 'resma' },
  { id: 'uni-004', nombre: 'litro' },
  { id: 'uni-005', nombre: 'paquete' },
]

// --- Datos de prueba -------------------------------------------------------
// 4 ítems semilla para que la demo no salga vacía; el primero queda bajo
// su stock mínimo a propósito, para mostrar ese indicador en el listado.
function itemsSemilla() {
  const anio = new Date().getFullYear()
  return [
    {
      id: 'item-semilla-001',
      folio: `BOD-${anio}-0001`,
      nombre: 'Resma de papel carta',
      categoria: 'Papelería',
      unidad: 'resma',
      stock: 8,
      stockMinimo: 15,
      ubicacion: 'Bodega Central',
    },
    {
      id: 'item-semilla-002',
      folio: `BOD-${anio}-0002`,
      nombre: 'Tóner HP 05A',
      categoria: 'Tinta y tóner',
      unidad: 'unidad',
      stock: 12,
      stockMinimo: 5,
      ubicacion: 'Bodega Central',
    },
    {
      id: 'item-semilla-003',
      folio: `BOD-${anio}-0003`,
      nombre: 'Set de limpieza multiuso',
      categoria: 'Aseo',
      unidad: 'unidad',
      stock: 30,
      stockMinimo: 10,
      ubicacion: 'Bodega Anexo',
    },
    {
      id: 'item-semilla-004',
      folio: `BOD-${anio}-0004`,
      nombre: 'Lápices pasta azul',
      categoria: 'Papelería',
      unidad: 'caja',
      stock: 20,
      stockMinimo: 8,
      ubicacion: 'Bodega Central',
    },
  ]
}

// Un movimiento de ingreso inicial por cada ítem semilla, para que el
// historial sea consistente con el stock desde el día uno.
function movimientosSemilla(items) {
  const haceTresMeses = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  return items.map((item) => ({
    id: generarId(),
    itemId: item.id,
    tipo: 'ingreso',
    cantidad: item.stock,
    motivo: 'Stock inicial',
    fecha: haceTresMeses,
    usuario: 'Sistema',
  }))
}

// --- Persistencia local ------------------------------------------------
// Forma completa del ítem:
// { id, folio, nombre, categoria, unidad, stock, stockMinimo, ubicacion }
function leerItems() {
  try {
    const crudo = localStorage.getItem(CLAVE_ITEMS)
    if (!crudo) {
      const semilla = itemsSemilla()
      guardarItems(semilla)
      guardarMovimientos(movimientosSemilla(semilla))
      return semilla
    }
    return JSON.parse(crudo)
  } catch {
    const semilla = itemsSemilla()
    guardarItems(semilla)
    guardarMovimientos(movimientosSemilla(semilla))
    return semilla
  }
}

function guardarItems(items) {
  localStorage.setItem(CLAVE_ITEMS, JSON.stringify(items))
}

// Forma del movimiento: { id, itemId, tipo, cantidad, motivo, fecha, usuario }
// tipo: 'ingreso' | 'egreso'
function leerMovimientos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_MOVIMIENTOS)) ?? []
  } catch {
    return []
  }
}

function guardarMovimientos(movimientos) {
  localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(movimientos))
}

function registrarMovimientoInterno(itemId, { tipo, cantidad, motivo, usuario }) {
  const movimientos = leerMovimientos()
  movimientos.push({
    id: generarId(),
    itemId,
    tipo,
    cantidad,
    motivo,
    fecha: new Date().toISOString(),
    usuario,
  })
  guardarMovimientos(movimientos)
}

/** Folio correlativo del año en curso, a partir del máximo ya usado (sin contador aparte). */
function generarFolio(items) {
  const prefijo = `BOD-${new Date().getFullYear()}-`
  const maximo = items.reduce((max, item) => {
    if (!item.folio?.startsWith(prefijo)) return max
    const numero = Number.parseInt(item.folio.slice(prefijo.length), 10)
    return Number.isFinite(numero) && numero > max ? numero : max
  }, 0)
  return `${prefijo}${String(maximo + 1).padStart(4, '0')}`
}

function validarDatosBasicos(datos) {
  if (!datos.nombre?.trim()) {
    throw new AlmacenError('NOMBRE_REQUERIDO')
  }
}

export async function obtenerCategorias() {
  await retraso(200)
  return CATEGORIAS
}

export async function obtenerUbicaciones() {
  await retraso(200)
  return UBICACIONES
}

export async function obtenerUnidades() {
  await retraso(200)
  return UNIDADES
}

export async function obtenerItems() {
  await retraso()
  return leerItems()
}

export async function obtenerItemPorId(id) {
  await retraso()
  const items = leerItems()
  return items.find((item) => item.id === id) ?? null
}

/** Movimientos de un ítem: más reciente primero. */
export async function obtenerMovimientosPorItem(id) {
  await retraso(250)
  return leerMovimientos()
    .filter((movimiento) => movimiento.itemId === id)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

/** Todos los movimientos de todos los ítems, más reciente primero (para el reporte de Movimientos). */
export async function obtenerTodosLosMovimientos() {
  await retraso(250)
  return leerMovimientos().sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

/**
 * Alta de un ítem nuevo. El folio se genera acá, no se pide en el
 * formulario. Si el stock inicial es mayor a 0, queda registrado como un
 * movimiento de ingreso para que el historial sea trazable desde el alta.
 */
export async function crearItem({ datos, usuario }) {
  await retraso()
  validarDatosBasicos(datos)

  const items = leerItems()
  const stockInicial = Number(datos.stock) || 0
  const nuevoItem = {
    id: generarId(),
    folio: generarFolio(items),
    nombre: datos.nombre.trim(),
    categoria: datos.categoria,
    unidad: datos.unidad,
    stock: stockInicial,
    stockMinimo: Number(datos.stockMinimo) || 0,
    ubicacion: datos.ubicacion,
  }

  items.push(nuevoItem)
  guardarItems(items)
  if (stockInicial > 0) {
    registrarMovimientoInterno(nuevoItem.id, {
      tipo: 'ingreso',
      cantidad: stockInicial,
      motivo: 'Stock inicial al crear el ítem',
      usuario,
    })
  }

  return nuevoItem
}

/**
 * Registra un ingreso o egreso y ajusta el stock del ítem. No permite un
 * egreso mayor al stock disponible.
 */
export async function registrarMovimiento(itemId, { tipo, cantidad, motivo, usuario }) {
  await retraso()
  const items = leerItems()
  const item = items.find((i) => i.id === itemId)
  if (!item) {
    throw new AlmacenError('ITEM_NO_ENCONTRADO')
  }

  const cantidadNumero = Number(cantidad)
  if (!Number.isFinite(cantidadNumero) || cantidadNumero <= 0) {
    throw new AlmacenError('CANTIDAD_INVALIDA')
  }
  if (tipo === 'egreso' && cantidadNumero > item.stock) {
    throw new AlmacenError('STOCK_INSUFICIENTE')
  }

  item.stock = tipo === 'ingreso' ? item.stock + cantidadNumero : item.stock - cantidadNumero
  guardarItems(items)
  registrarMovimientoInterno(itemId, {
    tipo,
    cantidad: cantidadNumero,
    motivo: motivo?.trim() || '',
    usuario,
  })

  return item
}

/** Borra los ítems y movimientos de prueba, para volver al estado inicial. */
export function reiniciarDatosDemo() {
  localStorage.removeItem(CLAVE_ITEMS)
  localStorage.removeItem(CLAVE_MOVIMIENTOS)
}
