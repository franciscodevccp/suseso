# 15 — Pruebas (mínimo exigible antes de entregar)

## Unitarias (vitest) — `shared/` y `server/src/dominio/`
- **depreciación** (`docs/09`): mes de compra · 18 meses · vida cumplida → $1 exacto · fecha de corte anterior a la alta → 0 · vida acelerada · decimales · tabla anual consistente con el acumulado mensual.
- **folios**: 20 creaciones en paralelo (`Promise.all`) → 20 folios distintos y consecutivos.
- **kardex**: egreso mayor al stock → `STOCK_INSUFICIENTE`; secuencia mixta de ingresos/egresos deja `stockResultante` correcto.
- **alertas**: cada regla de `docs/07` con fechas en el borde (hoy + 30, hoy + 31, hoy − 1).
- **importador**: planilla válida · encabezados distintos con mapeo manual · duplicados internos y contra BD · celdas corruptas · 3.530 filas < 60 s.
- **passwordRules** compartidas: mismos resultados en front y servidor.

## API (supertest, contra una BD de prueba con seed reducido)
- Login con cada rol; `Consulta` recibe 403 en **todas** las mutaciones; `Funcionario` recibe 403 en todas las rutas del panel; sin sesión → 401.
- Cuentas demo: cambiar clave → `CUENTA_DEMO`; desactivar → `CUENTA_DEMO`.
- `/api/v1`: sin clave 401; con clave 200 y paginación; webhook 202.
- Adjuntos: tipo no permitido → `TIPO_NO_PERMITIDO`; descarga sin sesión → 401; ruta manipulada → 404.
- Solicitudes: entregar con stock insuficiente falla completa y no descuenta nada.
- Auditoría: cada mutación deja exactamente una fila.

## E2E (Playwright, contra `pnpm dev` con seed completo)
1. Login con las 4 cuentas → cada una ve solo lo que permite la matriz (`docs/04`).
2. Crear activo → folio correlativo → subir foto con "Usar mi ubicación" → pestaña Adjuntos muestra coordenadas → etiqueta → vista de impresión abre.
3. Trasladar → Historial y Auditoría lo registran.
4. Ingreso y egreso de almacén → kardex cuadra → egreso sin stock bloqueado con mensaje claro.
5. Funcionario crea solicitud → Gestor aprueba y entrega → stock descuenta → Funcionario ve "Entregada".
6. Reporte de depreciación → Excel, PDF y CSV descargan.
7. Importar la planilla de 3.530 filas → resumen correcto → activos consultables.
8. Integraciones: "Probar" un endpoint responde 200; descargar `openapi.yaml`; consultar una OC real y vincularla.
9. Búsqueda combinada (ubicación + estado + responsable + texto).
10. Alertas: el badge coincide con el listado; Usuarios: crear usuario con clave temporal y entrar con él → fuerza cambio de clave.

## Checklist manual antes de entregar
Chrome + Edge + Firefox (RQ-02) · móvil real a 360 px en el portal · las 4 cuentas desde ventana de incógnito · `/api/salud` responde · banner visible en todas las pantallas · `grep -rni "firma\|mock\|suseso.gob.cl" src` devuelve cero fuera de comentarios históricos · ensayo cronometrado de la pasada de 15 minutos por los 7 contenidos DEMO (`docs/16`).
