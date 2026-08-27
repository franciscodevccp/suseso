/**
 * Orden de compra de ejemplo (mercadopublico.cl). Usa nombres de ítems
 * que calzan con la semilla de Almacén (ver almacenService.mock.js),
 * para que la demostración de "esto ingresaría a bodega" sea coherente
 * con el resto de la aplicación.
 */
export const ORDEN_COMPRA_EJEMPLO = {
  numeroOrdenCompra: '3853-124-COT26',
  proveedor: {
    rut: '76.123.456-7',
    razonSocial: 'Distribuidora ABC Ltda.',
  },
  fechaEmision: '2026-08-20',
  items: [
    { nombre: 'Resma de papel carta', cantidad: 50, unidad: 'resma', precioUnitario: 3200 },
    { nombre: 'Tóner HP 05A', cantidad: 8, unidad: 'unidad', precioUnitario: 45000 },
  ],
}
