# Checklist de avance — SISGA (demo SUSESO 1607-11-LE26)

> Estado al **2026-08-26**. Tracker vivo: se marca cada ítem al completarlo y verificarlo.
> El orden de trabajo son los bloques **A1 → D** de `docs/16` (cada bloque deja algo demostrable).
> Si falta tiempo, se recorta **solo** según el orden de `docs/16`; la Definition of Done final también está ahí.

## ✅ Base ya lista

- [x] Frontend completo (React 19 + Vite 8): Acceso, Inicio, Activos, Almacén, Actas, Integraciones, Vida útil, Reportes, Autoconsulta — mocks en `localStorage`, build y lint limpios (`docs/00`)
- [x] Documentación `docs/00–17` integrada, revisada y consistente con el código
- [x] Migración a pnpm (`pnpm-lock.yaml`, overrides y builds en `pnpm-workspace.yaml`)
- [x] Correcciones aplicadas: rol `Bodeguero` → `Gestor de Activos` (D-11) · vida útil según SII (Maquinaria 15, Herramientas 8) · teléfono IP a *Equipos computacionales* · eliminado botón "Clave Única" del login
- [x] Repo en GitHub (`franciscodevccp/suseso`, rama `main`) con convención de commits en español
- [x] Usuario `sisga` creado en el VPS de Aeroconce (llave SSH, sin sudo) — listo para el despliegue

## Bloque A1 — Servidor, BD y primeros módulos conectados (no recortable)

- [x] Dependencias del servidor instaladas (`docs/02` §Arranque; prisma 7.10 CLI y cliente alineados, builds de argon2/prisma aprobados en `pnpm-workspace.yaml`)
- [x] PostgreSQL 16 de desarrollo en Docker (`docker-compose.yml`, volumen persistente; en el VPS se instala al desplegar)
- [x] `.env` + `config.js` con zod que aborta si falta una variable, más `.env.ejemplo` versionado — con valores provisionales de desarrollo; los reales son **T-03**
- [x] Arranque `server/index.js`: helmet/CSP, sesión en PostgreSQL (cookie `sisga.sid` httpOnly, rolling 30 min), 404 de API en formato `{codigo, mensaje}`, estáticos de `dist/` con fallback SPA — verificado en 3001 directo y vía proxy de Vite
- [x] Scripts de `package.json` (`dev` con concurrently, `start`, `db:migrate`, `db:seed`, `test`, `test:e2e`) + proxy `/api` en `vite.config.js` + ESLint con globals de Node para `server/`
- [x] Estructura `server/` completa (`index.js`, `config`, `db`, `http/errores`, `dominio/folios`)
- [x] `schema.prisma` completo: 8 enums y los 17 modelos de `docs/02` (Prisma 6, alineado al doc) + migración inicial aplicada; BD de dev en puerto **55432** (5432–5434 los ocupa un PostgreSQL nativo de la máquina)
- [x] Folios correlativos atómicos `dominio/folios.js` — verificado con transacciones en paralelo sin colisión (`docs/02`, RQ-14)
- ~~`GET /api/salud`~~ — descartado el 2026-08-26: front y API viven en el mismo proceso, el monitoreo es directo sobre el sitio (registro en `docs/17`)
- [x] Sesión por cookie `httpOnly` con TTL absoluto 8 h + inactividad 30 min (rolling), argon2id, bloqueo al 5º intento, rate limit login 10/15min y recuperación 5/h — todo verificado con pruebas reales contra la API (`docs/14`)
- [x] Auth completa: los 8 endpoints del contrato del mock (mismos códigos y formas), `shared/passwordRules.js` compartido front/servidor, `autorizar(...roles)`, auditoría de acceso según `docs/05`, y `POST /api/configuracion/reiniciar-demo` (solo Administrador) que restaura el seed y desbloquea cuentas
- [x] Seed mínimo reproducible (`pnpm db:seed` borra y recrea): 4 cuentas demo `@demo.cl` con `esCuentaDemo` y clave argon2id (`CLAVE_DEMO`), 8 categorías con vida útil SII, 8 ubicaciones, catálogos de almacén en `Configuracion`, los 3 activos y 4 ítems de los mocks, contadores de `Secuencia` alineados (`docs/04`, `docs/09`, `docs/12`)
- [x] Cliente `src/services/http.js` + evento `sesion-invalida` en `AuthContext` (`docs/03`)
- [x] `authService`, `activosService` y `almacenService` reales con el contrato exacto de los mocks + las 22 importaciones cambiadas (vistas y hooks intactos); los 3 mocks reemplazados fueron eliminados (D-08). Verificado de punta a punta en el navegador: login real, activo creado desde la UI con folio atómico `AF-2026-0004` + movimiento + auditoría, y egreso de almacén con `STOCK_INSUFICIENTE` protegiendo stock (operado por la cuenta Gestor: D-11 en acción)
- [ ] Un solo proceso: proxy `/api` en dev, `dist/` servido con fallback SPA en producción (`docs/02`, D-05)
- [x] `scripts/respaldo.sh` (`pg_dump -Fc` + tar de adjuntos, rotación 14 días; usa pg_dump nativo en el VPS o Docker en desarrollo) — probado y dump verificado restaurable con `pg_restore --list` (`docs/02`, RQ-11)

