/**
 * Alertas calculadas a demanda, sin job (docs/07). Devuelve la lista
 * ordenada por severidad (alta primero) y fecha. La consumen el KPI del
 * panel (A2) y la pantalla /alertas con su badge (B2).
 */
import { db } from '../db.js'

const DIA_MS = 24 * 60 * 60 * 1000

export async function calcularAlertas(hoy = new Date()) {
  const en30 = new Date(hoy.getTime() + 30 * DIA_MS)
  const en60 = new Date(hoy.getTime() + 60 * DIA_MS)
  const hace90 = new Date(hoy.getTime() - 90 * DIA_MS)
  const hace2 = new Date(hoy.getTime() - 2 * DIA_MS)
  const alertas = []

  // stock <= stockMinimo compara dos columnas: se filtra en JS (los ítems
  // de la demo son pocos; docs/03 asume volúmenes de demo <= 4.000 filas).
  const [activos, itemsTodos, solicitudes] = await Promise.all([
    db.activo.findMany({
      where: {
        estado: { not: 'dado_de_baja' },
        OR: [{ finGarantia: { not: null } }, { proximaMantencion: { not: null } }],
      },
    }),
    db.itemAlmacen.findMany(),
    db.solicitud.findMany({ where: { estado: 'pendiente', fecha: { lt: hace2 } } }),
  ])

  for (const activo of activos) {
    const base = { entidad: 'activo', entidadId: activo.id, enlace: `/activos-fijos/${activo.id}` }
    if (activo.finGarantia) {
      if (activo.finGarantia < hoy && activo.finGarantia >= hace90) {
        alertas.push({
          ...base,
          tipo: 'garantia_vencida',
          severidad: 'alta',
          titulo: 'Garantía vencida',
          detalle: `La garantía de "${activo.nombre}" (${activo.folio}) venció.`,
          fecha: activo.finGarantia,
        })
      } else if (activo.finGarantia >= hoy && activo.finGarantia <= en60) {
        alertas.push({
          ...base,
          tipo: 'garantia_por_vencer',
          severidad: 'media',
          titulo: 'Garantía por vencer',
          detalle: `La garantía de "${activo.nombre}" (${activo.folio}) vence pronto.`,
          fecha: activo.finGarantia,
        })
      }
    }
    if (activo.proximaMantencion) {
      if (activo.proximaMantencion < hoy) {
        alertas.push({
          ...base,
          tipo: 'mantencion_atrasada',
          severidad: 'alta',
          titulo: 'Mantención atrasada',
          detalle: `"${activo.nombre}" (${activo.folio}) tiene su mantención atrasada.`,
          fecha: activo.proximaMantencion,
        })
      } else if (activo.proximaMantencion <= en30) {
        alertas.push({
          ...base,
          tipo: 'mantencion_proxima',
          severidad: 'media',
          titulo: 'Mantención próxima',
          detalle: `"${activo.nombre}" (${activo.folio}) tiene mantención programada.`,
          fecha: activo.proximaMantencion,
        })
      }
    }
  }

  for (const item of itemsTodos) {
    const base = { entidad: 'itemAlmacen', entidadId: item.id, enlace: `/almacen/${item.id}` }
    if (item.stock === 0) {
      alertas.push({
        ...base,
        tipo: 'sin_stock',
        severidad: 'alta',
        titulo: 'Sin stock',
        detalle: `"${item.nombre}" (${item.folio}) quedó sin stock.`,
        fecha: new Date(),
      })
    } else if (item.stock <= item.stockMinimo) {
      alertas.push({
        ...base,
        tipo: 'stock_bajo_minimo',
        severidad: 'media',
        titulo: 'Stock bajo el mínimo',
        detalle: `"${item.nombre}" (${item.folio}): ${item.stock} de un mínimo de ${item.stockMinimo}.`,
        fecha: new Date(),
      })
    }
  }

  for (const solicitud of solicitudes) {
    alertas.push({
      tipo: 'solicitud_pendiente',
      severidad: 'media',
      titulo: 'Solicitud pendiente',
      detalle: `La solicitud ${solicitud.folio} de ${solicitud.solicitanteNombre} lleva más de 2 días sin resolver.`,
      fecha: solicitud.fecha,
      entidad: 'solicitud',
      entidadId: solicitud.id,
      enlace: '/solicitudes',
    })
  }

  const pesoSeveridad = { alta: 0, media: 1 }
  return alertas.sort(
    (a, b) => pesoSeveridad[a.severidad] - pesoSeveridad[b.severidad] || b.fecha - a.fecha,
  )
}
