# 02 — Backend y base de datos

## Decisión (D-01 en `docs/17`)
Se **conserva la SPA de Vite** y se agrega un servidor `server/` en el mismo repositorio. No se migra a Next.js: la interfaz ya está hecha y el riesgo está en el tiempo, no en el framework.

| Capa | Tecnología | Por qué |
|---|---|---|
| Runtime | Node 22 LTS, pnpm (el repo ya usa pnpm; `pnpm-workspace.yaml` guarda overrides y permisos de build) | — |
| Servidor | Express 5, JavaScript ESM (mismo lenguaje que el front) | Sin paso de build ni tipos que aprender |
| Base de datos | PostgreSQL 16 + Prisma 6 | RQ-23; respaldos triviales (R19 del foro acepta SQL) |
| Validación | zod | Toda entrada validada (`docs/14`) |
| Sesión | `express-session` + `connect-pg-simple` (cookie httpOnly) | Sesiones en BD, sobrevive reinicios |
| Contraseñas | argon2 | — |
| Archivos | multer (memoria) → disco en `storage/adjuntos/` | Sin S3 |
| Código de barras | bwip-js | Code128 en SVG/PNG (`docs/08`) |
| EXIF | exifr | GPS de fotos (`docs/06`) |
| Excel | exceljs (ya instalado) | Importador (`docs/12`) |
| Seguridad | helmet, express-rate-limit | `docs/14` |
| Logs | pino | JSON, sin datos sensibles |

## Estructura
```
server/
  index.js                 # arranque: helmet, sesión, rutas, estáticos de dist/, /api/salud
  prisma/schema.prisma
  prisma/seed.js           # docs/12
  src/
    config.js              # lee .env con zod, falla si falta algo
    db.js                  # PrismaClient único
    http/errores.js        # ErrorHttp(codigo, status); handler que responde { codigo, mensaje }
    middleware/{sesion,autorizar,auditoria,apiKey,rateLimit}.js
    rutas/{auth,usuarios,activos,adjuntos,almacen,actas,vidaUtil,dashboard,alertas,reportes,
           solicitudes,importaciones,configuracion,auditoria,mercadoPublico,etiquetas,v1,salud}.js
    dominio/{folios,depreciacion,kardex,alertas,mp}.js
shared/
  depreciacion.js          # función pura, importada por front y servidor (docs/09)
storage/adjuntos/          # gitignored
```

## Arranque y comandos
```bash
pnpm add express@5 @prisma/client prisma zod argon2 express-session connect-pg-simple pg multer exifr bwip-js helmet express-rate-limit pino cookie-parser
pnpm add -D concurrently supertest vitest @playwright/test
```
`package.json` (scripts):
```json
"dev": "concurrently \"vite\" \"node --watch server/index.js\"",
"build": "vite build",
"start": "node server/index.js",
"db:migrate": "prisma migrate dev --schema server/prisma/schema.prisma",
"db:seed": "node server/prisma/seed.js",
"test": "vitest run",
"test:e2e": "playwright test"
```
`vite.config.js`: `server.proxy = { '/api': 'http://localhost:3001' }`. En producción `server/index.js` sirve `dist/` con fallback a `index.html` para las rutas del router, así Francisco despliega **un solo proceso** (`pnpm build && pnpm start`).

`.env` (todas obligatorias; `config.js` aborta si falta una):
```
DATABASE_URL=postgresql://sisga:***@localhost:5432/sisga
SESSION_SECRET=<64 hex>
CLAVE_DEMO=<clave única de las 4 cuentas demo>
API_DEMO_KEY=<token para /api/v1>
MP_API_TICKET=<ticket API pública Mercado Público>
PUERTO=3001
ORIGEN_PERMITIDO=https://inventario.aeroconce.cl
STORAGE_DIR=./storage
```

