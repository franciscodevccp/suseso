/**
 * Exportación contable (AD-01, docs/10): la misma forma que mostraba la
 * vista SIGFE, ahora calculada con los activos reales y la depreciación
 * compartida. Las cuentas contables por categoría viven en Configuracion
 * (clave `cuentas_contables`) y son referenciales (T-05), editables desde
 * la pantalla SIGFE.
 */
import { calcularDepreciacion } from '../../../shared/depreciacion.js'
import { db } from '../db.js'

const ETIQUETA_ESTADO = {
  activo: 'Activo',
  en_reparacion: 'En reparación',
  dado_de_baja: 'Dado de baja',
  extraviado: 'Extraviado',
}

export async function obtenerCuentasContables() {
  const fila = await db.configuracion.findUnique({ where: { clave: 'cuentas_contables' } })
  return fila?.valor ?? {}
}

async function activosValorizados(fechaCorte) {
  const [activos, categorias, cuentas] = await Promise.all([
    db.activo.findMany({ orderBy: { folio: 'asc' } }),
    db.categoria.findMany(),
    obtenerCuentasContables(),
  ])
  const vidaUtil = new Map(categorias.map((c) => [c.nombre, c.vidaUtilAnios]))

  return activos.map((a) => {
    const anios = vidaUtil.get(a.categoria)
    const valor = Number(a.valor)
    const corte = a.estado === 'dado_de_baja' && a.fechaBaja ? a.fechaBaja : fechaCorte
    const r = anios
      ? calcularDepreciacion({
          valor,
          fechaAlta: a.fechaAlta,
          vidaUtilAnios: anios,
          ...(corte ? { fechaCorte: corte } : {}),
        })
      : null
    return {
      folio: a.folio,
      nombre: a.nombre,
      categoria: a.categoria,
      cuentaContable: cuentas[a.categoria] ?? null,
      valorAdquisicion: valor,
      depreciacionAcumulada: r ? Math.round(r.depreciacionAcumulada) : 0,
      valorLibro: r ? Math.round(r.valorLibro) : valor,
      estado: ETIQUETA_ESTADO[a.estado] ?? a.estado,
      fechaAlta: a.fechaAlta,
    }
  })
}

/** { encabezado, activos[] } — la exportación que consume SIGFE (docs/10). */
export async function exportacionContable(fechaCorte) {
  const activos = await activosValorizados(fechaCorte)
  return {
    encabezado: {
      institucion: 'Superintendencia de Seguridad Social',
      fechaGeneracion: new Date().toISOString(),
      ...(fechaCorte ? { fechaCorte: new Date(fechaCorte).toISOString() } : {}),
      totalRegistros: activos.length,
    },
    activos,
  }
}

const clavePeriodo = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`

/**
 * Asientos de depreciación MENSUAL por categoría (docs/10): un asiento
 * por período y categoría con cuota vigente, en formato listo para un
 * sistema contable.
 */
export async function asientosDepreciacion(desde, hasta) {
  const [activos, categorias, cuentas] = await Promise.all([
    db.activo.findMany({ where: { valor: { gt: 0 } } }),
    db.categoria.findMany(),
    obtenerCuentasContables(),
  ])
  const vidaUtil = new Map(categorias.map((c) => [c.nombre, c.vidaUtilAnios]))

  const inicio = new Date(desde.getFullYear(), desde.getMonth(), 1)
  const fin = new Date(hasta.getFullYear(), hasta.getMonth(), 1)
  const asientos = []

  for (let mes = new Date(inicio); mes <= fin; mes.setMonth(mes.getMonth() + 1)) {
    const cierreDeMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0)
    const porCategoria = new Map()

    for (const a of activos) {
      const anios = vidaUtil.get(a.categoria)
      if (!anios) continue
      const alta = new Date(a.fechaAlta)
      const fueraDeVida =
        alta > cierreDeMes ||
        (a.estado === 'dado_de_baja' && a.fechaBaja && new Date(a.fechaBaja) < mes)
      if (fueraDeVida) continue

      // La cuota del período es la diferencia de acumuladas entre el
      // cierre de este mes y el del anterior: exacta también en el último
      // mes de vida útil (cuando solo resta una fracción del depreciable).
      const parametros = { valor: Number(a.valor), fechaAlta: a.fechaAlta, vidaUtilAnios: anios }
      const cierreAnterior = new Date(mes.getFullYear(), mes.getMonth(), 0)
      const acumuladaHoy = calcularDepreciacion({ ...parametros, fechaCorte: cierreDeMes }).depreciacionAcumulada
      const acumuladaAntes =
        cierreAnterior < alta
          ? 0
          : calcularDepreciacion({ ...parametros, fechaCorte: cierreAnterior }).depreciacionAcumulada
      const cuotaDelMes = acumuladaHoy - acumuladaAntes
      if (cuotaDelMes <= 0) continue
      porCategoria.set(a.categoria, (porCategoria.get(a.categoria) ?? 0) + cuotaDelMes)
    }

    for (const [categoria, monto] of porCategoria) {
      asientos.push({
        periodo: clavePeriodo(mes),
        categoria,
        cuentaContable: cuentas[categoria] ?? null,
        monto: Math.round(monto),
        glosa: `Depreciación mensual ${clavePeriodo(mes)} — ${categoria}`,
      })
    }
  }

  return asientos
}
