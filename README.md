# SISGA — Sistema de Gestión de Activos y Almacén

Frontend del proyecto **SISGA** para la demo de la licitación SUSESO **1607-11-LE26** (gestión de activos fijos y almacén). Construido con **React 19 + Vite 8**, JavaScript y CSS Modules.

El estado actual es un frontend completo con servicios **simulados en `localStorage`** (archivos `*.mock.js`). La fase siguiente —servidor, base de datos y funcionalidades faltantes del checklist— está especificada en [`docs/`](docs/). La guía de trabajo obligatoria está en [`CLAUDE.md`](CLAUDE.md).

## Requisitos

- Node.js 20 o superior
- pnpm 11 (`corepack enable` lo activa usando el campo `packageManager` de `package.json`)

## Comandos

| Comando | Descripción |
|---|---|
| `pnpm install` | Instala las dependencias |
| `pnpm dev` | Servidor de desarrollo con recarga en caliente |
| `pnpm build` | Build de producción en `dist/` |
| `pnpm preview` | Sirve el build de producción localmente |
| `pnpm lint` | Revisa el código con ESLint |

## Estructura del proyecto

```
├── CLAUDE.md          # Guía maestra: contexto de la licitación, reglas y orden de lectura
├── docs/              # Especificación por tema (00 a 17): backend, API, seguridad, pruebas…
├── public/            # Estáticos (favicon, sprite de íconos)
├── src/
│   ├── components/    # Componentes transversales (common/ y layout/)
│   ├── features/      # Un dominio por carpeta: actas, activos, almacen, auth,
│   │                  # autoconsulta, dashboard, depreciacion, integraciones,
│   │                  # reportes, theme
│   │   └── <dominio>/ # {pages, components, hooks, mock, utils, constants}
│   ├── theme/         # Tokens de diseño, tipografías y estilos globales
│   └── utils/         # Utilidades compartidas
├── index.html
└── vite.config.js
```

Cada dominio en `src/features/` incluye un `*.mock.js` que actúa como única "base de datos" (sobre `localStorage`) y expone funciones `async` con el contrato que consumirá el backend real (`docs/03`).

## Documentación

El avance del proyecto se lleva en [`CHECKLIST.md`](CHECKLIST.md): qué está hecho y qué falta, por bloques de trabajo.

El punto de entrada es [`CLAUDE.md`](CLAUDE.md). Orden de lectura inicial:

1. [`docs/00-estado-actual-del-repo.md`](docs/00-estado-actual-del-repo.md) — qué existe y qué falta
2. [`docs/01-requisitos-trazables-y-brechas.md`](docs/01-requisitos-trazables-y-brechas.md) — requisitos RQ / AD / DEMO
3. [`docs/02-backend-y-base-de-datos.md`](docs/02-backend-y-base-de-datos.md) — servidor y schema
4. [`docs/03-contrato-api-y-reemplazo-de-mocks.md`](docs/03-contrato-api-y-reemplazo-de-mocks.md) — reemplazo de mocks

El resto de los documentos (04–17) se consultan según la tarea; la tabla de correspondencia está en `CLAUDE.md`.
