/**
 * Reportes (docs/03): el servidor devuelve { columnas, filas } con cada
 * valor YA formateado tal como debe verse — exactamente la forma que
 * generaba el mock — y la exportación PDF/Excel/CSV sigue en el navegador
 * con los utilitarios existentes. Incluye los dos nuevos: kardex y bajas.
 */
import { Router } from 'express'
import { calcularDepreciacion } from '../../../shared/depreciacion.js'
import { formatearMoneda } from '../../../shared/formatoMoneda.js'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'
import { autorizar } from '../middleware/autorizar.js'

export const rutasReportes = Router()

const PANEL = ['Administrador', 'Gestor de Activos', 'Consulta']

const ETIQUETA_ESTADO = {
  activo: 'Activo',
  en_reparacion: 'En reparación',
  dado_de_baja: 'Dado de baja',
  extraviado: 'Extraviado',
}
const ETIQUETA_TIPO_ACTIVO = { alta: 'Alta', edicion: 'Edición', baja: 'Baja', traslado: 'Traslado', reparacion: 'Reparación' }

const formatearFechaHora = (fecha) =>
  fecha ? new Date(fecha).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

// --- 1. Inventario de activos ------------------------------------------

rutasReportes.get('/inventario', autorizar(...PANEL), async (req, res, next) => {
  try {
    const { categoria = '', ubicacion = '', estado = '' } = req.query
    const activos = await db.activo.findMany({
      where: {
        ...(categoria ? { categoria: String(categoria) } : {}),
        ...(ubicacion ? { ubicacion: String(ubicacion) } : {}),
        ...(estado ? { estado: String(estado) } : {}),
      },
      orderBy: { folio: 'asc' },
    })

    res.json({
      columnas: [
        { clave: 'folio', etiqueta: 'Folio' },
        { clave: 'nombre', etiqueta: 'Nombre' },
        { clave: 'categoria', etiqueta: 'Categoría' },
        { clave: 'ubicacion', etiqueta: 'Ubicación' },
        { clave: 'responsable', etiqueta: 'Responsable' },
        { clave: 'estado', etiqueta: 'Estado' },
        { clave: 'valor', etiqueta: 'Valor' },
      ],
      filas: activos.map((a) => ({
        folio: a.folio,
        nombre: a.nombre,
        categoria: a.categoria,
        ubicacion: a.ubicacion,
        responsable: a.responsable || '—',
        estado: ETIQUETA_ESTADO[a.estado] ?? a.estado,
        valor: formatearMoneda(Number(a.valor)),
      })),
    })
  } catch (err) {
    next(err)
  }
})

// --- 2. Depreciación ----------------------------------------------------

rutasReportes.get('/depreciacion', autorizar(...PANEL), async (req, res, next) => {
  try {
    const fechaCorteParam = req.query.fechaCorte ? new Date(String(req.query.fechaCorte)) : undefined
    const filtroCategoria = String(req.query.categoria ?? '')
    const [activos, categorias, bajas] = await Promise.all([
      db.activo.findMany({
        where: { valor: { gt: 0 }, ...(filtroCategoria ? { categoria: filtroCategoria } : {}) },
        orderBy: { folio: 'asc' },
      }),
      db.categoria.findMany(),
      db.movimientoActivo.findMany({ where: { tipo: 'baja' }, orderBy: { fecha: 'desc' } }),
    ])
    const vidaUtil = new Map(categorias.map((c) => [c.nombre, c]))
    const fechaBaja = new Map()
    for (const m of bajas) if (!fechaBaja.has(m.activoId)) fechaBaja.set(m.activoId, m.fecha)

    const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-CL')
    const hayAcelerada = activos.some((a) => vidaUtil.get(a.categoria)?.vidaUtilAcelerada)

    const filas = activos.map((a) => {
      const cat = vidaUtil.get(a.categoria)
      const base = {
        folio: a.folio,
        nombre: a.nombre,
        categoria: a.categoria,
        fechaAlta: formatearFecha(a.fechaAlta),
        valorAdquisicion: formatearMoneda(Number(a.valor)),
      }
      if (!cat?.vidaUtilAnios) {
        return {
          ...base,
          vidaUtil: 'Sin configurar',
          meses: '—',
          depreciacionAcumulada: '—',
          valorLibro: '—',
          valorLibroAcelerado: '—',
        }
      }
      // Misma regla que la ficha: si está dado de baja, el cálculo se
      // detiene en la fecha del movimiento de baja.
      const fechaCorte = a.estado === 'dado_de_baja' ? (fechaBaja.get(a.id) ?? a.fechaBaja ?? undefined) : fechaCorteParam
      const r = calcularDepreciacion({
        valor: Number(a.valor),
        fechaAlta: a.fechaAlta,
        vidaUtilAnios: cat.vidaUtilAnios,
        vidaUtilAcelerada: cat.vidaUtilAcelerada ?? null,
        ...(fechaCorte ? { fechaCorte } : {}),
      })
      return {
        ...base,
        vidaUtil: `${cat.vidaUtilAnios} años`,
        meses: `${r.mesesTranscurridos} de ${cat.vidaUtilAnios * 12}`,
        depreciacionAcumulada: formatearMoneda(r.depreciacionAcumulada),
        valorLibro: formatearMoneda(r.valorLibro),
        valorLibroAcelerado: r.acelerada ? formatearMoneda(r.acelerada.valorLibro) : '—',
      }
    })

    res.json({
      columnas: [
        { clave: 'folio', etiqueta: 'Folio' },
        { clave: 'nombre', etiqueta: 'Nombre' },
        { clave: 'categoria', etiqueta: 'Categoría' },
        { clave: 'fechaAlta', etiqueta: 'Fecha de alta' },
        { clave: 'valorAdquisicion', etiqueta: 'Valor de adquisición' },
        { clave: 'vidaUtil', etiqueta: 'Vida útil' },
        { clave: 'meses', etiqueta: 'Meses' },
        { clave: 'depreciacionAcumulada', etiqueta: 'Depreciación acumulada' },
        { clave: 'valorLibro', etiqueta: 'Valor libro' },
        ...(hayAcelerada
          ? [{ clave: 'valorLibroAcelerado', etiqueta: 'Valor libro (acelerada)' }]
          : []),
      ],
      filas,
    })
  } catch (err) {
    next(err)
  }
})

