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
- [ ] `integracionesService` real (SIGFE desde `/api/v1/contabilidad/activos`) — se conecta en C1 junto con la API pública (`docs/10`); mientras tanto su mock compone sobre datos reales

## Bloque B1 — Usuarios, auditoría y roles (no recortable)

- [ ] `permisos.js` centralizado en el front; los 4 archivos `permisos*.js` delegan en él (`docs/04`)
- [ ] `autorizar(...roles)` en **todas** las rutas según la matriz de `docs/04` (Consulta sin mutaciones: test obligatorio)
- [ ] Módulo Usuarios `/usuarios`: listado, crear (clave temporal una sola vez), editar, activar/desactivar, desbloquear, restablecer — solo Administrador; errores `CORREO_EN_USO`, `CUENTA_DEMO`, `ULTIMO_ADMINISTRADOR` (`docs/04`, RQ-06/07, DEMO-07)
- [ ] Auditoría (RQ-08): middleware `auditar(...)` en toda mutación + login/logout, pantalla con filtros y paginación, export reutilizando `exportar*.js` (`docs/05`)
- [ ] Pantalla solo lectura **Configuración → Perfiles y permisos** generada desde `permisos.js` (`docs/04`; recortable #5)

## Bloque B2 — Alertas, textos y depreciación mensual (no recortable)

- [ ] Campos `proximaMantencion` / `finGarantia` en formulario y ficha de activo (RQ-17)
- [ ] Alertas: `GET /api/alertas` + `resumen`, pantalla `/alertas` con badge en sidebar (`docs/07`)
- [ ] `BannerDemostracion` fijo en todas las pantallas, incluido login (`docs/13`)
- [ ] Login según `docs/13`: tarjetas "Cuentas de demostración" clicables (vía `GET /api/auth/cuentas-demo`), sin "entorno mock", sin botón de reinicio, cuentas `@demo.cl`
- [ ] Reinicio de demo movido a **Configuración → Reiniciar demo** (solo Administrador) (`docs/13`, `docs/14`)
- [ ] Renombre Actas (D-03): ruta `/actas`, "Actas de asignación", `cerrarActa`, campos `estado/cerradaPor/fechaCierre/selloIntegridad`, cero menciones a firma/Ley 19.799 (`grep -rni "firma" src/features/actas` = 0) (`docs/13`)
- [ ] Depreciación **lineal mensual** en `shared/depreciacion.js` (residual $1, tabla anual, vida acelerada, `vidaUtilRestanteMeses`) usada por front y servidor (`docs/09`, DEMO-05, D-06)
- [ ] Tabla de vida útil con columna "Acelerada", texto de referencia SII y validación (`docs/09`)
- [ ] Nombre del producto desde `src/config/producto.js` + título de `index.html` — **necesita T-01**

## Bloque B3 — Adjuntos con georreferencia (no recortable)

- [ ] Subida multipart (10 MB, whitelist por magic bytes, nombre aleatorio, anti path-traversal) (`docs/06`, `docs/14`, RQ-12)
- [ ] EXIF → latitud/longitud con exifr; indicador de georreferencia en la ficha (RQ-22)
- [ ] Galería/lista de adjuntos + foto principal en la ficha del activo
- [ ] Descarga autenticada `GET /api/adjuntos/:id` (verifica sesión y rol)

## Bloque C1 — Los 3 elementos adicionales verificables (no recortable)

- [ ] API pública `/api/v1` completa: activos, depreciación, movimientos, contabilidad (SIGFE + asientos), almacén/kardex, webhook demo — `X-API-Key` en tiempo constante, paginación, rate limit, auditada (`docs/10`, AD-01) — **necesita T-03 y T-05**
- [ ] `public/openapi.yaml` (OpenAPI 3.1) descargable; página Integraciones alimentada desde el yaml + botón "Probar" (`docs/10`)
- [ ] Mercado Público real: cliente `dominio/mp.js` (pausas 16–20 s, reintentos, errores traducidos), caché `OrdenCompraMP`, consultar/sincronizar/vincular OC, pantalla real (`docs/10`, AD-02) — **necesita T-02**
- [ ] Seed de 3–5 OC reales cacheadas y una vinculada a un activo (`docs/10`)

## Bloque C2 — Seed completo y solicitudes (seed no recortable; solicitudes P1)

- [ ] Seed de ~500 activos con distribución realista (fechas 2019–2026, estados, EAN-13 válidos, RFID 30 %, mantenciones/garantías) + usuarios extra + tabla de vida útil de 8 categorías (`docs/12`, RQ-24)
- [ ] `entregables/planilla-ejemplo-vista-general.xlsx` con 3.530 filas generada por el seed (`docs/12`)
- [ ] Solicitudes del portal: modelo + endpoints + crear/aprobar/rechazar/entregar (entrega genera egreso de almacén), "Mis solicitudes" para Funcionario (`docs/11`, AD-03; recortable #6)

## Bloque C3 — Etiquetas, escáner, campos personalizados, importador

- [ ] Etiqueta individual `GET /api/activos/:id/etiqueta.svg` (bwip-js Code128) + pliego de impresión (`docs/08`, RQ-19; hoja mural recortable #3)
- [ ] Campo "Escanear código" con autofoco + `GET /api/activos/por-codigo/:codigo` (RQ-20; lectura con cámara = recorte #1, ni empezarla)
- [ ] Campos personalizados: definición en `Configuracion`, editor y valores en ficha (`docs/08`, RQ-21; editor recortable #4)
- [ ] Importador Excel: previsualizar + confirmar (en memoria, mapeo por encabezados), auditado (`docs/12`, RQ-24; mapeo manual recortable #7)

## Bloque D — Cierre (no recortable)

- [x] Base E2E montada y en verde: Playwright con matriz de dispositivos (360 px, iPhone con motor WebKit real, tablet, escritorio), **98 pruebas** — barrido responsive de todos los módulos sin desbordes ni errores de consola, humo funcional (desplegable, modales, fichas), shell de scroll fijo y portal del Funcionario con su restricción de acceso (RQ-02, RQ-05, `docs/13` §360px)
- [ ] Suite unitaria (depreciación, folios concurrentes, kardex, permisos) y de API (matriz de autorización, stock insuficiente) en verde (`docs/15`)
- [ ] E2E Playwright de la pasada principal de 15 minutos (`docs/15`)
- [ ] Pasada DEMO-01…07 de 15 minutos ensayada y cronometrada (`docs/16`)
- [ ] Tabla RQ-01…RQ-27 verificada navegando la demo, con ruta exacta (`docs/16`)
- [ ] Manual de uso del demo en PDF + `entregables/` completo (`docs/16`, RQ-27)
- [ ] Restauración de respaldo ensayada una vez (`docs/14`)
- [ ] `git tag v1.0-oferta` y Definition of Done de `docs/16` completa

## Transversal — Seguridad (`docs/14`, se verifica en cada bloque)

- [ ] zod en toda entrada · helmet con CSP compatible Vite · CORS solo `ORIGEN_PERMITIDO`
- [ ] Logs pino sin contraseñas ni tokens · secretos solo en `.env`
- [ ] Cuentas demo que no pueden autosabotearse (ni clave, ni correo, ni rol, ni desactivarse)
- [ ] Filtrado por `usuarioId` de sesión (nunca del cliente) en solicitudes y "Mis bienes"
- [ ] Post-adjudicación: rotar `CLAVE_DEMO` y `API_DEMO_KEY`

## Decisiones pendientes de Francisco (`docs/17` — bloquean lo marcado arriba)

- [ ] **T-01** Nombre definitivo del producto (SISGA vs ActivosCloud) → bloquea textos de B2
- [x] **T-02a** `MP_API_TICKET` entregado y **validado contra la API real** (2026-08-26): listado por fecha y detalle por código responden bien; el ticket vive solo en `.env`
- [ ] **T-02b** Elegir 3–5 códigos de OC públicas (mobiliario/computación) para el seed — se pueden obtener del listado por fecha al construir C1
- [ ] **T-03** `CLAVE_DEMO` y `API_DEMO_KEY` → bloquea `.env` (A1) y `/api/v1` (C1)
- [ ] **T-04** Confirmar compromiso de disponibilidad 99,5 % (Anexo 2B) → afecta manual y `/api/salud`
- [ ] **T-05** Cuentas contables por categoría para SIGFE (o usar genérico referencial) → C1
