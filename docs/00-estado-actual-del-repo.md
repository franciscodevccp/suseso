# 00 — Estado actual del repositorio `sisga`

## Qué hay (y se conserva)
- **Stack:** React 19, Vite 8, react-router-dom 7, CSS Modules, JavaScript (sin TypeScript). `exceljs`, `jspdf` + `jspdf-autotable` ya instalados. Build y lint limpios (`pnpm install --frozen-lockfile && pnpm build && pnpm lint`).
- **Estructura:** `src/features/<dominio>/{pages,components,hooks,mock,utils,constants}` + `src/components/{common,layout}` + `src/theme`. Cada dominio tiene un `*.mock.js` que es la única "base de datos" (`localStorage`) y expone funciones `async` con el contrato que la UI consume.
- **Módulos con pantalla terminada:** Acceso (login, recuperación, clave temporal, bloqueo a los 5 intentos, expiración por inactividad a los 20 min con aviso a 1 min), Inicio (estructura de KPIs y gráficos), Activos fijos (listado con filtros, alta, edición, ficha con historial, traslado, baja), Almacén (ítems, alta, ficha, ingreso/egreso con rechazo de stock negativo), Actas (listado, crear, ficha, "firma" con sello SHA-256), Integraciones (documentación de 4 endpoints, vista SIGFE, simulación de OC de Mercado Público), Configuración → Vida útil, Reportes (inventario, depreciación, movimientos; exportación PDF/Excel/CSV), Autoconsulta (buscar bien por folio/código/RFID, "Mis bienes").
- **Vacíos:** `/alertas` y `/usuarios` renderizan `ModuloEnConstruccion`. El mock de dashboard devuelve `0` y `[]` (el Inicio se ve vacío).
- **Roles en código:** `Administrador` y `Funcionario` (semilla). `permisosActivos.js` ya nombra un rol **`Gestor de Activos`** que no existe en la semilla; se adopta como el rol operador (`docs/04`). El rol **`Bodeguero`** que aparecía en `permisosAlmacen.js`, `AltaItemPage.jsx` y `TablaVidaUtil.jsx` ya fue reemplazado por `Gestor de Activos` (D-11, aplicado el 2026-08-26).
- **Estados:** activo → `activo | en_reparacion | dado_de_baja | extraviado`; acta → `pendiente | firmada`; stock → derivado (`Sin stock | Bajo mínimo | Normal`).
- **Entidades hoy:**
  - Activo: `id, folio (AF-AAAA-NNNN), codigoBarras, rfid, nombre, descripcion, categoria (texto), ubicacion (texto), responsable (texto), estado, valor, fechaAlta, foto (null), documentos ([])`.
  - Movimiento de activo: `id, activoId, tipo (alta|edicion|traslado|baja), detalle, usuario, fecha`.
  - Ítem de almacén: `id, folio (BOD-AAAA-NNNN), nombre, categoria, unidad, stock, stockMinimo, ubicacion`. Movimiento: `tipo (ingreso|egreso), cantidad, stockResultante, motivo, usuario, fecha`.
  - Acta: `id, folio, tipo, activoId, activoFolio, activoNombre, responsable, contenido, estadoFirma, firmante, fechaFirma, selloVerificacion, creadaPor, fecha`.
  - Vida útil: `[{categoria, vidaUtilAnios}]` (la categoría se enlaza por **nombre exacto**).
  - Usuario: `id, nombre, email, clave (texto plano en mock), rol, estado (activo|inactivo|bloqueado), claveTemporal, fechaUltimoCambioClave, intentosFallidos`.
- **Datos de prueba:** 3 activos, 4 ítems, 2 usuarios (`admin@suseso.gob.cl`, `funcionario@suseso.gob.cl`), tabla de vida útil de 6 categorías (Maquinaria 15 y Herramientas 8, ya corregidas según la referencia SII de `docs/09`). El "Teléfono IP Cisco 8841" de la semilla está en *Equipos computacionales*.

## Qué está mal o falta (resumen; detalle en `docs/01`)
1. **Sin servidor ni base de datos.** Persistencia en `localStorage` → cada navegador ve datos distintos; nada de respaldos, auditoría real, API ni permisos verificables en el servidor.
2. **Módulos en construcción:** Usuarios (RQ-06, DEMO-07) y Alertas (RQ-17).
3. **No implementado:** auditoría (RQ-08), adjuntos (RQ-12), etiquetas e impresión (RQ-19), escáner con autofoco (RQ-20), campos personalizados (RQ-21), georreferencia (RQ-22), importador y volumen de datos (RQ-24), solicitudes en el portal (AD-03), endpoints reales y `openapi.yaml` (AD-01), consulta real a Mercado Público (AD-02).
4. **Textos y reglas:** sin banner de demostración; el login dice "entorno mock" y tiene botón de reiniciar datos; cuentas con dominio `@suseso.gob.cl`; el módulo "Actas y firma" menciona firma electrónica avanzada y la Ley 19.799 (prohibido, `docs/13`); depreciación por años completos con residual 0 (`docs/09`).

## Puntos de reemplazo de los mocks (importaciones actuales)
| Consumidor | Importa |
|---|---|
| `features/auth/context/AuthContext.jsx`, `pages/{ChangePassword,ForcePasswordChange,ForgotPassword,ResetPassword,Login}Page.jsx` | `auth/mock/authService.mock` |
| `features/activos/hooks/{useActivo,useActivos,useCatalogosActivos}.js`, `pages/{AltaActivo,EditarActivo,FichaActivo}Page.jsx`, `actas/hooks/useActivosDisponibles.js`, `autoconsulta/{hooks/useMisBienes.js,pages/*}`, `integraciones/mock`, `reportes/mock` | `activos/mock/activosService.mock` |
| `features/almacen/hooks/{useCatalogosAlmacen,useItem,useItems}.js`, `pages/{AltaItem,FichaItem}Page.jsx`, `reportes/mock` | `almacen/mock/almacenService.mock` |
| `features/actas/hooks/{useActa,useActas}.js`, `pages/{CrearActa,FichaActa}Page.jsx` | `actas/mock/actasService.mock` |
| `features/depreciacion/hooks/*`, `pages/VidaUtilPage.jsx`, `reportes/mock` | `depreciacion/mock/vidaUtilService.mock` |
| `features/dashboard/hooks/useDashboardResumen.js` | `dashboard/mock/dashboardService.mock` |
| `features/integraciones/pages/*` | `integraciones/mock/integracionesService.mock` |
| `features/reportes/pages/ReportesPage.jsx` | `reportes/mock/reportesService.mock` |

`LoginPage.jsx` además importa `reiniciarDatosDemo` de cuatro mocks para el botón de reinicio: ese botón sale del login (`docs/13`).
