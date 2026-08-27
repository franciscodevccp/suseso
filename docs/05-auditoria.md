# 05 — Bitácora / auditoría (RQ-08)

## Qué se registra (siempre, en la misma transacción que la acción)
| Módulo | Acciones |
|---|---|
| acceso | `ingreso`, `ingreso_fallido`, `cuenta_bloqueada`, `cierre_sesion`, `cambio_clave`, `recuperacion_solicitada` |
| activos | `alta`, `edicion`, `traslado`, `baja`, `adjunto_agregado`, `adjunto_eliminado`, `etiqueta_generada`, `oc_vinculada`, `importacion` |
| almacen | `alta_item`, `ingreso`, `egreso` |
| actas | `creacion`, `cierre` |
| solicitudes | `creacion`, `aprobacion`, `rechazo`, `entrega` |
| usuarios | `creacion`, `edicion`, `activacion`, `desactivacion`, `desbloqueo`, `restablecimiento_clave` |
| configuracion | `vida_util_actualizada`, `campos_personalizados_actualizados`, `demo_reiniciada` |
| api | `consulta_v1` (una fila por request con API key, sin cuerpo) |

Helper `auditar(req, { modulo, accion, entidad, entidadId, entidadFolio, detalle })` en `server/src/middleware/auditoria.js`; toma `usuarioId/usuarioNombre` de la sesión (o `"API"`/`"Sistema"`) e `ip` de `req.ip`. **Nunca** guarda contraseñas, tokens ni cuerpos completos; `detalle` es una frase legible: `Traslado del activo AF-2026-0142 de "Piso 3" a "Bodega Central"`.

## Pantalla `/auditoria` (Administrador, Gestor, Consulta)
- Nueva entrada en el Sidebar "Auditoría" (icono de lista), oculta para Funcionario.
- Filtros: usuario (select), módulo (select), acción (texto), desde/hasta (fechas), folio. Tabla paginada (50 por página): fecha y hora, usuario, módulo, acción, entidad/folio (enlace a la ficha), detalle, IP.
- Exportar Excel/CSV/PDF con `reportes/utils/exportar*.js` sobre el filtro actual (máx. 5.000 filas).
- Endpoint `GET /api/auditoria?usuario=&modulo=&accion=&folio=&desde=&hasta=&pagina=&porPagina=` → `{ filas, total, pagina, porPagina }`.

## Ficha del activo
Pestaña **Historial** sigue mostrando `MovimientoActivo` (trazabilidad de negocio, RQ-18). Debajo, enlace "Ver en auditoría" que abre `/auditoria?folio=AF-…`. Son dos cosas distintas y así se explica en el manual: el historial es lo que le pasó al bien; la auditoría es quién hizo qué en el sistema.