## Schema Prisma (referencia; nombres de campo iguales a los del front)
```prisma
enum Rol            { ADMINISTRADOR GESTOR CONSULTA FUNCIONARIO }
enum EstadoUsuario  { activo inactivo bloqueado }
enum EstadoActivo   { activo en_reparacion dado_de_baja extraviado }
enum TipoMovActivo  { alta edicion traslado baja reparacion }
enum TipoMovAlmacen { ingreso egreso }
enum EstadoActa     { pendiente cerrada }
enum TipoAdjunto    { foto pdf orden_compra garantia otro }
enum EstadoSolicitud{ pendiente aprobada rechazada entregada }

model Usuario {
  id String @id @default(cuid())
  nombre String
  email String @unique
  claveHash String
  rol Rol
  estado EstadoUsuario @default(activo)
  claveTemporal Boolean @default(false)
  fechaUltimoCambioClave DateTime @default(now())
  intentosFallidos Int @default(0)
  esCuentaDemo Boolean @default(false)   // no puede cambiar clave/correo ni ser eliminada (docs/14)
  creadoEn DateTime @default(now())
}
model TokenRecuperacion { token String @id; usuarioId String; expiraEn DateTime }

model Categoria   { id String @id @default(cuid()); nombre String @unique; vidaUtilAnios Int; vidaUtilAcelerada Int? }
model Ubicacion   { id String @id @default(cuid()); nombre String @unique; tipo String @default("oficina") } // oficina | bodega
model Funcionario { id String @id @default(cuid()); nombre String @unique; cargo String?; correo String? }

model Activo {
  id String @id @default(cuid())
  folio String @unique                 // AF-AAAA-NNNN (docs/02 §folios)
  codigoBarras String @unique
  rfid String? @unique
  nombre String
  descripcion String @default("")
  categoria String                      // nombre exacto de Categoria (la UI trabaja con nombres)
  ubicacion String
  responsable String @default("")
  estado EstadoActivo @default(activo)
  valor Decimal @db.Decimal(14,2)
  fechaAlta DateTime
  fechaBaja DateTime?
  motivoBaja String?
  proximaMantencion DateTime?          // RQ-17
  finGarantia DateTime?                // RQ-17
  camposPersonalizados Json?           // RQ-21
  ordenCompraMPCodigo String?          // AD-02
  fotoPrincipalId String?              // RQ-12 (id de Adjunto tipo foto)
  movimientos MovimientoActivo[]
  adjuntos Adjunto[]
  @@index([categoria]) @@index([ubicacion]) @@index([estado]) @@index([responsable])
}
model MovimientoActivo {
  id String @id @default(cuid())
  activoId String
  activo Activo @relation(fields:[activoId], references:[id])
  tipo TipoMovActivo
  detalle String
  usuario String                       // nombre visible (la UI lo muestra tal cual)
  usuarioId String?
  ubicacionAnterior String? ubicacionNueva String?
  responsableAnterior String? responsableNuevo String?
  fecha DateTime @default(now())
  @@index([activoId, fecha])
}
model Adjunto {
  id String @id @default(cuid())
  activoId String
  activo Activo @relation(fields:[activoId], references:[id])
  tipo TipoAdjunto
  nombreOriginal String
  ruta String                          // nombre aleatorio en storage/adjuntos
  mime String
  tamano Int
  latitud Float? longitud Float?       // RQ-22
  subidoPor String
  fecha DateTime @default(now())
}
model ItemAlmacen {
  id String @id @default(cuid())
  folio String @unique                 // BOD-AAAA-NNNN
  nombre String
  categoria String
  unidad String
  stock Int @default(0)
  stockMinimo Int @default(0)
  ubicacion String
  movimientos MovimientoAlmacen[]
}
model MovimientoAlmacen {
  id String @id @default(cuid())
  itemId String
  item ItemAlmacen @relation(fields:[itemId], references:[id])
  tipo TipoMovAlmacen
  cantidad Int
  stockResultante Int
  motivo String @default("")
  usuario String
  solicitudId String?
  fecha DateTime @default(now())
  @@index([itemId, fecha])
}
model Acta {
  id String @id @default(cuid())
  folio String @unique                 // ACT-AAAA-NNNN
  tipo String
  activoId String? activoFolio String? activoNombre String?
  responsable String
  contenido String
  estado EstadoActa @default(pendiente)
  cerradaPor String? fechaCierre DateTime? selloIntegridad String?
  creadaPor String
  fecha DateTime @default(now())
}
model Solicitud {                       // AD-03 (docs/11)
  id String @id @default(cuid())
  folio String @unique                 // SOL-AAAA-NNNN
  solicitanteId String
  solicitanteNombre String
  estado EstadoSolicitud @default(pendiente)
  observacion String @default("")
  resueltaPor String? fechaResolucion DateTime?
  items SolicitudItem[]
  fecha DateTime @default(now())
}
model SolicitudItem { id String @id @default(cuid()); solicitudId String; solicitud Solicitud @relation(fields:[solicitudId], references:[id]); itemId String; itemNombre String; cantidad Int }
model OrdenCompraMP {                   // AD-02 (docs/10)
  codigo String @id
  nombre String
  proveedor String?
  monto Decimal? @db.Decimal(14,2)
  fecha DateTime?
  estado String?
  jsonCrudo Json
  sincronizadaEn DateTime @default(now())
}
model Auditoria {                       // RQ-08 (docs/05)
  id String @id @default(cuid())
  fecha DateTime @default(now())
  usuarioId String? usuarioNombre String
  modulo String accion String
  entidad String? entidadId String? entidadFolio String?
  detalle String
  ip String?
  @@index([fecha]) @@index([usuarioNombre]) @@index([modulo])
}
model Configuracion { clave String @id; valor Json }   // campos personalizados (docs/08), parámetros
model Secuencia     { nombre String @id; valor Int }   // AF-2026, BOD-2026, ACT-2026, SOL-2026
```

## Folios correlativos (RQ-14)
`dominio/folios.js`: `siguienteFolio(tx, 'AF')` ejecuta `INSERT ... ON CONFLICT (nombre) DO UPDATE SET valor = valor + 1 RETURNING valor` con nombre `AF-<año>` **dentro de la transacción** que crea el registro. Formato `AF-2026-0001`, `BOD-2026-0001`, `ACT-2026-0001`, `SOL-2026-0001`. Test de concurrencia obligatorio (`docs/15`).

## `/api/salud`
`GET /api/salud` → `{ estado: "ok", version, baseDatos: "ok"|"error", fecha }`. Sin sesión. Es lo que Francisco monitorea (RQ-10).

## Respaldos (RQ-11)
`scripts/respaldo.sh`: `pg_dump -Fc` a `backups/sisga-<fecha>.dump` + `tar` de `storage/adjuntos`, rotación de 14 días. Se documenta en el manual como "respaldo automático diario a las 03:00"; Francisco lo programa en cron al desplegar. Ensayar una restauración una vez antes de entregar.