## Bloque A2 — Resto de mocks conectados (no recortable) ✅

- [x] `actasService` real: sello SHA-256 calculado en el servidor (formato `folio|contenido|usuario|fecha`), doble cierre rechazado (`ACTA_YA_CERRADA`); el servicio traduce al vocabulario viejo de la UI hasta el renombre de B2 (`docs/03`)
- [x] `vidaUtilService` real (`GET/PUT /api/configuracion/vida-util`, editar solo Administrador, `VALOR_INVALIDO`, auditado)
- [x] `reportesService` real: inventario, depreciación y movimientos con `{columnas, filas}` formateadas idénticas al mock; nuevos `kardex` y `bajas` listos en el servidor (`docs/03`)
- [x] `dashboardService` real (`docs/07`, RQ-16): 6 KPI (incluye **Valor libro total** con `shared/depreciacion.js` y **Solicitudes pendientes**), gráficos de barras reales por estado y categoría (nuevo `GraficoBarras`, sin librerías), actividad reciente unificada — el Inicio se ve vivo
- [x] `dominio/alertas.js` + `GET /api/alertas` y `/resumen` según las 7 reglas de `docs/07` (adelantado de B2; falta solo la pantalla y el badge)
- [x] Cero `localStorage` de negocio (D-07): eliminados los mocks de actas, vida útil, dashboard y reportes (D-08); solo queda `integracionesService.mock` hasta C1, que no persiste nada
- [x] Filtro **responsable** en `FiltrosActivos` + catálogo `GET /api/catalogos/funcionarios` (RQ-13)
- [x] `integracionesService` real (C1): mock y constantes eliminados; la página de documentación se alimenta de `/openapi.yaml` y "Probar" pasa por el servidor

## Bloque B1 — Usuarios, auditoría y roles (no recortable) ✅

- [x] `permisos.js` centralizado en el front (con la matriz D-10 como dato exportado); los 4 archivos `permisos*.js` delegan en él y `RutaAdministrativa` usa `puedeVerPanel` (`docs/04`)
- [x] `autorizar(...roles)` en **todas** las rutas según la matriz — verificado con pruebas reales: Consulta recibe 403 en mutaciones y en `/api/usuarios`, 200 en lecturas del panel
- [x] Módulo Usuarios `/usuarios` completo: listado con marca "Demo", crear (clave temporal mostrada UNA vez con copiar), editar, activar/desactivar, desbloquear, restablecer clave; `CORREO_EN_USO`, `CUENTA_DEMO` y `ULTIMO_ADMINISTRADOR` verificados. Ciclo DEMO-07 probado de punta a punta: crear → login con temporal → cambio obligatorio → login con clave nueva (`docs/04`, RQ-06/07)
- [x] Auditoría (RQ-08): pantalla `/auditoria` con filtros (usuario, módulo, acción, folio, rango de fechas con calendario propio), paginación de 50, export PDF/Excel/CSV del filtro completo (hasta 5.000), enlace desde la ficha del activo, y entrada en el Sidebar (`docs/05`; la IP se registra pero no se muestra, decisión en docs/17)
- [x] Pantalla solo lectura **Configuración → Perfiles y permisos** generada desde `permisos.js`, con subnavegación de Configuración (`docs/04`)
- [x] Extra de UI de esta pasada: `CampoFecha` (calendario propio es-CL, reutilizable en B2), popups con alineación automática contra el borde, campos numéricos sin flechas nativas

## Bloque B2 — Alertas, textos y depreciación mensual (no recortable) ✅

