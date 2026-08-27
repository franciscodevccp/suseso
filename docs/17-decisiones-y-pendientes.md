# 17 — Decisiones tomadas y pendientes

## Decisiones (no reabrir sin motivo escrito aquí)
- **D-01 Stack:** se conserva la SPA Vite/React de Javiera y se agrega `server/` en Express + Prisma + PostgreSQL. No se migra a Next.js ni se reutiliza el fork de confirma-citas: la UI ya está hecha y el riesgo es el tiempo.
- **D-02 Roles:** Administrador, Gestor de Activos, Consulta, Funcionario. "Gestor de Activos" porque `permisosActivos.js` ya lo nombra.
- **D-03 FEA fuera:** "Actas y firma" pasa a "Actas de asignación" con sello de integridad. No se menciona firma electrónica avanzada, Ley 19.799, ni app móvil en ninguna pantalla, texto, manual o anexo.
- **D-04 Solo 3 adicionales:** AD-01 API contable/SIGFE, AD-02 Mercado Público, AD-03 portal de autoconsulta (con solicitudes).
- **D-05 Un proceso:** `server/index.js` sirve la API y el `dist/`; Francisco despliega, pone dominio, TLS, monitoreo y cron de respaldo.
- **D-06 Depreciación:** lineal mensual, residual $1, tabla SII referencial y editable.
- **D-07 Persistencia:** cero `localStorage` para datos de negocio; sesión por cookie.
- **D-08 Mocks:** siguen en el repo hasta que cada servicio real esté conectado y probado; después se eliminan (no se dejan rutas muertas).
- **D-09 Datos:** ficticios, dominio `@demo.cl`, sin RUT válidos ni personas reales.
- **D-10 Configuración:** la ven todos los roles del panel (Administrador, Gestor, Consulta); editan vida útil y campos personalizados y reinician la demo solo Administrador; Importar planilla la operan Administrador y Gestor. Es lo que el Sidebar ya hace.
- **D-11 Rol `Bodeguero`:** no existe; donde aparezca se reemplaza por `Gestor de Activos`.
- **D-12 No se toca por estética:** nombres de claves de `localStorage` (desaparecen con D-07), `auth/constants/mensajes.js`, la ubicación de `ProtectedRoute.jsx` y `RutaAdministrativa.jsx`. Cero puntos, riesgo de churn. Los comentarios desactualizados de los mocks se corrigen al reemplazar cada mock.

## Pendientes de Francisco
- **T-01** ~~Nombre definitivo del producto~~ **Resuelto el 2026-08-27: SISGA** (decisión de Francisco). Aplicado en `src/config/producto.js`, `index.html` y el pie del login; falta usarlo en manual y `openapi.yaml` cuando existan (C1/D).
- **T-02** ~~Entregar `MP_API_TICKET`~~ **Ticket entregado y validado contra la API el 2026-08-26** (listado por fecha y detalle por código funcionan; el valor vive solo en `.env`, nunca en el repo). Pendiente: elegir 3–5 códigos de OC públicas de mobiliario/computación para el seed — se pueden obtener del propio listado por fecha al construir C1.
- **T-03** Definir `CLAVE_DEMO` y `API_DEMO_KEY` (van al manual y a la oferta; se rotan tras la adjudicación).
- **T-04** Confirmar el compromiso de disponibilidad del Anexo 2B (99,5 %) para que el manual y `/api/salud` hablen el mismo idioma.
- **T-05** Cuentas contables por categoría para la exportación SIGFE (`docs/10`): si no hay plan de cuentas de referencia, usar el genérico propuesto y rotularlo como referencial.

## Registro de novedades durante la construcción
(Anotar aquí toda idea fuera de alcance, bug conocido aceptado o desviación del plan, con fecha y motivo. Nada de decisiones silenciosas.)

- **2026-08-26** — Eliminado del login el botón "Ingresar con Clave Única" (estaba deshabilitado con chip "Próximamente"). No figuraba en ningún documento ni en el rediseño del login de `docs/13`, y sugería una integración no comprometida en la oferta.
- **2026-08-26** — Se descarta el endpoint `GET /api/salud` (decisión de Francisco): front y API corren en un solo proceso, así que el monitoreo de disponibilidad (RQ-10) se hace directo sobre la URL del sitio. Ajustados `docs/01`, `docs/02` y `docs/16`.
- **2026-08-27** — En auth, donde `docs/03` difería del mock, ganó el mock (regla 3): recuperación responde `{ ok, tokenDemo }` (no `{ mensaje, enlaceDemostracion }`), el código de clave débil es `CLAVE_NO_CUMPLE_REQUISITOS` (no `CLAVE_DEBIL`), y los cambios de clave devuelven `{ usuario }` (no 204). Además existen `CLAVE_IGUAL_A_ACTUAL` y `USUARIO_NO_ENCONTRADO`, que docs/03 omitía.
- **2026-08-27** — Listas desplegables con diseño propio (decisión de Francisco): el popup del `<select>` nativo no es estilizable de forma consistente en los tres navegadores exigidos (RQ-02). Nuevo `components/common/Desplegable` (patrón combobox/listbox de WAI-ARIA, teclado completo) usado por `SelectField` y los filtros; contrato de eventos idéntico al `<select>`, ningún consumidor cambió su lógica. Las listas de hasta ~10 opciones se muestran completas sin scroll; las largas usan scrollbar delgada del tema, y las scrollbars de toda la app quedaron delgadas y tematizadas (global.css).
- **2026-08-27** — Tablas responsivas (RQ-05, decisión de Francisco): bajo 640 px cada fila de los listados (Activos, Almacén, Actas, Mis bienes) se convierte en tarjeta apilada con la etiqueta de columna por celda (`data-etiqueta`, solo CSS); desaparece el scroll horizontal en móvil. El botón de acción de los encabezados pasa a ancho completo bajo 720 px.
- **2026-08-27** — Shell de altura fija (decisión de Francisco): encabezado y sidebar quedan quietos y solo `<main>` tiene scroll, con vuelta arriba al cambiar de vista. Se adelantó parte de `docs/15`: suite Playwright de responsive (`tests/e2e/`) con matriz 360 px / iPhone-WebKit / tablet / escritorio, 98 pruebas en verde; el login de las pruebas se hace por API una sola vez por rol para no gatillar el rate limit.
- **2026-08-27** — Selector de fecha con calendario propio (`components/common/CampoFecha`, decisión de Francisco): el popup del `<input type="date">` nativo no es estilizable, igual que el del `<select>`. Formato visible dd-mm-aaaa, semana lunes-a-domingo con abreviaturas chilenas (Lu Ma Mi Ju Vi Sá Do), alineación automática contra el borde de la ventana (también aplicada al Desplegable). Lo usan Auditoría y el reporte de Movimientos; B2 lo reutiliza en mantención/garantía.
- **2026-08-27** — La columna IP no se muestra en la pantalla de Auditoría ni en sus exportaciones (decisión de Francisco); la bitácora sí la sigue registrando en la BD (docs/05) por trazabilidad.
