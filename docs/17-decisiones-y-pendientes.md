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
- **T-01** Nombre definitivo del producto: `SISGA` (código y título actuales) o `ActivosCloud` (documentación previa). Afecta `src/config/producto.js`, `index.html`, manual, `openapi.yaml` y la propuesta.
- **T-02** Entregar `MP_API_TICKET` (ticket de la API pública de Mercado Público) y 3–5 códigos de OC públicas para el seed.
- **T-03** Definir `CLAVE_DEMO` y `API_DEMO_KEY` (van al manual y a la oferta; se rotan tras la adjudicación).
- **T-04** Confirmar el compromiso de disponibilidad del Anexo 2B (99,5 %) para que el manual y `/api/salud` hablen el mismo idioma.
- **T-05** Cuentas contables por categoría para la exportación SIGFE (`docs/10`): si no hay plan de cuentas de referencia, usar el genérico propuesto y rotularlo como referencial.

## Registro de novedades durante la construcción
(Anotar aquí toda idea fuera de alcance, bug conocido aceptado o desviación del plan, con fecha y motivo. Nada de decisiones silenciosas.)

- **2026-08-26** — Eliminado del login el botón "Ingresar con Clave Única" (estaba deshabilitado con chip "Próximamente"). No figuraba en ningún documento ni en el rediseño del login de `docs/13`, y sugería una integración no comprometida en la oferta.