- [x] Campos `proximaMantencion` / `finGarantia` con calendario propio en formulario y ficha de activo (RQ-17)
- [x] Alertas: pantalla `/alertas` con filtros por tipo/severidad, export y estado vacío + **badge numérico en el Sidebar** refrescado cada 60 s (`docs/07`); los endpoints venían de A2
- [x] `BannerDemostracion` ámbar fijo en TODAS las pantallas, login incluido; oculto solo al imprimir (`docs/13`)
- [x] Login según `docs/13`: 4 tarjetas clicables que completan el formulario, clave entregada por `GET /api/auth/cuentas-demo` (activo solo con `MOSTRAR_CUENTAS_DEMO=true`), sin "entorno mock" ni botón de reinicio
- [x] **Configuración → Reiniciar demo** (solo Administrador, con confirmación): restaura el seed, cierra las sesiones y vuelve al login con aviso (`docs/13`, `docs/14`)
- [x] Renombre Actas (D-03) ejecutado completo: ruta `/actas`, "Actas de asignación y entrega", `cerrarActa`, campos definitivos sin traducciones, **cero menciones a firma/Ley 19.799**, y botón **"Verificar integridad"** que recalcula el sello en el servidor y compara (verificado en verde en pantalla)
- [x] Depreciación **lineal mensual** en `shared/depreciacion.js` (residual $1, cuota mensual, meses transcurridos, tabla anual, vida acelerada, `vidaUtilRestanteMeses`) usada por ficha, panel y reportes — con **7 pruebas unitarias en verde** (los casos exactos de `docs/09` §Tests); el reporte ganó fecha de alta, meses, columna acelerada y filtros de categoría/fecha de corte
- [x] Nombre del producto desde `src/config/producto.js` (**T-01 resuelto: SISGA**) + título `SISGA · Gestión de activos fijos y almacén`
- [x] Tabla de vida útil con columna "Acelerada" visible (editable por Administrador, opcional por categoría) y nota de referencia a la Resolución Exenta SII N°43/2002 en la pantalla (`docs/09`)

## Bloque B3 — Adjuntos con georreferencia (no recortable) ✅

- [x] Subida multipart en memoria: 10 MB máx., **whitelist por magic bytes** (JPG/PNG/WebP/PDF — un .txt disfrazado de .png rechazado con `TIPO_NO_PERMITIDO`, verificado), nombre aleatorio en `storage/adjuntos/`, anti path-traversal, auditado (`docs/06`, `docs/14`, RQ-12)
- [x] EXIF → latitud/longitud con exifr automático en fotos; "Ver en mapa" (OpenStreetMap, sin claves de API) cuando hay coordenadas (RQ-22). El botón "Usar mi ubicación" se descartó por decisión (docs/17); el endpoint conserva lat/lng manuales
- [x] Galería de fotos + lista de documentos descargables en la ficha, **foto principal automática** (primera foto) y cambiable, miniatura en el listado de activos, y recuadro "Próximamente" cuando no hay fotografía
- [x] Descarga autenticada `GET /api/adjuntos/:id` (sin sesión → 401, verificado; Content-Type del registro, inline imágenes / attachment PDF)
- [x] Selector de archivo con diseño propio (`components/common/CampoArchivo`) + test E2E del ciclo subir→galería→principal→eliminar

## Bloque C1 — Los 3 elementos adicionales verificables (no recortable) ✅

- [x] API pública `/api/v1` completa: activos (filtros + paginación), depreciación, movimientos, contabilidad (exportación SIGFE con cuentas por categoría + asientos mensuales), almacén/kardex, movimientos unificados y webhook demo — `X-API-Key` comparada en tiempo constante, rate limit 60/min, auditada como `api/consulta_v1` (`docs/10`, AD-01). Verificado con curl: 401 sin llave, 200 con llave
- [x] `public/openapi.yaml` (OpenAPI 3.1) descargable desde la página; documentación generada DESDE el yaml (nunca divergen), botón "Probar" por endpoint que ejecuta la llamada real vía `POST /api/integraciones/probar` (la llave nunca llega al navegador); sección de protocolo corregida (X-API-Key; fuera OAuth2/SOAP falsos)
- [x] Mercado Público real: cliente `dominio/mp.js` (pausas 16–20 s, 4 reintentos, 30 s por intento, `OC_NO_ENCONTRADA`/`MP_NO_DISPONIBLE`/`CODIGO_OC_INVALIDO`), caché `OrdenCompraMP` (sobrevive al reinicio de la demo), pantalla real: consultar (caché-primero con aviso honesto de ~20 s), sincronizar, vincular a activo, historial (`docs/10`, AD-02)
- [x] SIGFE real en pantalla: exportación generada desde la BD + tabla de **cuentas contables por categoría editable por Administrador** (T-05: plan genérico referencial 141.01–141.08)
- [x] 5 OC reales cacheadas (obras/computación/notebooks/mobiliario/impresoras) y `1057062-336-AG26` ("07 Notebook 15,6″") **vinculada a AF-2026-0001**, visible en la ficha (T-02b)

