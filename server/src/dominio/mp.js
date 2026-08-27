/**
 * Cliente de la API pública de Mercado Público (AD-02 — docs/10), con las
 * reglas heredadas del sweep de Francisco: pausa de 16–20 s entre
 * llamadas consecutivas, hasta 4 intentos con espera, tiempo máximo de
 * 30 s por intento y errores traducidos (OC_NO_ENCONTRADA,
 * MP_NO_DISPONIBLE). El ticket NUNCA llega al navegador.
 */
import { setTimeout as esperar } from 'node:timers/promises'
import { config } from '../config.js'
import { db } from '../db.js'
import { ErrorHttp } from '../http/errores.js'

export const FORMATO_CODIGO_OC = /^[0-9]{3,8}-[0-9]{1,5}-[A-Z]{2}[0-9]{2}$/

const PAUSA_MINIMA_MS = 16_000
const PAUSA_MAXIMA_MS = 20_000
const INTENTOS = 4
const TIMEOUT_MS = 30_000

let ultimaLlamada = 0

/** Serializa las llamadas dejando 16–20 s entre una y otra. */
async function respetarPausa() {
  const transcurrido = Date.now() - ultimaLlamada
  const pausa = PAUSA_MINIMA_MS + Math.random() * (PAUSA_MAXIMA_MS - PAUSA_MINIMA_MS)
  if (ultimaLlamada > 0 && transcurrido < pausa) {
    await esperar(pausa - transcurrido)
  }
  ultimaLlamada = Date.now()
}

function mapearOrden(cruda) {
  const items = (cruda.Items?.Listado ?? []).map((item) => ({
    nombre: item.Producto ?? item.EspecificacionComprador ?? 'Ítem',
    cantidad: item.Cantidad ?? null,
    unidad: item.Unidad ?? null,
    precioUnitario: item.PrecioNeto ?? null,
  }))
  return {
    codigo: cruda.Codigo,
    nombre: cruda.Nombre ?? '',
    proveedor: cruda.Proveedor?.Nombre ?? cruda.NombreProveedor ?? null,
    monto: cruda.Total ?? cruda.TotalNeto ?? null,
    fecha: cruda.Fechas?.FechaCreacion ? new Date(cruda.Fechas.FechaCreacion) : null,
    estado: cruda.Estado ?? null,
    items,
  }
}

/** Consulta EN VIVO una OC por código y la deja cacheada en la BD. */
export async function sincronizarOrdenCompra(codigo) {
  if (!FORMATO_CODIGO_OC.test(codigo)) throw new ErrorHttp('CODIGO_OC_INVALIDO', 400)

  const url = `https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json?codigo=${codigo}&ticket=${config.MP_API_TICKET}`

  let cuerpo = null
  for (let intento = 1; intento <= INTENTOS; intento++) {
    await respetarPausa()
    try {
      const controlador = new AbortController()
      const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS)
      const r = await fetch(url, { signal: controlador.signal })
      clearTimeout(temporizador)
      if (r.ok) {
        cuerpo = await r.json()
        break
      }
    } catch {
      // Timeout o error de red: se reintenta respetando la pausa.
    }
  }
  if (!cuerpo) throw new ErrorHttp('MP_NO_DISPONIBLE', 503)
  if (!cuerpo.Cantidad || !cuerpo.Listado?.length) throw new ErrorHttp('OC_NO_ENCONTRADA', 404)

  // `items` no es columna: viaja dentro de jsonCrudo y lo reconstruye
  // serializarOrden al leer.
  const orden = mapearOrden(cuerpo.Listado[0])
  const columnas = {
    codigo: orden.codigo,
    nombre: orden.nombre,
    proveedor: orden.proveedor,
    monto: orden.monto,
    fecha: orden.fecha,
    estado: orden.estado,
  }
  const guardada = await db.ordenCompraMP.upsert({
    where: { codigo: columnas.codigo },
    update: { ...columnas, jsonCrudo: cuerpo.Listado[0], sincronizadaEn: new Date() },
    create: { ...columnas, jsonCrudo: cuerpo.Listado[0] },
  })
  return { ...serializarOrden(guardada), origen: 'en_vivo' }
}

export function serializarOrden(fila) {
  const { jsonCrudo, ...orden } = fila
  const items = (jsonCrudo?.Items?.Listado ?? []).map((item) => ({
    nombre: item.Producto ?? item.EspecificacionComprador ?? 'Ítem',
    cantidad: item.Cantidad ?? null,
    unidad: item.Unidad ?? null,
    precioUnitario: item.PrecioNeto ?? null,
  }))
  return { ...orden, monto: orden.monto == null ? null : Number(orden.monto), items }
}

/** Lee del caché; si no existe, consulta en vivo (docs/10). */
export async function obtenerOrdenCompra(codigo) {
  if (!FORMATO_CODIGO_OC.test(codigo)) throw new ErrorHttp('CODIGO_OC_INVALIDO', 400)
  const cacheada = await db.ordenCompraMP.findUnique({ where: { codigo } })
  if (cacheada) return { ...serializarOrden(cacheada), origen: 'cache' }
  return sincronizarOrdenCompra(codigo)
}
