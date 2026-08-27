# SISGA — Guía maestra para Claude Code (cierre de brechas para la demo SUSESO 1607-11-LE26)

Este repositorio es el proyecto `sisga` construido por Javiera (React 19 + Vite 8, JavaScript, CSS Modules): un frontend completo con servicios **simulados en `localStorage`**. Compila y pasa lint. El trabajo que queda es **darle servidor, base de datos y las funcionalidades del checklist que faltan**, sin rehacer la interfaz.

Lee este archivo completo. Después, el documento que corresponda a la tarea. No improvises alcance: cada pantalla y cada endpoint existen para hacer verificable una fila del checklist de la licitación.

## Contexto en 6 líneas
- Licitación SUSESO **1607-11-LE26**: SaaS de gestión de activos fijos y almacén, 24 meses, tope $20 M c/IVA, operativo el 1-ene-2027. Oferente: Aeroconce Servicios SpA.
- **La demo es el instrumento de puntaje.** El criterio B.1 (20 puntos finales) es binario: 27/27 requisitos del Anexo 2A + 3 elementos adicionales verificables = 100; con 1–2 adicionales = 60; con menos de 27/27 la oferta es **inadmisible**.
- La comisión es del Depto. de Administración y Finanzas de SUSESO: perfil financiero, no técnico. Redactar y diseñar para ese lector.
- La demo debe estar **en línea, con navegación real, credenciales adjuntas en la oferta y disponibilidad continua** hasta la adjudicación. Las credenciales serán públicas: competidores entrarán.
- El despliegue lo hace Francisco. Entregar un proyecto que corra con **un solo proceso Node** que sirva la API y el `dist/` del frontend (`docs/02`).
- Todo en español, cero jerga técnica visible en la UI. FEA y app móvil **no se mencionan en ninguna parte** (`docs/13`).

## Orden de lectura inicial (obligatorio)
1. `docs/00-estado-actual-del-repo.md` — qué existe, dónde está y qué está roto o vacío.
2. `docs/01-requisitos-trazables-y-brechas.md` — los códigos RQ / AD / DEMO con su estado real en este repo.
3. `docs/02-backend-y-base-de-datos.md` — el servidor que hay que construir y el schema Prisma.
4. `docs/03-contrato-api-y-reemplazo-de-mocks.md` — cómo se reemplazan los 8 servicios mock sin tocar las vistas.

## Consulta por tarea
| Si vas a trabajar en… | Lee antes |
|---|---|
| Servidor, Prisma, migraciones, `/api/salud` | `docs/02` |
| Reemplazar un `*.mock.js` por llamadas reales | `docs/03` |
| Login, sesiones, roles, módulo Usuarios (RQ-06/07, DEMO-07) | `docs/04` |
| Bitácora / auditoría (RQ-08) | `docs/05` |
| Adjuntos y fotos georreferenciadas (RQ-12, RQ-22) | `docs/06` |
| Alertas y datos del panel de control (RQ-16, RQ-17) | `docs/07` |
| Etiquetas, escáner, campos personalizados (RQ-19/20/21) | `docs/08` |
| Depreciación y vida útil (DEMO-05) | `docs/09` |
| API pública, OpenAPI, Mercado Público (AD-01, AD-02) | `docs/10` |
| Portal de autoconsulta y solicitudes (AD-03) | `docs/11` |
| Importador Excel y seed (RQ-24, criterio B.3) | `docs/12` |
| Banner, textos del login, renombrar Actas, nombre del producto | `docs/13` |
| Cualquier cosa que toque autenticación, archivos o la API | `docs/14` |
| Tests | `docs/15` |
| Qué entregar y qué recortar si no alcanza | `docs/16` |
| Decisiones tomadas y dudas abiertas | `docs/17` |

## Reglas de oro
1. **Nada se construye si no tiene código RQ/AD/DEMO** (`docs/01`). Idea nueva → `docs/17`, y se sigue.
2. **No se rehace la UI.** Vistas, hooks, componentes y CSS de Javiera se conservan; se cambian solo cuando un requisito lo exige (`docs/03`, `docs/13`).
3. **Los mocks definen el contrato.** El servidor devuelve exactamente las mismas formas de datos que hoy devuelven los `*.mock.js`.
4. **Autorización en el servidor, siempre.** La UI esconde; el servidor niega (`docs/14`).
5. **Commits en español con el código del requisito:** `feat(alertas): listado y badge (RQ-17)`.
6. **Datos 100 % ficticios**: nombres inventados, dominio `@demo.cl`, sin RUT válidos, sin funcionarios reales de SUSESO.
7. **Banner de demostración visible en todas las pantallas** desde el primer commit de esta fase.
8. Si el tiempo aprieta se recorta según `docs/16`, no según el ánimo.
