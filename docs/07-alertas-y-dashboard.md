# 07 — Alertas (RQ-17) y datos del panel de control (RQ-16)

## Alertas — se calculan a demanda, sin job
`server/src/dominio/alertas.js` → `calcularAlertas(hoy)` devuelve:
| Tipo | Regla | Enlace |
|---|---|---|
| `garantia_por_vencer` | `finGarantia` entre hoy y hoy + 60 días | ficha del activo |
| `garantia_vencida` | `finGarantia < hoy` y activo no dado de baja (últimos 90 días) | ficha |
| `mantencion_proxima` | `proximaMantencion` entre hoy y hoy + 30 días | ficha |
| `mantencion_atrasada` | `proximaMantencion < hoy` | ficha |
| `stock_bajo_minimo` | `stock <= stockMinimo` y `stock > 0` | ficha del ítem |
| `sin_stock` | `stock = 0` | ficha del ítem |
| `solicitud_pendiente` | solicitud en estado pendiente hace más de 2 días | bandeja de solicitudes |

Endpoints: `GET /api/alertas` → `[{tipo, severidad (alta|media), titulo, detalle, fecha, entidad, entidadId, enlace}]` ordenadas por severidad y fecha · `GET /api/alertas/resumen` → `{ total, porTipo }` (lo consume el badge del Sidebar, refrescado cada 60 s).

## Pantalla `/alertas` (hoy `ModuloEnConstruccion`)
Tabla con filtro por tipo y severidad, columna de enlace, exportar Excel/CSV/PDF. Estado vacío: "No hay alertas vigentes". Badge numérico junto a "Alertas" en el Sidebar.

## Campos nuevos en el formulario de activo (`FormularioActivo.jsx`)
Sección "Mantención y garantía": `proximaMantencion` (fecha, opcional), `finGarantia` (fecha, opcional). Se muestran en la ficha, pestaña Datos.

## Panel de control — datos reales
El mock devuelve ceros; `useDashboardResumen.js` ya espera `{ totalActivos, valorTotalInventariado, alertasVigentes, itemsBajoStockMinimo }`, distribución por estado, activos por categoría y actividad reciente. Implementar los cuatro endpoints (`docs/03`) con agregaciones Prisma (`groupBy`, `_sum`, `_count`). Agregar KPI **Valor libro total** (usa `shared/depreciacion.js`) y **Solicitudes pendientes**; `KpiCard` ya existe. Los gráficos: `EmptyChartCard` se reemplaza por barras simples en SVG/CSS (sin librería nueva) o se mantiene la tarjeta con la tabla de valores; ambas opciones son válidas para la comisión, lo importante es que **se vea vivo al primer login** con el seed.
