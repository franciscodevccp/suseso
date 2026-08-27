# 03 — Contrato de la API y reemplazo de los mocks

**Regla:** cada `*.mock.js` se reemplaza por un `features/<dominio>/services/<dominio>Service.js` que exporta **los mismos nombres de función, con los mismos parámetros y devolviendo la misma forma**. Después se cambian las importaciones listadas en `docs/00` (`../mock/xService.mock` → `../services/xService`). Vistas, hooks y componentes no se tocan salvo lo indicado.

## Cliente HTTP común — `src/services/http.js`
```js
export async function http(metodo, ruta, { cuerpo, form } = {}) {
  const r = await fetch(ruta, { method: metodo, credentials: 'include',
    headers: form ? undefined : { 'Content-Type': 'application/json' },
    body: form ? form : cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined })
  if (r.status === 401 && !ruta.startsWith('/api/auth/')) window.dispatchEvent(new Event('sesion-invalida'))
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new ErrorApi(e.codigo ?? 'ERROR', e.mensaje, r.status) }
  return r.status === 204 ? null : r.json()
}
```
Cada servicio envuelve `ErrorApi` en la clase que la UI ya espera (`AuthError`, `ActivoError`, `AlmacenError`, `ActaError`) conservando el `code`. El servidor responde errores siempre como `{ codigo, mensaje }`.

`AuthContext.jsx` escucha `sesion-invalida` y navega a `/sesion-expirada` (la página existe).

## Mapa función → endpoint

### Acceso (`authService`)
| Función (contrato actual) | Endpoint | Respuesta |
|---|---|---|
| `login({email,password})` | `POST /api/auth/login` | `{ usuario, requiereCambioClave }` (`token` deja de usarse; la cookie es la sesión). Errores: `CREDENCIALES_INVALIDAS`, `CUENTA_BLOQUEADA`, `CUENTA_INACTIVA` |
| `obtenerSesionActual()` | `GET /api/auth/sesion` | `{ usuario }` o `null` (200 con `null`, no 401) |
| `cerrarSesion()` | `POST /api/auth/salir` | 204 |
| `solicitarRecuperacion({email})` | `POST /api/auth/recuperar` | `{ mensaje, enlaceDemostracion }` — sin correo real, el enlace se muestra en pantalla (comportamiento actual) |
| `restablecerClave({token,nuevaClave})` | `POST /api/auth/restablecer` | 204. Errores: `TOKEN_INVALIDO`, `TOKEN_EXPIRADO`, `CLAVE_DEBIL` |
| `cambiarClaveObligatoria({usuarioId,nuevaClave})` | `POST /api/auth/cambiar-clave-obligatoria` | 204 (usuarioId se ignora: se usa la sesión) |
| `cambiarMiClave({usuarioId,claveActual,nuevaClave})` | `POST /api/auth/cambiar-mi-clave` | 204. Error `CLAVE_ACTUAL_INCORRECTA`; en cuentas demo → `CUENTA_DEMO` (`docs/14`) |
| `reiniciarDatosDemo()` | `POST /api/configuracion/reiniciar-demo` (solo Administrador) | 204; se elimina del login (`docs/13`) |

Reglas de clave: reutilizar `features/auth/utils/passwordRules.js` en el servidor (mover a `shared/passwordRules.js`). Bloqueo a los 5 intentos, igual que hoy. Usuario devuelto: `{ id, nombre, email, rol, estado, claveTemporal, fechaUltimoCambioClave }` con `rol` en texto visible: `Administrador | Gestor de Activos | Consulta | Funcionario`.

### Activos (`activosService`)
| Función | Endpoint |
|---|---|
| `obtenerCategorias()` / `obtenerUbicaciones()` | `GET /api/catalogos/categorias` · `GET /api/catalogos/ubicaciones` → `[{id,nombre}]` |
| `buscarActivos({texto,categoria,ubicacion,estado,responsable})` | `GET /api/activos?texto=&categoria=&ubicacion=&estado=&responsable=` → `Activo[]` (los mismos campos de hoy + `proximaMantencion, finGarantia, camposPersonalizados, ordenCompraMPCodigo, fotoPrincipalId`) |
| `obtenerActivoPorId(id)` | `GET /api/activos/:id` → `Activo` con `adjuntos: Adjunto[]` |
| `obtenerMovimientosPorActivo(id)` | `GET /api/activos/:id/movimientos` |
| `obtenerTodosLosMovimientos()` | `GET /api/activos/movimientos` (más reciente primero, máx. 5.000) |
| `crearActivo({datos,usuario})` | `POST /api/activos` (usuario sale de la sesión) → `Activo` |
| `actualizarActivo({id,datos,usuario})` | `PUT /api/activos/:id`. Error `ACTIVO_DADO_DE_BAJA` |
| `darDeBajaActivo({id,motivo,usuario})` | `POST /api/activos/:id/baja` |
| `trasladarActivo({id,ubicacion,responsable,motivo,usuario})` | `POST /api/activos/:id/traslado` |
| nuevo | `GET /api/activos/por-codigo/:codigo` → activo cuyo `folio`, `codigoBarras` o `rfid` coincide (escáner, `docs/08`) |

