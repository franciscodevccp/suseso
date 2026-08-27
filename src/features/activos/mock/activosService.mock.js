/**
 * Capa de servicio SIMULADA del módulo de Activos Fijos. Aislada del resto
 * de los mocks (no depende de auth ni dashboard): las funciones de
 * escritura reciben el `usuario` (nombre) de quien las llama en vez de
 * leerlo de una sesión propia.
 *
 * Persiste en localStorage (mismo patrón que authService.mock.js) para
 * que los activos creados sobrevivan a recargas. El listado arranca vacío
 * la primera vez — no hay activos semilla — pero lo que el usuario cree
 * se guarda de verdad.
 */
const CLAVE_ACTIVOS = 'sisga_activos'
const CLAVE_MOVIMIENTOS = 'sisga_activos_movimientos'

export class ActivoError extends Error {
  constructor(code) {
    super(code)
    this.name = 'ActivoError'
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
// Contenido real (a diferencia del listado de activos): los filtros y los
// selects del formulario necesitan opciones aunque todavía no haya activos.
const CATEGORIAS = [
  { id: 'cat-001', nombre: 'Mobiliario' },
  { id: 'cat-002', nombre: 'Equipos computacionales' },
  { id: 'cat-003', nombre: 'Vehículos' },
  { id: 'cat-004', nombre: 'Maquinaria' },
  { id: 'cat-005', nombre: 'Equipos audiovisuales' },
  { id: 'cat-006', nombre: 'Herramientas' },
]

const UBICACIONES = [
  { id: 'ubi-001', nombre: 'Edificio Central - Piso 1' },
  { id: 'ubi-002', nombre: 'Edificio Central - Piso 2' },
  { id: 'ubi-003', nombre: 'Edificio Central - Piso 3' },
  { id: 'ubi-004', nombre: 'Bodega Regional Norte' },
  { id: 'ubi-005', nombre: 'Bodega Regional Sur' },
  { id: 'ubi-006', nombre: 'Oficina Regional Valparaíso' },
]

// --- Datos de prueba -------------------------------------------------------
// El listado arranca vacío salvo estos 2-3 activos asignados a
// "Funcionario Demo" (la cuenta semilla del rol Funcionario en
// authService.mock.js) — sin ellos, "Mis bienes" en el portal de
// autoconsulta no tendría nada que mostrar en la demo. El resto del
// sistema sigue sin más activos que estos hasta que se creen desde el
// módulo de Activos Fijos.
function activosSemilla() {
  const anio = new Date().getFullYear()
  const haceSeisMeses = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()

  return [
    {
      id: 'act-semilla-001',
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
      fechaAlta: haceSeisMeses,
      foto: null,
      documentos: [],
    },
    {
      id: 'act-semilla-002',
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
      fechaAlta: haceSeisMeses,
      foto: null,
      documentos: [],
    },
    {
      id: 'act-semilla-003',
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
      fechaAlta: haceSeisMeses,
      foto: null,
      documentos: [],
    },
  ]
}

// --- Persistencia local ------------------------------------------------
// Forma completa del activo (folio con formato "AF-2026-0001"):
// { id, folio, codigoBarras, rfid, nombre, descripcion, categoria,
//   ubicacion, responsable, estado, valor, fechaAlta, foto, documentos }
function leerActivos() {
  try {
    const crudo = localStorage.getItem(CLAVE_ACTIVOS)
    if (!crudo) {
      const semilla = activosSemilla()
      guardarActivos(semilla)
      return semilla
    }
    return JSON.parse(crudo)
  } catch {
    const semilla = activosSemilla()
    guardarActivos(semilla)
    return semilla
  }
}

function guardarActivos(activos) {
  localStorage.setItem(CLAVE_ACTIVOS, JSON.stringify(activos))
}

// Forma del movimiento: { id, activoId, tipo, fecha, detalle, usuario }
// tipo: 'alta' | 'edicion' | 'baja' | 'traslado'
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

function registrarMovimiento(activoId, { tipo, detalle, usuario }) {
  const movimientos = leerMovimientos()
  movimientos.push({
    id: generarId(),
    activoId,
    tipo,
    fecha: new Date().toISOString(),
    detalle,
    usuario,
  })
  guardarMovimientos(movimientos)
}

/** Folio correlativo del año en curso, a partir del máximo ya usado (sin contador aparte). */
function generarFolio(activos) {
  const prefijo = `AF-${new Date().getFullYear()}-`
  const maximo = activos.reduce((max, activo) => {
    if (!activo.folio?.startsWith(prefijo)) return max
    const numero = Number.parseInt(activo.folio.slice(prefijo.length), 10)
    return Number.isFinite(numero) && numero > max ? numero : max
  }, 0)
  return `${prefijo}${String(maximo + 1).padStart(4, '0')}`
}

function validarDatosBasicos(datos) {
  if (!datos.nombre?.trim()) {
    throw new ActivoError('NOMBRE_REQUERIDO')
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

/**
 * Búsqueda avanzada: `texto` busca en folio/nombre/descripción/código de
 * barras/RFID; `categoria`, `ubicacion`, `estado` y `responsable` filtran
 * por coincidencia exacta. Cualquier filtro vacío/omitido no restringe
 * esa columna. `responsable` la usa el portal de autoconsulta para "Mis
 * bienes" (los activos a cargo del usuario en sesión).
 */
export async function buscarActivos({
  texto = '',
  categoria = '',
  ubicacion = '',
  estado = '',
  responsable = '',
} = {}) {
  await retraso()
  const activos = leerActivos()
  const textoNormalizado = texto.trim().toLowerCase()

  return activos.filter((activo) => {
    const coincideTexto =
      !textoNormalizado ||
      [activo.folio, activo.nombre, activo.descripcion, activo.codigoBarras, activo.rfid].some(
        (campo) => campo?.toLowerCase().includes(textoNormalizado),
      )
    const coincideCategoria = !categoria || activo.categoria === categoria
    const coincideUbicacion = !ubicacion || activo.ubicacion === ubicacion
    const coincideEstado = !estado || activo.estado === estado
    const coincideResponsable = !responsable || activo.responsable === responsable

    return coincideTexto && coincideCategoria && coincideUbicacion && coincideEstado && coincideResponsable
  })
}

export async function obtenerActivoPorId(id) {
  await retraso()
  const activos = leerActivos()
  return activos.find((activo) => activo.id === id) ?? null
}

/** Trazabilidad del activo: más reciente primero. */
export async function obtenerMovimientosPorActivo(id) {
  await retraso(250)
  return leerMovimientos()
    .filter((movimiento) => movimiento.activoId === id)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

/** Todos los movimientos de todos los activos, más reciente primero (para el reporte de Movimientos). */
export async function obtenerTodosLosMovimientos() {
  await retraso(250)
  return leerMovimientos().sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

/** Alta de un activo nuevo. El folio se genera acá, no se pide en el formulario. */
export async function crearActivo({ datos, usuario }) {
  await retraso()
  validarDatosBasicos(datos)

  const activos = leerActivos()
  const nuevoActivo = {
    id: generarId(),
    folio: generarFolio(activos),
    codigoBarras: datos.codigoBarras ?? '',
    rfid: datos.rfid ?? '',
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion ?? '',
    categoria: datos.categoria,
    ubicacion: datos.ubicacion,
    responsable: datos.responsable ?? '',
    estado: 'activo',
    valor: Number(datos.valor) || 0,
    fechaAlta: new Date().toISOString(),
    foto: null,
    documentos: [],
  }

  activos.push(nuevoActivo)
  guardarActivos(activos)
  registrarMovimiento(nuevoActivo.id, {
    tipo: 'alta',
    detalle: `Alta del activo "${nuevoActivo.nombre}" (folio ${nuevoActivo.folio}).`,
    usuario,
  })

  return nuevoActivo
}

/** Edita los datos de un activo existente. No permitido si ya está dado de baja. */
export async function actualizarActivo({ id, datos, usuario }) {
  await retraso()
  validarDatosBasicos(datos)

  const activos = leerActivos()
  const activo = activos.find((a) => a.id === id)
  if (!activo) {
    throw new ActivoError('ACTIVO_NO_ENCONTRADO')
  }
  if (activo.estado === 'dado_de_baja') {
    throw new ActivoError('ACTIVO_DADO_DE_BAJA')
  }

  Object.assign(activo, {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion ?? '',
    categoria: datos.categoria,
    ubicacion: datos.ubicacion,
    responsable: datos.responsable ?? '',
    valor: Number(datos.valor) || 0,
    codigoBarras: datos.codigoBarras ?? '',
    rfid: datos.rfid ?? '',
  })
  guardarActivos(activos)
  registrarMovimiento(id, { tipo: 'edicion', detalle: 'Se actualizaron los datos del activo.', usuario })

  return activo
}

/** Da de baja un activo: cambia su estado, nunca borra el registro. */
export async function darDeBajaActivo({ id, motivo, usuario }) {
  await retraso()
  const activos = leerActivos()
  const activo = activos.find((a) => a.id === id)
  if (!activo) {
    throw new ActivoError('ACTIVO_NO_ENCONTRADO')
  }
  if (activo.estado === 'dado_de_baja') {
    throw new ActivoError('ACTIVO_DADO_DE_BAJA')
  }

  activo.estado = 'dado_de_baja'
  guardarActivos(activos)
  registrarMovimiento(id, { tipo: 'baja', detalle: `Baja del activo. Motivo: ${motivo}.`, usuario })

  return activo
}

/** Traslada un activo a otra ubicación y/o responsable. */
export async function trasladarActivo({ id, ubicacion, responsable, motivo, usuario }) {
  await retraso()
  const activos = leerActivos()
  const activo = activos.find((a) => a.id === id)
  if (!activo) {
    throw new ActivoError('ACTIVO_NO_ENCONTRADO')
  }
  if (activo.estado === 'dado_de_baja') {
    throw new ActivoError('ACTIVO_DADO_DE_BAJA')
  }

  const origen = { ubicacion: activo.ubicacion, responsable: activo.responsable }
  if (ubicacion) activo.ubicacion = ubicacion
  if (responsable) activo.responsable = responsable
  guardarActivos(activos)

  const destino = { ubicacion: activo.ubicacion, responsable: activo.responsable }
  let detalle = `Traslado de "${origen.ubicacion}" (${origen.responsable || 'sin responsable'}) a "${destino.ubicacion}" (${destino.responsable || 'sin responsable'}).`
  if (motivo?.trim()) {
    detalle += ` Motivo: ${motivo.trim()}.`
  }
  registrarMovimiento(id, { tipo: 'traslado', detalle, usuario })

  return activo
}

/** Borra los activos y movimientos de prueba, para volver al estado inicial vacío. */
export function reiniciarDatosDemo() {
  localStorage.removeItem(CLAVE_ACTIVOS)
  localStorage.removeItem(CLAVE_MOVIMIENTOS)
}
