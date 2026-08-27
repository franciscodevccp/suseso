/**
 * Catálogo estático de los endpoints documentados. Los ejemplos de
 * request/response están armados a mano (no generados en runtime): son
 * la especificación técnica en sí, deben leerse siempre igual.
 */
export const ENDPOINTS_API = [
  {
    id: 'listado-activos',
    metodo: 'GET',
    ruta: '/api/activos',
    descripcion:
      'Lista de activos fijos institucionales, para consumo de sistemas externos autorizados.',
    entrada:
      'Query params opcionales: categoria, ubicacion, estado (coincidencia exacta). Sin parámetros, retorna el listado completo.',
    responseEjemplo: `[
  {
    "folio": "AF-2026-0001",
    "nombre": "Notebook Lenovo ThinkPad E14",
    "categoria": "Equipos computacionales",
    "ubicacion": "Edificio Central - Piso 2",
    "responsable": "Funcionario Demo",
    "estado": "activo",
    "valor": 620000
  },
  {
    "folio": "AF-2026-0002",
    "nombre": "Escritorio ejecutivo",
    "categoria": "Mobiliario",
    "ubicacion": "Edificio Central - Piso 2",
    "responsable": "Funcionario Demo",
    "estado": "activo",
    "valor": 145000
  }
]`,
  },
  {
    id: 'detalle-activo',
    metodo: 'GET',
    ruta: '/api/activos/:folio',
    descripcion: 'Detalle de un activo específico, identificado por su folio institucional.',
    entrada: 'Parámetro de ruta: folio (ej. AF-2026-0001).',
    responseEjemplo: `{
  "folio": "AF-2026-0001",
  "nombre": "Notebook Lenovo ThinkPad E14",
  "descripcion": "Equipo portátil asignado para labores administrativas.",
  "categoria": "Equipos computacionales",
  "ubicacion": "Edificio Central - Piso 2",
  "responsable": "Funcionario Demo",
  "estado": "activo",
  "valor": 620000,
  "fechaAlta": "2026-02-26T15:04:00.000Z",
  "codigoBarras": "7801112223334",
  "rfid": "RFID-A001"
}`,
  },
  {
    id: 'exportacion-sigfe',
    metodo: 'GET',
    ruta: '/api/integracion/sigfe/activos',
    descripcion:
      'Exporta los activos fijos en el formato contable requerido por SIGFE, para su carga en el sistema contable de la institución.',
    entrada: 'Sin parámetros. Retorna siempre el estado contable vigente al momento de la consulta.',
    responseEjemplo: `{
  "encabezado": {
    "institucion": "Superintendencia de Seguridad Social",
    "fechaGeneracion": "2026-08-26T14:32:10.000Z",
    "totalRegistros": 2
  },
  "activos": [
    {
      "folio": "AF-2026-0001",
      "nombre": "Notebook Lenovo ThinkPad E14",
      "valorContable": 620000,
      "estado": "Activo",
      "fecha": "2026-02-26T15:04:00.000Z"
    }
  ]
}`,
  },
  {
    id: 'recepcion-orden-compra',
    metodo: 'POST',
    ruta: '/api/integracion/mercadopublico/orden-compra',
    descripcion:
      'Recibe una orden de compra emitida desde mercadopublico.cl, para su posterior recepción de mercadería en Almacén.',
    entrada: 'Cuerpo JSON con la orden de compra (ver ejemplo de solicitud).',
    requestEjemplo: `{
  "numeroOrdenCompra": "3853-124-COT26",
  "proveedor": {
    "rut": "76.123.456-7",
    "razonSocial": "Distribuidora ABC Ltda."
  },
  "fechaEmision": "2026-08-20",
  "items": [
    { "nombre": "Resma de papel carta", "cantidad": 50, "unidad": "resma", "precioUnitario": 3200 },
    { "nombre": "Tóner HP 05A", "cantidad": 8, "unidad": "unidad", "precioUnitario": 45000 }
  ]
}`,
    responseEjemplo: `{
  "recibido": true,
  "numeroOrdenCompra": "3853-124-COT26",
  "mensaje": "Orden de compra recibida. Quedará disponible para su recepción en el módulo de Almacén."
}`,
  },
]