// --- 3. Movimientos -----------------------------------------------------

rutasReportes.get('/movimientos', autorizar(...PANEL), async (req, res, next) => {
  try {
    const { desde = '', hasta = '' } = req.query
    const filtroFecha = {
      ...(desde ? { gte: new Date(String(desde)) } : {}),
      ...(hasta ? { lte: new Date(`${hasta}T23:59:59`) } : {}),
    }
    const conFiltro = desde || hasta ? { fecha: filtroFecha } : {}

    const [movActivos, movAlmacen, activos, items] = await Promise.all([
      db.movimientoActivo.findMany({ where: conFiltro, orderBy: { fecha: 'desc' }, take: 5000 }),
      db.movimientoAlmacen.findMany({ where: conFiltro, orderBy: { fecha: 'desc' }, take: 5000 }),
      db.activo.findMany({ select: { id: true, folio: true } }),
      db.itemAlmacen.findMany({ select: { id: true, folio: true } }),
    ])
    const folioActivo = new Map(activos.map((a) => [a.id, a.folio]))
    const folioItem = new Map(items.map((i) => [i.id, i.folio]))

    const filas = [
      ...movActivos.map((m) => ({
        fecha: m.fecha,
        origen: 'Activos fijos',
        folio: folioActivo.get(m.activoId) ?? '—',
        tipo: ETIQUETA_TIPO_ACTIVO[m.tipo] ?? m.tipo,
        detalle: m.detalle,
        usuario: m.usuario,
      })),
      ...movAlmacen.map((m) => ({
        fecha: m.fecha,
        origen: 'Almacén',
        folio: folioItem.get(m.itemId) ?? '—',
        tipo: m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
        detalle: `${m.tipo === 'ingreso' ? '+' : '-'}${m.cantidad} — ${m.motivo}`,
        usuario: m.usuario,
      })),
    ].sort((a, b) => b.fecha - a.fecha)

    res.json({
      columnas: [
        { clave: 'fecha', etiqueta: 'Fecha' },
        { clave: 'origen', etiqueta: 'Origen' },
        { clave: 'folio', etiqueta: 'Folio' },
        { clave: 'tipo', etiqueta: 'Tipo' },
        { clave: 'detalle', etiqueta: 'Detalle' },
        { clave: 'usuario', etiqueta: 'Usuario' },
      ],
      filas: filas.map((f) => ({ ...f, fecha: formatearFechaHora(f.fecha) })),
    })
  } catch (err) {
    next(err)
  }
})

// --- Nuevos (docs/03): kardex por ítem y bajas del período --------------

rutasReportes.get('/kardex', autorizar(...PANEL), async (req, res, next) => {
  try {
    const itemId = String(req.query.itemId ?? '')
    if (!itemId) throw new ErrorHttp('ITEM_NO_ENCONTRADO', 404)
    const item = await db.itemAlmacen.findUnique({ where: { id: itemId } })
    if (!item) throw new ErrorHttp('ITEM_NO_ENCONTRADO', 404)

    const movimientos = await db.movimientoAlmacen.findMany({
      where: { itemId },
      orderBy: { fecha: 'asc' },
    })
    res.json({
      columnas: [
        { clave: 'fecha', etiqueta: 'Fecha' },
        { clave: 'tipo', etiqueta: 'Tipo' },
        { clave: 'cantidad', etiqueta: 'Cantidad' },
        { clave: 'stockResultante', etiqueta: 'Stock resultante' },
        { clave: 'motivo', etiqueta: 'Motivo' },
        { clave: 'usuario', etiqueta: 'Usuario' },
      ],
      filas: movimientos.map((m) => ({
        fecha: formatearFechaHora(m.fecha),
        tipo: m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
        cantidad: `${m.tipo === 'ingreso' ? '+' : '-'}${m.cantidad} ${item.unidad}`,
        stockResultante: `${m.stockResultante} ${item.unidad}`,
        motivo: m.motivo || '—',
        usuario: m.usuario,
      })),
    })
  } catch (err) {
    next(err)
  }
})

rutasReportes.get('/bajas', autorizar(...PANEL), async (_req, res, next) => {
  try {
    const bajas = await db.activo.findMany({
      where: { estado: 'dado_de_baja' },
      orderBy: { fechaBaja: 'desc' },
    })
    res.json({
      columnas: [
        { clave: 'folio', etiqueta: 'Folio' },
        { clave: 'nombre', etiqueta: 'Nombre' },
        { clave: 'categoria', etiqueta: 'Categoría' },
        { clave: 'valor', etiqueta: 'Valor' },
        { clave: 'fechaBaja', etiqueta: 'Fecha de baja' },
        { clave: 'motivoBaja', etiqueta: 'Motivo' },
      ],
      filas: bajas.map((a) => ({
        folio: a.folio,
        nombre: a.nombre,
        categoria: a.categoria,
        valor: formatearMoneda(Number(a.valor)),
        fechaBaja: formatearFechaHora(a.fechaBaja),
        motivoBaja: a.motivoBaja ?? '—',
      })),
    })
  } catch (err) {
    next(err)
  }
})
