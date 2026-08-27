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
- [ ] Estructura `server/` completa: falta `src/db.js` (PrismaClient), que llega con el schema
- [ ] `schema.prisma` completo: 8 enums y modelos Usuario, TokenRecuperacion, Categoria, Ubicacion, Funcionario, Activo, MovimientoActivo, Adjunto, ItemAlmacen, MovimientoAlmacen, Acta, Solicitud, SolicitudItem, OrdenCompraMP, Auditoria, Configuracion, Secuencia (`docs/02`) + migración inicial (`pnpm db:migrate`)
- [ ] Folios correlativos atómicos `dominio/folios.js` (`INSERT … ON CONFLICT … RETURNING` en transacción) para AF/BOD/ACT/SOL (`docs/02`, RQ-14)
- ~~`GET /api/salud`~~ — descartado el 2026-08-26: front y API viven en el mismo proceso, el monitoreo es directo sobre el sitio (registro en `docs/17`)
- [ ] Sesión por cookie `httpOnly` (`express-session` + `connect-pg-simple`, TTL 8 h, inactividad 30 min), argon2, bloqueo a los 5 intentos, rate limit de login (`docs/14`)
- [ ] Auth completa: los 8 endpoints de `authService` con mismos errores (`docs/03`) y `shared/passwordRules.js`
- [ ] Seed mínimo: 4 cuentas demo `@demo.cl` endurecidas (`esCuentaDemo`), catálogos, los 3 activos y 4 ítems actuales (`docs/04`, `docs/12`)
- [ ] Cliente `src/services/http.js` + evento `sesion-invalida` en `AuthContext` (`docs/03`)
- [ ] `authService`, `activosService` y `almacenService` reales + cambio de importaciones listadas en `docs/00` (vistas y hooks intactos)
- [ ] Un solo proceso: proxy `/api` en dev, `dist/` servido con fallback SPA en producción (`docs/02`, D-05)
- [ ] `scripts/respaldo.sh` (`pg_dump` + tar de adjuntos, rotación 14 días) (`docs/02`, RQ-11)

## Bloque A2 — Resto de mocks conectados (no recortable)

- [ ] `actasService` real (incluye sello SHA-256 en servidor) (`docs/03`)
- [ ] `vidaUtilService` real (`GET/PUT /api/configuracion/vida-util`, editar solo Administrador)
- [ ] `reportesService` real (inventario, depreciación, movimientos; exportación sigue en el navegador) + nuevos kardex y bajas (`docs/03`)
- [ ] `dashboardService` real: resumen, por estado, por categoría, actividad reciente — el Inicio deja de verse en cero (`docs/07`, RQ-16)
- [ ] `integracionesService` real (SIGFE desde `/api/v1/contabilidad/activos`) (`docs/10`)
- [ ] Cero `localStorage` de negocio; mocks eliminados a medida que cada servicio queda conectado y probado (D-07, D-08)
- [ ] Filtro **responsable** agregado a `FiltrosActivos` (RQ-13, el backend ya lo soportará)

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

- [ ] Suite unitaria (depreciación, folios concurrentes, kardex, permisos) y de API (matriz de autorización, stock insuficiente) en verde (`docs/15`)
- [ ] E2E Playwright de la pasada principal (`docs/15`)
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
