/**
 * Capa de servicio SIMULADA del módulo de Integraciones. A diferencia de
 * los demás mocks, no persiste nada en localStorage: no hay entidades
 * propias, solo lectura de activos reales del mock de Activos Fijos y
 * datos de ejemplo estáticos. `retraso()` se mantiene igual para
 * comportarse como una llamada real, aunque no haya nada que guardar.
 */
import * as activosService from '../../activos/services/activosService'
import { obtenerInfoEstado } from '../../activos/utils/estadoActivo'

function retraso(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Arma la exportación contable a partir de los activos reales del mock,
 * en el mismo formato documentado para GET /api/integracion/sigfe/activos.
 */
export async function obtenerExportacionSigfe() {
  await retraso()
  const activos = await activosService.buscarActivos({})

  return {
    encabezado: {
      institucion: 'Superintendencia de Seguridad Social',
      fechaGeneracion: new Date().toISOString(),
      totalRegistros: activos.length,
    },
    activos: activos.map((activo) => ({
      folio: activo.folio,
      nombre: activo.nombre,
      valorContable: activo.valor,
      estado: obtenerInfoEstado(activo.estado).etiqueta,
      fecha: activo.fechaAlta,
    })),
  }
}

/**
 * Simula la recepción de una orden de compra: NO escribe movimientos
 * reales en Almacén, solo devuelve la propuesta de lo que se registraría
 * (demostración del flujo, según piden las bases).
 */
export async function simularRecepcionOrdenCompra(orden) {
  await retraso()
  return {
    resultadoSimulado: true,
    movimientosSugeridos: orden.items.map((item) => ({
      item: item.nombre,
      tipo: 'ingreso',
      cantidad: item.cantidad,
      motivo: `Recepción OC ${orden.numeroOrdenCompra}`,
    })),
    nota: 'Simulación únicamente. No se registraron movimientos reales en Almacén.',
  }
}
