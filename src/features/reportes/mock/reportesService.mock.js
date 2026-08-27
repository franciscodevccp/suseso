/**
 * Capa de servicio de los reportes. No es un mock con persistencia propia
 * (no hay entidad "reporte" que guardar): cada función compone datos ya
 * existentes en activosService/almacenService/vidaUtilService y los deja
 * en la forma común { columnas, filas } que consumen la vista previa y
 * los 3 exportadores (CSV/Excel/PDF), con cada valor ya formateado tal
 * como debe verse.
 */
import * as activosService from '../../activos/services/activosService'
import * as almacenService from '../../almacen/services/almacenService'
import * as vidaUtilService from '../../depreciacion/mock/vidaUtilService.mock'
import { calcularDepreciacion } from '../../depreciacion/utils/calculoDepreciacion'
import { obtenerInfoEstado } from '../../activos/utils/estadoActivo'
import { formatearMoneda } from '../../../utils/formatoMoneda'

const formatearFechaHora = (fecha) =>
  fecha ? new Date(fecha).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

// --- 1. Inventario de activos ----------------------------------------------

export async function generarReporteInventario({ categoria = '', ubicacion = '', estado = '' } = {}) {
  const activos = await activosService.buscarActivos({ categoria, ubicacion, estado })

  return {
    columnas: [
      { clave: 'folio', etiqueta: 'Folio' },
      { clave: 'nombre', etiqueta: 'Nombre' },
      { clave: 'categoria', etiqueta: 'Categoría' },
      { clave: 'ubicacion', etiqueta: 'Ubicación' },
      { clave: 'responsable', etiqueta: 'Responsable' },
      { clave: 'estado', etiqueta: 'Estado' },
      { clave: 'valor', etiqueta: 'Valor' },
    ],
    filas: activos.map((activo) => ({
      folio: activo.folio,
      nombre: activo.nombre,
      categoria: activo.categoria,
      ubicacion: activo.ubicacion,
      responsable: activo.responsable || '—',
      estado: obtenerInfoEstado(activo.estado).etiqueta,
      valor: formatearMoneda(activo.valor),
    })),
  }
}

// --- 2. Depreciación --------------------------------------------------------

/** Misma regla que BloqueDepreciacion: si está dado de baja, se detiene en la fecha de su movimiento de baja. */
async function obtenerFechaCorte(activo) {
  if (activo.estado !== 'dado_de_baja') return undefined
  const movimientos = await activosService.obtenerMovimientosPorActivo(activo.id)
  return movimientos.find((movimiento) => movimiento.tipo === 'baja')?.fecha
}

export async function generarReporteDepreciacion() {
  const [activos, tablaVidaUtil] = await Promise.all([
    activosService.buscarActivos({}),
    vidaUtilService.obtenerTablaVidaUtil(),
  ])
  const mapaVidaUtil = new Map(tablaVidaUtil.map((fila) => [fila.categoria, fila.vidaUtilAnios]))
  const activosConValor = activos.filter((activo) => activo.valor > 0)

  const filas = await Promise.all(
    activosConValor.map(async (activo) => {
      const vidaUtilAnios = mapaVidaUtil.get(activo.categoria) ?? null
      const base = {
        folio: activo.folio,
        nombre: activo.nombre,
        categoria: activo.categoria,
        valorAdquisicion: formatearMoneda(activo.valor),
      }

      if (!vidaUtilAnios) {
        return {
          ...base,
          vidaUtil: 'Sin configurar',
          depreciacionAnual: '—',
          depreciacionAcumulada: '—',
          valorLibro: '—',
        }
      }

      const fechaCorte = await obtenerFechaCorte(activo)
      const resultado = calcularDepreciacion({
        valor: activo.valor,
        fechaAlta: activo.fechaAlta,
        vidaUtilAnios,
        fechaCorte,
      })

      return {
        ...base,
        vidaUtil: `${vidaUtilAnios} años`,
        depreciacionAnual: formatearMoneda(resultado.depreciacionAnual),
        depreciacionAcumulada: formatearMoneda(resultado.depreciacionAcumulada),
        valorLibro: formatearMoneda(resultado.valorLibro),
      }
    }),
  )

  return {
    columnas: [
      { clave: 'folio', etiqueta: 'Folio' },
      { clave: 'nombre', etiqueta: 'Nombre' },
      { clave: 'categoria', etiqueta: 'Categoría' },
      { clave: 'valorAdquisicion', etiqueta: 'Valor de adquisición' },
      { clave: 'vidaUtil', etiqueta: 'Vida útil' },
      { clave: 'depreciacionAnual', etiqueta: 'Depreciación anual' },
      { clave: 'depreciacionAcumulada', etiqueta: 'Depreciación acumulada' },
      { clave: 'valorLibro', etiqueta: 'Valor libro' },
    ],
    filas,
  }
}

