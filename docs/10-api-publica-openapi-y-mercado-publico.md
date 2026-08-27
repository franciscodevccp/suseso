# 10 — API pública, OpenAPI y Mercado Público (AD-01, AD-02)

Las bases exigen que los elementos adicionales estén "efectivamente descritos, sustentados y **verificables**"; para la API piden **protocolo, formato de datos y especificación técnica adjunta**. Hoy la página de Integraciones describe endpoints que no existen: eso es "mención genérica". Hay que poder invocarlos.

## AD-01 — API pública `/api/v1` (JSON, REST, solo lectura + un webhook demo)
Autenticación por cabecera `X-API-Key` comparada en tiempo constante contra `API_DEMO_KEY` (`docs/14`). Sin clave o clave inválida → `401 { codigo: "NO_AUTORIZADO" }`. Paginación `?pagina=1&porPagina=100` (máx. 100). Todas las respuestas `{ datos, paginacion? }`. Rate limit 60 req/min por clave. Cada request se audita como `api/consulta_v1`.

| Método y ruta | Devuelve |
|---|---|
| `GET /api/v1/activos` | listado con filtros `estado, categoria, ubicacion, desde, hasta` |
| `GET /api/v1/activos/{folio}` | ficha completa + adjuntos (metadatos) |
| `GET /api/v1/activos/{folio}/depreciacion?fechaCorte=` | `docs/09` |
| `GET /api/v1/activos/{folio}/movimientos` | trazabilidad |
| `GET /api/v1/contabilidad/activos?fechaCorte=` | **exportación contable** (misma forma que hoy muestra la vista SIGFE: `{ encabezado, activos: [{folio, nombre, categoria, cuentaContable, valorAdquisicion, depreciacionAcumulada, valorLibro, estado, fechaAlta}] }`) |
| `GET /api/v1/contabilidad/asientos?desde=&hasta=` | asientos de depreciación mensual por categoría (generados con `shared/depreciacion.js`), formato listo para un sistema contable |
| `GET /api/v1/almacen/items` · `GET /api/v1/almacen/items/{folio}/kardex` | stock y kardex |
| `GET /api/v1/movimientos?desde=&hasta=` | movimientos de activos y almacén |
| `POST /api/v1/webhooks/contabilidad` | recibe `{ referencia, fecha, asientos:[...] }`, lo guarda en `Configuracion` (clave `webhook_contabilidad_ultimo`) y responde `202 { recibido: true, referencia }`. Demuestra la ida y vuelta sin tocar activos |

`cuentaContable` por categoría: mapa en `Configuracion` (`cuentas_contables`), editable desde la pantalla SIGFE; valores de ejemplo tipo plan de cuentas público, rotulados como referenciales (`docs/17` T-05).

## Especificación técnica — `public/openapi.yaml`
OpenAPI 3.1 con todos los endpoints anteriores, esquemas (`Activo`, `Depreciacion`, `ItemAlmacen`, `Movimiento`, `ExportacionContable`, `Asiento`, `WebhookContabilidad`), `securitySchemes: ApiKeyAuth (header X-API-Key)` y ejemplos. Se descarga desde la página de Integraciones (botón "Descargar especificación OpenAPI") y **se adjunta a la propuesta técnica** como la especificación que exigen las bases.

Página `/integraciones` (`DocumentacionApiPage`): mantener el diseño de `TarjetaEndpoint`, pero alimentarlas desde `openapi.yaml` (parsear con `js-yaml`, dependencia pequeña) y agregar por endpoint un botón **"Probar"** que ejecuta la llamada con la API key demo y muestra la respuesta real en `BloqueCodigo` (ya existe). La API key demo se imprime en el manual, no en el código del front.

## AD-02 — Mercado Público
Cliente en servidor `server/src/dominio/mp.js` contra la API pública de Mercado Público (`https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json?codigo=<codigoOC>&ticket=<MP_API_TICKET>`). Reglas heredadas del sweep de Francisco: pausa de 16–20 s entre llamadas consecutivas, reintentos ×4 con espera, tiempo máximo 30 s, errores traducidos (`OC_NO_ENCONTRADA`, `MP_NO_DISPONIBLE`). El ticket **nunca** llega al navegador.

- `GET /api/mercadopublico/ordenes/:codigo` → lee de `OrdenCompraMP` (caché); si no existe, consulta en vivo, guarda y devuelve `{ codigo, nombre, proveedor, monto, fecha, estado, items[], sincronizadaEn, origen: "cache"|"en_vivo" }`.
- `POST /api/mercadopublico/ordenes/:codigo/sincronizar` → fuerza consulta en vivo (spinner honesto: "Consultando a Mercado Público…").
- `POST /api/activos/:id/vincular-oc` `{ codigo }` → guarda `ordenCompraMPCodigo`, auditoría `oc_vinculada`; la ficha del activo muestra "Orden de compra: 2153-956-SE24 · Proveedor · $monto" con enlace a la vista de la OC.
- Formato de código válido: `^[0-9]{3,8}-[0-9]{1,5}-[A-Z]{2}[0-9]{2}$` (ej. `2153-956-SE24`). Validar antes de llamar.

Pantalla `/integraciones/mercadopublico` (`IntegracionMercadoPublicoPage`): reemplazar la simulación por: campo "Código de orden de compra" → consultar → tarjeta con los datos reales → "Vincular a un activo" (selector) o "Registrar ingreso en almacén" (prellena un movimiento de ingreso con los ítems de la OC; el usuario confirma). Historial de OC consultadas (tabla desde `OrdenCompraMP`).

**Seed:** consultar y cachear 3–5 OC reales y públicas de compras de mobiliario/computación de organismos públicos, y vincular una a un activo, para que la comisión vea el flujo completo sin depender de la latencia de Mercado Público el día de la revisión. Si la API no responde durante la revisión, el caché sigue mostrando datos reales con su fecha de sincronización.
