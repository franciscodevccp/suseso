# Tabla de verificación — SISGA (licitación 1607-11-LE26)

Cada requisito del Anexo 2A, verificado **navegando la demo**. La columna
"Cómo se verificó" indica la acción concreta y la ruta exacta dentro del
sistema; alimenta la columna "hoja" de la propuesta técnica y la ruta
sugerida de revisión del manual. Credenciales: las 4 tarjetas de la
pantalla de inicio de sesión (clave única de demostración).

Verificado el 27-08-2026 sobre la demo con su seed completo (529 activos,
16 usuarios, 30 ítems de almacén). Respaldado además por la suite
automatizada: 122 pruebas E2E sobre 4 perfiles de dispositivo, 19 pruebas
de API y 24 unitarias, todas en verde.

## RQ — Checklist del Anexo 2A (27/27)

| Cód. | Requisito | Cómo se verificó | Ruta |
|---|---|---|---|
| RQ-01 | 100 % web, sin instalaciones | Toda la demo corre en el navegador contra la URL publicada; no se instala nada. | `/login` |
| RQ-02 | Chrome, Edge, Firefox | Navegación completa en los tres navegadores; la suite automatizada además corre en motor Chromium y WebKit real. | Toda la demo |
| RQ-03 | Arquitectura web escalable | SPA React + API Express + PostgreSQL en capas; un proceso Node sirve API y front (detalle en la propuesta técnica). | — |
| RQ-04 | HTTPS/TLS | La demo publicada opera bajo HTTPS (certificado del dominio); cookies con `secure` detrás del proxy. | URL de la demo |
| RQ-05 | Responsive PC/tablet/móvil | Cada módulo revisado a 360 px, tablet y escritorio; las tablas se reordenan como tarjetas en móvil. Suite responsive automatizada en 4 perfiles. | Toda la demo |
| RQ-06 | Autenticación y perfiles parametrizables | Inicio de sesión con las 4 cuentas; creación de usuarios con clave temporal y cambio obligatorio al primer ingreso; bloqueo tras 5 intentos fallidos; recuperación de clave. | `/login`, `/usuarios` |
| RQ-07 | Permisos por roles y niveles | 4 roles (Administrador, Gestor de Activos, Consulta, Funcionario) aplicados en el servidor: Consulta recibe rechazo en toda mutación; Funcionario solo accede al portal. Matriz visible en pantalla. | `/configuracion/perfiles` |
| RQ-08 | Bitácora / auditoría | Toda acción queda registrada (quién, qué, cuándo, sobre qué folio); pantalla con filtros por usuario/módulo/acción/folio/fechas y exportación PDF/Excel/CSV. | `/auditoria` |
| RQ-09 | Multiusuario concurrente | Sesiones simultáneas de las 4 cuentas contra la misma base PostgreSQL; folios correlativos atómicos verificados con 20 creaciones en paralelo (prueba de API). | Toda la demo |
| RQ-10 | Disponibilidad ≥ 99 % | Demo en línea con monitoreo directo sobre la URL; compromiso de 99,5 % en el Anexo 2B. | URL de la demo |
| RQ-11 | Respaldo automático diario | `pg_dump` diario programado + copia de adjuntos, con rotación; restauración ensayada (procedimiento en el manual). | Manual §Respaldo |
| RQ-12 | Adjuntar fotos, PDF, OC, garantías | Subida de fotos y documentos en la ficha del activo (validación real por contenido, no por extensión); foto principal; descarga autenticada. | `/activos-fijos/:id` §Adjuntos |
| RQ-13 | Búsqueda avanzada | Búsqueda combinada por texto (folio, nombre, descripción, código, serie) + categoría + ubicación + responsable + estado. | `/activos-fijos` |
| RQ-14 | Folios automáticos correlativos | Al crear un activo, ítem, acta o solicitud el folio sale de una secuencia atómica (AF/BOD/ACT/SOL-AAAA-NNNN). | Alta en cualquier módulo |
| RQ-15 | Export PDF, Excel y CSV | Botones de descarga en Reportes, Auditoría y Alertas; los tres formatos descargan. | `/reportes`, `/auditoria`, `/alertas` |
| RQ-16 | Panel de control con indicadores | 6 indicadores (total, valor inventariado, valor libro, alertas, stock bajo mínimo, solicitudes pendientes) + gráficos por estado y categoría + actividad reciente. | `/inicio` |
| RQ-17 | Alertas de mantenciones/vencimientos | Alertas de mantención próxima y atrasada, garantía por vencer, stock bajo mínimo, sin stock y solicitudes pendientes; badge en el menú lateral. | `/alertas` |
| RQ-18 | Historial y trazabilidad por activo | La ficha muestra alta, ediciones, traslados y baja con usuario y fecha; el traslado registra origen y destino. | `/activos-fijos/:id` §Historial |
| RQ-19 | Impresión de etiquetas y hojas murales | Etiqueta individual Code128 a 50×25 mm desde la ficha; pliego 4×10 en A4 desde la selección del listado; hoja mural en PDF al filtrar por ubicación. | `/activos-fijos/:id/etiqueta`, `/activos-fijos` |
| RQ-20 | Lectores de código de barras y RFID | Campo "Escanear" con autofoco en Activos y Almacén: un lector USB escribe el código y el Enter abre la ficha (demostrable tipeando); código no registrado ofrece alta precargada. | `/activos-fijos`, `/almacen` |
| RQ-21 | Campos personalizados | Definición en Configuración (texto, número, fecha, lista; obligatorio; orden); los campos aparecen en el formulario y la ficha, y entran en la búsqueda. | `/configuracion/campos-personalizados` |
| RQ-22 | Imágenes georreferenciadas desde móviles | Al subir una foto con GPS (EXIF de un teléfono), las coordenadas se extraen automáticamente y "Ver en mapa" las abre. | `/activos-fijos/:id` §Adjuntos |
| RQ-23 | BD relacionales | PostgreSQL 16 con esquema relacional migrado (Prisma). | — |
| RQ-24 | Escalabilidad de usuarios/activos | Demo operando con 529 activos y 16 usuarios; importación en vivo de una planilla de 3.530 filas en menos de un segundo. | `/configuracion/importar` |
| RQ-25 | Actualizaciones evolutivas | Compromiso contractual (propuesta técnica). | — |
| RQ-26 | Soporte remoto semanal | Compromiso contractual + canal de soporte en el manual. | Manual §Soporte |
| RQ-27 | Incluye demo y manual | Esta demo en línea + el manual PDF adjunto a la oferta. | — |

