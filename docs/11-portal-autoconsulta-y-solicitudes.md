# 11 — Portal de autoconsulta y solicitudes (AD-03)

## Lo que ya existe (se conserva)
`/autoconsulta`: buscar un bien por folio, código de barras o RFID; "Mis bienes" (activos cuyo `responsable` coincide con el nombre del usuario en sesión); `/autoconsulta/:id` ficha de solo lectura sin valor contable. El rol Funcionario aterriza aquí y no puede entrar al panel.

## Lo que falta: solicitudes (respuesta 9 del foro: 320 usuarios "para solicitar" + 4 operacionales)
Modelo `Solicitud` / `SolicitudItem` (`docs/02`). Flujo: el Funcionario crea una solicitud de insumos del almacén → Gestor/Administrador la aprueba o rechaza → al marcar **Entregada** se generan automáticamente los egresos de almacén (`MovimientoAlmacen` con `solicitudId`) **en la misma transacción**; si algún ítem no tiene stock suficiente, la entrega falla completa con `STOCK_INSUFICIENTE` y el detalle del ítem.

### Portal (rol Funcionario; también accesible para los demás roles)
- `/autoconsulta/solicitudes` — "Mis solicitudes": tabla folio, fecha, ítems, estado (`BadgeEstado`: pendiente/aprobada/rechazada/entregada), observación del resolutor.
- `/autoconsulta/solicitudes/nueva` — catálogo del almacén con stock visible (sin costos), cantidad por ítem, observación, "Enviar solicitud". Validación: cantidad ≥ 1; si supera el stock se avisa, no se bloquea (la aprobación decide).
- `/autoconsulta/solicitudes/:id` — detalle.
- Sidebar del Funcionario: Autoconsulta, Mis solicitudes, Nueva solicitud. Diseño simple, cero jerga, banner de demostración visible.

### Panel (Gestor/Administrador)
- `/solicitudes` — bandeja: pestañas Pendientes / Históricas; acciones Aprobar, Rechazar (observación obligatoria), Entregar (solo aprobadas). Entrada nueva en el Sidebar "Solicitudes" con badge de pendientes.
- Ficha del ítem de almacén: pestaña "Solicitudes" con las que lo incluyen.

### Endpoints
`POST /api/solicitudes` `{ items:[{itemId,cantidad}], observacion }` → `Solicitud` · `GET /api/solicitudes/mias` · `GET /api/solicitudes?estado=` (panel) · `GET /api/solicitudes/:id` (el solicitante solo ve las propias: filtro en servidor por `solicitanteId`, nunca por parámetro) · `POST /api/solicitudes/:id/aprobar|rechazar|entregar`. Auditoría en cada paso.

## Pantallazos para el Anexo 2A (sustento exigido: "describir funcionalidades + adjuntar pantallazos")
Exportar a `entregables/pantallazos-portal/` en 1366×768 y en 390×844 (móvil): login con las tarjetas de demostración, "Mis bienes", ficha de un bien, "Nueva solicitud", "Mis solicitudes" con distintos estados, y la bandeja del panel con la misma solicitud aprobada. Archivos numerados en el orden del flujo. Van al Anexo 2A y al manual.