### Almacén (`almacenService`)
| Función | Endpoint |
|---|---|
| `obtenerCategorias/Ubicaciones/Unidades()` | `GET /api/almacen/catalogos` → `{categorias,ubicaciones,unidades}` (tres funciones, una llamada cacheada) |
| `obtenerItems()` | `GET /api/almacen/items` |
| `obtenerItemPorId(id)` | `GET /api/almacen/items/:id` |
| `obtenerMovimientosPorItem(id)` | `GET /api/almacen/items/:id/movimientos` |
| `obtenerTodosLosMovimientos()` | `GET /api/almacen/movimientos` |
| `crearItem({datos,usuario})` | `POST /api/almacen/items` (stock inicial > 0 genera movimiento `ingreso` "Stock inicial", como hoy) |
| `registrarMovimiento(itemId,{tipo,cantidad,motivo,usuario})` | `POST /api/almacen/items/:id/movimientos`. Error `STOCK_INSUFICIENTE` |

### Actas (`actasService`) — ver renombre en `docs/13`
| Función | Endpoint |
|---|---|
| `obtenerActas()` / `obtenerActaPorId(id)` | `GET /api/actas` · `GET /api/actas/:id` |
| `crearActa(datos)` | `POST /api/actas` |
| `firmarActa(id, firmante)` → renombrar a `cerrarActa(id)` | `POST /api/actas/:id/cerrar` → sello = SHA-256(folio + contenido + usuario + fecha) calculado en servidor. Error `ACTA_YA_CERRADA` |

La UI sigue leyendo `estadoFirma/firmante/fechaFirma/selloVerificacion`: el servicio mapea `estado→estadoFirma` (`cerrada`→`firmada` **solo hasta que se renombre la UI**, `docs/13`). Preferible renombrar de una vez.

### Vida útil (`vidaUtilService`)
`GET /api/configuracion/vida-util` → `[{categoria, vidaUtilAnios, vidaUtilAcelerada}]` · `PUT /api/configuracion/vida-util` (Administrador). `obtenerVidaUtilPorCategoria` se resuelve en el front desde la tabla completa.

### Panel de control (`dashboardService`) — `docs/07`
`GET /api/dashboard/resumen` → `{ totalActivos, valorTotalInventariado, valorLibroTotal, alertasVigentes, itemsBajoStockMinimo, solicitudesPendientes }` · `GET /api/dashboard/por-estado` → `[{estado, etiqueta, cantidad}]` · `GET /api/dashboard/por-categoria` → `[{categoria, cantidad, valor}]` · `GET /api/dashboard/actividad` → últimos 10 movimientos de activos + almacén unificados `{fecha, tipo, detalle, usuario, enlace}`.

### Integraciones (`integracionesService`) — `docs/10`
`obtenerExportacionSigfe()` → `GET /api/v1/contabilidad/activos` (misma forma `{encabezado, activos[]}`) · `simularRecepcionOrdenCompra(orden)` se reemplaza por `consultarOrdenCompra(codigo)` y `vincularOrdenCompra(activoId, codigo)`.

### Reportes (`reportesService`)
Los tres generadores pasan a `GET /api/reportes/inventario?categoria=&ubicacion=&estado=`, `GET /api/reportes/depreciacion?fechaCorte=`, `GET /api/reportes/movimientos?desde=&hasta=`, devolviendo `{columnas, filas}` exactamente como hoy; la exportación PDF/Excel/CSV **sigue en el navegador** con los utilitarios existentes. Nuevos: `GET /api/reportes/kardex?itemId=`, `GET /api/reportes/bajas`.

## Endpoints nuevos (sin mock previo)
| Módulo | Endpoints | Doc |
|---|---|---|
| Usuarios | `GET/POST /api/usuarios`, `PUT /api/usuarios/:id`, `POST /api/usuarios/:id/{activar,desactivar,restablecer-clave}` | `docs/04` |
| Auditoría | `GET /api/auditoria?usuario=&modulo=&desde=&hasta=&pagina=` | `docs/05` |
| Adjuntos | `POST /api/activos/:id/adjuntos` (multipart), `GET /api/adjuntos/:id`, `DELETE /api/adjuntos/:id`, `POST /api/activos/:id/foto-principal` | `docs/06` |
| Alertas | `GET /api/alertas`, `GET /api/alertas/resumen` | `docs/07` |
| Etiquetas | `GET /api/activos/:id/etiqueta.svg` (la hoja mural se genera en el navegador) | `docs/08` |
| Configuración | `GET/PUT /api/configuracion/campos-personalizados` | `docs/08` |
| Solicitudes | `GET/POST /api/solicitudes`, `POST /api/solicitudes/:id/{aprobar,rechazar,entregar}`, `GET /api/solicitudes/mias` | `docs/11` |
| Importador | `POST /api/importaciones/vista-general/previsualizar`, `POST /api/importaciones/vista-general/confirmar` | `docs/12` |
| Mercado Público | `GET /api/mercadopublico/ordenes/:codigo`, `POST /api/mercadopublico/ordenes/:codigo/sincronizar` | `docs/10` |
| API pública | `/api/v1/*` con `X-API-Key` | `docs/10` |

## Convenciones del servidor
- Orden de rutas en Express: declarar `/api/activos/movimientos` y `/api/activos/por-codigo/:codigo` **antes** de `/api/activos/:id`, o `:id` las capturará.
- Fechas en ISO 8601 (la UI ya las formatea). Decimales como número (no string).
- Listados grandes paginados solo en Auditoría y `/api/v1` (`?pagina=&porPagina=`); los listados del panel devuelven todo (volumen de demo ≤ 4.000 filas).
- Toda mutación: `autorizar(...)` → validar con zod → transacción Prisma → `auditar(...)` (`docs/05`) → responder la entidad completa.
