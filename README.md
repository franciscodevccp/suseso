# SISGA — Sistema Integral de Gestión de Activos Fijos y Almacén

Demostración completa para la licitación SUSESO **1607-11-LE26** (SaaS de gestión de activos fijos y almacén). Oferente: **Aeroconce Servicios SpA**.

> **Demo en línea: https://inventario.aeroconce.cl**
> Las cuatro cuentas de demostración están en la propia pantalla de acceso (un clic en cada tarjeta completa el formulario). Todos los datos son ficticios.

## Qué incluye

- **Activos fijos**: fichas completas con historial, traslados y bajas; búsqueda combinada (texto, categoría, ubicación, responsable, estado y campos personalizados); folios correlativos atómicos.
- **Etiquetas y escáner**: etiqueta Code128 imprimible a 50×25 mm, pliego 4×10 en A4, hoja mural por ubicación en PDF; campo de escaneo compatible con lectores USB de código de barras y RFID (demostrable tipeando).
- **Adjuntos georreferenciados**: fotos y documentos por activo con validación real por contenido; el GPS de las fotografías de teléfono se extrae automáticamente ("Ver en mapa").
- **Almacén**: kardex por ítem, stock mínimo, bloqueo de egresos sin stock.
- **Depreciación**: lineal mensual con valor residual $1 y tabla de vida útil SII editable; el mismo cálculo alimenta ficha, panel y reportes.
- **Actas** de recepción y entrega con sello de integridad verificable.
- **Alertas**: mantenciones, garantías, stock y solicitudes, con badge en vivo.
- **Reportes** de inventario, depreciación y movimientos en PDF, Excel y CSV.
- **Usuarios y roles** (Administrador, Gestor de Activos, Consulta, Funcionario) con clave temporal y cambio obligatorio; **auditoría** completa de acciones.
- **Portal de autoconsulta** para funcionarios: "Mis bienes" y solicitudes de insumos con aprobación y entrega que descuenta stock.
- **API pública** (`/api/v1`) documentada con OpenAPI 3.1 descargable y botón "Probar" en pantalla; exportación contable para SIGFE y webhook de confirmación.
- **Mercado Público**: consulta de órdenes de compra **reales** de mercadopublico.cl con caché local y vinculación a activos.
- **Importador Excel**: la planilla "Vista General" de 3.530 filas se previsualiza, valida e importa en menos de un segundo.

## Stack

React 19 + Vite (SPA, CSS Modules) · Express 5 · PostgreSQL 16 + Prisma · sesiones por cookie `httpOnly`. En producción **un solo proceso Node** sirve la API y el frontend compilado.

## Desarrollo local

Requisitos: Node.js 20.12+, pnpm 11, Docker (para la base de datos).

```bash
cp .env.ejemplo .env        # completar valores (ver comentarios del archivo)
docker compose up -d        # PostgreSQL de desarrollo (puerto 55432)
pnpm install                # postinstall genera el cliente de Prisma
pnpm db:migrate
pnpm db:seed                # datos de demostración deterministas (~529 activos)
pnpm dev                    # Vite (5173) + API (3001) con proxy /api
```

## Pruebas

| Comando | Qué corre |
|---|---|
| `pnpm test` | Unitarias (depreciación, importador, generadores, reglas de clave) |
| `pnpm test:api` | Suite de API contra el dev server: matriz de autorización, `/api/v1`, adjuntos, stock, folios concurrentes. **Escribe datos de prueba**: solo en desarrollo y `pnpm db:seed` después |
| `pnpm test:e2e` | Playwright en 4 perfiles (360 px, iPhone/WebKit, tablet, escritorio): responsive, flujos completos y la pasada principal de la demo |
| `pnpm lint` | ESLint |

## Producción

```bash
pnpm install --frozen-lockfile
pnpm db:deploy && pnpm db:seed
pnpm build
pnpm start                  # un proceso: API + dist/ con fallback SPA
```

El detalle del despliegue publicado (systemd, nginx + TLS, respaldo diario) está registrado en [`docs/17`](docs/17-decisiones-y-pendientes.md).

## Estructura del repositorio

```
├── server/            # API Express: rutas, dominio, middleware, Prisma (schema, migraciones, seed)
├── src/               # SPA React: components/ (común y layout) + features/ (un dominio por carpeta)
├── shared/            # Lógica compartida front/servidor (depreciación, reglas de clave, moneda)
├── tests/             # unitarias/ (vitest) · api/ (vitest contra el server) · e2e/ (Playwright)
├── scripts/           # respaldo, manual PDF, pantallazos, generadores de entregables
├── entregables/       # Manual del demo, tabla de verificación RQ, pantallazos, planilla de 3.530 filas
├── docs/              # Especificación por tema (00–17); CLAUDE.md es el punto de entrada
└── CHECKLIST.md       # Tracker del proyecto: bloques A1→D completos, pendientes vivos
```

## Documentación

- [`CHECKLIST.md`](CHECKLIST.md) — estado real del proyecto por bloques, con lo verificado y lo pendiente.
- [`entregables/tabla-verificacion-rq.md`](entregables/tabla-verificacion-rq.md) — cada requisito RQ/AD/DEMO del Anexo 2A con **cómo se verifica navegando la demo** y su ruta exacta.
- [`entregables/manual-demo-sisga.pdf`](entregables/manual-demo-sisga.pdf) — manual de uso del demo con la ruta de revisión de 15 minutos.
- [`docs/00–17`](docs/) — la especificación completa; [`CLAUDE.md`](CLAUDE.md) trae el orden de lectura y las reglas del proyecto.

---

*Entorno de demostración con datos 100 % ficticios: los nombres, correos y bienes no corresponden a personas ni registros reales.*