## AD — Los 3 elementos adicionales declarados

| Cód. | Elemento | Cómo se verificó | Ruta |
|---|---|---|---|
| AD-01 | API/Web service contable (SIGFE) con especificación adjunta | API pública `/api/v1` operativa en la propia demo: exportación contable valorizada, asientos de depreciación mensual y webhook de confirmación, autenticados por llave. Cada endpoint tiene botón "Probar" que ejecuta la llamada real, y la especificación OpenAPI 3.1 se descarga desde la pantalla. | `/integraciones`, `/integraciones/sigfe` |
| AD-02 | API/Web service con mercadopublico.cl | Consulta de órdenes de compra REALES de la API pública de Mercado Público por código, con caché local, sincronización en vivo y vinculación a un activo (visible en su ficha). | `/integraciones/mercadopublico` |
| AD-03 | Portal de autoconsulta sin perfil administrador | El rol Funcionario aterriza en su portal: busca bienes por código, ve "Mis bienes", crea solicitudes de insumos y sigue sus estados; el panel las aprueba/rechaza/entrega con descuento automático de stock. Pantallazos adjuntos en `pantallazos-portal/`. | `/autoconsulta`, `/autoconsulta/solicitudes` |

## DEMO — Contenidos mínimos (respuesta 15 del foro)

| Cód. | Contenido | Cómo se verificó |
|---|---|---|
| DEMO-01 | Gestión de activos fijos y almacenes | Módulos Activos fijos y Almacén completos con alta, edición y fichas. |
| DEMO-02 | Ingreso y egreso de inventario | Kardex por ítem; el egreso mayor al stock queda bloqueado con mensaje claro. |
| DEMO-03 | Trazabilidad de movimientos | Historial por activo + kardex por ítem + bitácora transversal. |
| DEMO-04 | Altas, bajas y traslados | Flujo completo con motivo de baja y traslado con origen/destino. |
| DEMO-05 | Cálculo de depreciación | Lineal mensual con valor residual $1 y tabla de vida útil SII editable; ficha, panel y reportes usan el mismo cálculo. |
| DEMO-06 | Reportabilidad y exportación | Reportes de inventario, depreciación y movimientos con PDF/Excel/CSV. |
| DEMO-07 | Administración de usuarios y roles | Crear/editar/desactivar usuarios, clave temporal con cambio obligatorio, desbloqueo, matriz de permisos visible. |
