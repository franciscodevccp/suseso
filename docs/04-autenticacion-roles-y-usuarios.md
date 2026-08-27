# 04 — Autenticación, roles y módulo Usuarios (RQ-06, RQ-07, DEMO-07)

## Roles (4) — nombres visibles exactamente así
| Rol (UI) | Enum | Qué puede |
|---|---|---|
| Administrador | ADMINISTRADOR | Todo, incluido Usuarios, Configuración, reiniciar demo |
| Gestor de Activos | GESTOR | Crear/editar/trasladar/dar de baja activos, almacén, actas, solicitudes, importador, adjuntos, etiquetas |
| Consulta | CONSULTA | Panel completo en **solo lectura**: listados, fichas, reportes, auditoría, alertas. Ninguna mutación |
| Funcionario | FUNCIONARIO | Solo el portal de autoconsulta y solicitudes (`docs/11`). No entra al panel ni por URL |

`permisosActivos.js` ya define `ROLES_CON_GESTION = ['Administrador', 'Gestor de Activos']`: se conserva. `permisosAlmacen.js` ya usa la misma lista (el rol `Bodeguero` fue reemplazado por `Gestor de Activos` el 2026-08-26, D-11, también en `AltaItemPage.jsx` y `TablaVidaUtil.jsx`). Los cuatro archivos `permisos*.js` (activos, almacén, actas, vida útil) pasan a delegar en un único `src/features/auth/utils/permisos.js`:
```js
export const ROLES = ['Administrador', 'Gestor de Activos', 'Consulta', 'Funcionario']
export const puedeGestionar = (u) => ['Administrador','Gestor de Activos'].includes(u?.rol)
export const esAdministrador = (u) => u?.rol === 'Administrador'
export const esFuncionario  = (u) => u?.rol === 'Funcionario'
export const puedeVerPanel   = (u) => u && !esFuncionario(u)
```
Cambios en la UI: `RutaAdministrativa` usa `puedeVerPanel`; botones de acción (Nuevo, Editar, Trasladar, Dar de baja, Ingreso/Egreso, Crear acta, Cerrar acta, Aprobar) se muestran solo si `puedeGestionar`; `rutaInicio.js` → Funcionario a `/autoconsulta`, el resto a `/inicio`. El Sidebar ya oculta ítems por rol.

## Matriz de permisos (se aplica en el servidor con `autorizar(...roles)`)
| Recurso | Administrador | Gestor | Consulta | Funcionario |
|---|---|---|---|---|
| `GET` panel (activos, almacén, actas, reportes, auditoría, alertas, dashboard) | ✔ | ✔ | ✔ | ✖ |
| Mutaciones de activos/almacén/actas/adjuntos/etiquetas/importador | ✔ | ✔ | ✖ | ✖ |
| Solicitudes: aprobar/rechazar/entregar | ✔ | ✔ | ✖ | ✖ |
| Solicitudes: crear y ver las propias; autoconsulta | ✔ | ✔ | ✔ | ✔ |
| Configuración: **ver** (vida útil, campos personalizados, perfiles y permisos) | ✔ | ✔ | ✔ | ✖ |
| Configuración: **editar** vida útil y campos personalizados; reiniciar demo | ✔ | ✖ | ✖ | ✖ |
| Configuración → Importar planilla | ✔ | ✔ | ✖ | ✖ |
| Usuarios | ✔ | ✖ | ✖ | ✖ |
| `/api/v1` | por API key, no por rol | | | |

## Sesión
- `express-session` con `connect-pg-simple`; cookie `sisga.sid`, `httpOnly`, `sameSite: 'lax'`, `secure` en producción (`app.set('trust proxy', 1)`), TTL absoluto 8 h y `rolling` con inactividad de 30 min (la UI ya cierra a los 20 min: el servidor es el respaldo).
- Login: 5 intentos fallidos → `estado = bloqueado` (igual que hoy). Rate limit 10 intentos/15 min por IP (`docs/14`).
- Login y cierre de sesión se auditan (`docs/05`).

## Cuentas de demostración (seed, `docs/12`)
`admin@demo.cl` (Administrador) · `gestor@demo.cl` (Gestor de Activos) · `consulta@demo.cl` (Consulta) · `funcionario@demo.cl` (Funcionario). Clave única `CLAVE_DEMO`. Todas con `esCuentaDemo = true`: no pueden cambiar su clave ni correo, no se pueden desactivar ni eliminar (`docs/14`). Se muestran en el login como tarjetas "Cuentas de demostración" (`docs/13`).

## Módulo Usuarios — `/usuarios` (hoy `ModuloEnConstruccion`)
Solo Administrador. Pantallas: listado (nombre, correo, rol, estado, último cambio de clave, acciones) · crear (nombre, correo, rol; la clave temporal se genera y se muestra una sola vez; `claveTemporal = true` fuerza el cambio en el primer ingreso, flujo que la UI ya tiene) · editar (nombre, rol) · activar/desactivar · restablecer clave (nueva temporal) · desbloquear. Reutilizar `TextField`, `SelectField`, `Modal`, `BadgeEstado`, `Button`. Todo auditado.

Endpoints: `GET /api/usuarios` · `POST /api/usuarios` → `{usuario, claveTemporal}` · `PUT /api/usuarios/:id` · `POST /api/usuarios/:id/activar|desactivar|desbloquear|restablecer-clave`. Errores: `CORREO_EN_USO`, `CUENTA_DEMO` (operación no permitida sobre cuentas demo), `ULTIMO_ADMINISTRADOR` (no se puede desactivar al único Administrador activo).

"Perfiles parametrizables" (RQ-06) se sustenta con la matriz anterior visible en el manual y con una pantalla de solo lectura **Configuración → Perfiles y permisos** que la muestra (tabla estática generada desde `permisos.js`). No se construye un editor de permisos.