// --- 3. Movimientos ----------------------------------------------------------

const ETIQUETA_TIPO_ACTIVO = { alta: 'Alta', edicion: 'Edición', baja: 'Baja', traslado: 'Traslado' }
const ETIQUETA_TIPO_ALMACEN = { ingreso: 'Ingreso', egreso: 'Egreso' }

export async function generarReporteMovimientos({ desde = '', hasta = '' } = {}) {
  // Se piden primero los activos/ítems (y no junto a los movimientos en el
  // mismo Promise.all): son los que "siembran" sus datos de prueba la
  // primera vez que se leen, y esa siembra debe completarse antes de leer
  // los movimientos — si no, en un reinicio de datos recién hecho, la
  // lectura de movimientos (con un retraso menor) puede ganarle a la
  // siembra y devolver una lista vacía por una carrera de promesas.
  const [activos, items] = await Promise.all([
    activosService.buscarActivos({}),
    almacenService.obtenerItems(),
  ])
  const [movimientosActivos, movimientosAlmacen] = await Promise.all([
    activosService.obtenerTodosLosMovimientos(),
    almacenService.obtenerTodosLosMovimientos(),
  ])
  const mapaActivos = new Map(activos.map((activo) => [activo.id, activo.folio]))
  const mapaItems = new Map(items.map((item) => [item.id, item.folio]))

  const filasActivos = movimientosActivos.map((movimiento) => ({
    fecha: movimiento.fecha,
    origen: 'Activos fijos',
    folio: mapaActivos.get(movimiento.activoId) ?? '—',
    tipo: ETIQUETA_TIPO_ACTIVO[movimiento.tipo] ?? movimiento.tipo,
    detalle: movimiento.detalle,
    usuario: movimiento.usuario,
  }))

  const filasAlmacen = movimientosAlmacen.map((movimiento) => ({
    fecha: movimiento.fecha,
    origen: 'Almacén',
    folio: mapaItems.get(movimiento.itemId) ?? '—',
    tipo: ETIQUETA_TIPO_ALMACEN[movimiento.tipo] ?? movimiento.tipo,
    detalle: `${movimiento.tipo === 'ingreso' ? '+' : '-'}${movimiento.cantidad} — ${movimiento.motivo}`,
    usuario: movimiento.usuario,
  }))

  let todas = [...filasActivos, ...filasAlmacen].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  if (desde) todas = todas.filter((fila) => new Date(fila.fecha) >= new Date(desde))
  if (hasta) todas = todas.filter((fila) => new Date(fila.fecha) <= new Date(`${hasta}T23:59:59`))

  return {
    columnas: [
      { clave: 'fecha', etiqueta: 'Fecha' },
      { clave: 'origen', etiqueta: 'Origen' },
      { clave: 'folio', etiqueta: 'Folio' },
      { clave: 'tipo', etiqueta: 'Tipo' },
      { clave: 'detalle', etiqueta: 'Detalle' },
      { clave: 'usuario', etiqueta: 'Usuario' },
    ],
    filas: todas.map((fila) => ({ ...fila, fecha: formatearFechaHora(fila.fecha) })),
  }
}