## Bloque C2 — Seed completo y solicitudes (seed no recortable; solicitudes P1) ✅

- [x] Seed completo y **determinista** (PRNG con semilla fija): 529 activos con distribución realista por 17 tipos (fechas 2019–2026 con casos en $1, 8 % reparación / 4 % baja / 1 % extraviado, EAN-13 **válidos**, RFID 30 %, serie/marca en ~300, mantenciones y garantías con los 4 casos exactos de alerta), 16 usuarios (2 no activos), 21 ubicaciones Huérfanos 1376, 40 funcionarios, 30 ítems de almacén (3 bajo mínimo, 1 sin stock) con kardex de 154 movimientos **consistente**, 8 actas (5 cerradas con sello válido — verificado por `/verificar`), 120 traslados/ediciones históricos, auditoría con 40 ingresos; la OC real vinculada se restaura sola si está en caché. Los 3 activos históricos del mock se conservan intactos (`docs/12`, RQ-24). Corre en ~11 s
- [x] `entregables/planilla-ejemplo-vista-general.xlsx` con **3.530 filas** generada por `pnpm db:seed` (prefijo EAN distinto del sembrado para la demo de importación en vivo) (`docs/12`)
- [x] Solicitudes (AD-03, `docs/11`) completas: endpoints crear/mias/catalogo/aprobar/rechazar (observación obligatoria)/**entregar con egresos en la misma transacción** (`STOCK_INSUFICIENTE` revierte todo — verificado), bandeja del panel con pestañas y badge en el Sidebar, portal "Mis solicitudes"/"Nueva solicitud"/detalle para Funcionario, sección "Solicitudes" en la ficha del ítem, auditoría en cada paso, y **spec E2E del ciclo completo** (crear → aprobar → entregar → egreso visible en kardex)

## Bloque C3 — Etiquetas, escáner, campos personalizados, importador ✅

- [x] Etiquetas (RQ-19, `docs/08`): `GET /api/activos/:id/etiqueta.svg` (bwip-js Code128 con texto legible; el folio es el código si no hay EAN — regla aplicada también al crear/editar), página de vista previa con impresión a **50×25 mm**, selección múltiple en el listado → **pliego 4×10 en A4**, botón "Imprimir etiqueta" en la ficha, y **hoja mural por ubicación en PDF** (jspdf, se genera al filtrar por ubicación — el recorte #3 no fue necesario)
- [x] Escáner (RQ-20): `CampoEscaneo` con autofoco en Activos (folio/EAN/RFID → ficha; código nuevo → "Dar de alta con este código" precargado) y en Almacén (folio BOD → ficha) — verificado con **3 pruebas E2E con eventos de teclado reales** (la lectura con cámara quedó fuera, recorte #1 según lo previsto)
- [x] Campos personalizados (RQ-21): definición en `Configuracion` (texto/número/fecha/lista, obligatorio, habilitado, orden), pantalla **Configuración → Campos personalizados** (edita Administrador), campos dinámicos en el formulario de activos con validación de obligatorios, valores en la ficha, y la **búsqueda por texto entra a los valores JSON** (filtro Prisma por campo definido, sin SQL crudo); seed con Número de serie + Centro de costo en ~300 activos
- [x] Importador Excel (RQ-24, criterio B.3): previsualizar (multipart 20 MB, magic bytes, exceljs en memoria, mapeo sugerido por encabezados **editable por columna**, validación de duplicados/valores/fechas, TTL 30 min) + confirmar (catálogos faltantes, folios correlativos reservados en bloque, lotes de 500, movimiento de alta por activo, auditado) + **reporte Excel descargable**. La planilla real de **3.530 filas importó en 0,9 s** (exigencia: <60 s). Pantalla de 3 pasos en Configuración → Importar planilla + prueba E2E de la previsualización

## Bloque D — Cierre (no recortable) ✅ (con 1 pendiente de harness)

- [x] Base E2E montada: Playwright con matriz de dispositivos (360 px, iPhone con motor WebKit real, tablet, escritorio) — barrido responsive de todos los módulos, humo funcional, shell fijo, portal del Funcionario (RQ-02, RQ-05)
- [x] Suite unitaria en verde: **24 pruebas** (depreciación 7, reglas de clave, generadores EAN-13/PRNG, importador: mapeo/valores/fechas/duplicados/vida útil) (`docs/15`)
- [x] Suite de API en verde: **19 pruebas** — matriz de autorización completa (sin sesión 401; Consulta 403 en TODA mutación; Funcionario 403 en el panel y filtro forzado a sus bienes; CUENTA_DEMO), /api/v1 (401/llave/paginación/webhook 202), adjuntos (magic bytes 415, descarga 401, ruta manipulada), **stock insuficiente revierte completo sin descontar**, auditoría 1 fila por mutación, **folios: 20 creaciones en paralelo correlativas** (`docs/15`)
- [x] E2E de la pasada principal (`tests/e2e/pasada.spec.js`, 6 flujos): crear→trasladar→historial+auditoría, kardex con bloqueo, descargas PDF/Excel/CSV, búsqueda combinada, badge=listado, ciclo de usuario con clave temporal y cambio obligatorio (`docs/15`)
- [ ] **T-06 (harness)**: corridas COMPLETAS repetidas en cadena muestran fragilidad (sesión de storageState compartida entre ~20 contextos + contención de 4 navegadores). Cada spec pasa por sí solo y la suite completa pasó varias veces hoy; NO afecta la demo real (cada evaluador usa su propia sesión). Mitigado a medias con sesiones propias por API en los specs que mutan; pendiente de estabilizar del todo
- [ ] Pasada DEMO-01…07 de 15 minutos ensayada y **cronometrada en vivo por Francisco** (la guía paso a paso ya está en el manual)
- [x] Tabla RQ-01…RQ-27 + AD + DEMO verificada navegando la demo, con ruta exacta: `entregables/tabla-verificacion-rq.md` (`docs/16`)
- [x] Manual del demo en PDF (`entregables/manual-demo-sisga.pdf`, 10 páginas): portada con accesos, ruta de 15 minutos, los 13 módulos con capturas, convenciones de depreciación, escáner sin lector, API, respaldo y soporte, nota de datos ficticios. Se regenera con la URL definitiva: `node scripts/manual.mjs --url https://…` (RQ-27)
- [x] `entregables/` completo: manual PDF, `openapi.yaml` (en `public/`, descargable de la demo), 12 pantallazos del portal (6 pantallas × escritorio/móvil), planilla de 3.530 filas, tabla de verificación RQ
- [x] Respaldo + **restauración ensayada** (`docs/14`): pg_dump del script diario restaurado en una base limpia — 534 activos, 17 usuarios y las 5 OC de Mercado Público íntegros
- [x] Definition of Done verificada: `pnpm build && pnpm start` sirve front (/), API (/api) y fallback SPA en **un solo proceso Node** (200/200/200); scripts `db:deploy` y `db:seed` listos para el VPS
- [x] `git tag v1.0-oferta`

## Transversal — Seguridad (`docs/14`, se verifica en cada bloque)

- [ ] zod en toda entrada · helmet con CSP compatible Vite · CORS solo `ORIGEN_PERMITIDO`
- [ ] Logs pino sin contraseñas ni tokens · secretos solo en `.env`
- [ ] Cuentas demo que no pueden autosabotearse (ni clave, ni correo, ni rol, ni desactivarse)
- [ ] Filtrado por `usuarioId` de sesión (nunca del cliente) en solicitudes y "Mis bienes"
- [ ] Post-adjudicación: rotar `CLAVE_DEMO` y `API_DEMO_KEY`

## Decisiones pendientes de Francisco (`docs/17` — bloquean lo marcado arriba)

- [ ] **T-01** Nombre definitivo del producto (SISGA vs ActivosCloud) → bloquea textos de B2
- [x] **T-02a** `MP_API_TICKET` entregado y **validado contra la API real** (2026-08-26): listado por fecha y detalle por código responden bien; el ticket vive solo en `.env`
- [x] **T-02b** 5 OC reales cacheadas (2026-08-27): `1002-355-SE26` (obras), `1087105-17-CM26` (equipos computacionales), `1057062-336-AG26` (notebooks — vinculada a AF-2026-0001), `2460-702-SE26` (mobiliario), `2292-6832-AG26` (impresoras)
- [ ] **T-03** `CLAVE_DEMO` y `API_DEMO_KEY` **definitivas** antes de la oferta (los valores de desarrollo ya operan en `.env`)
- [ ] **T-04** Confirmar compromiso de disponibilidad 99,5 % (Anexo 2B) → afecta manual y `/api/salud`
- [x] **T-05** Resuelto con el plan genérico referencial 141.01–141.08 (editable en pantalla por el Administrador); si SUSESO entrega su plan real, se reemplaza desde Integraciones → SIGFE sin tocar código
