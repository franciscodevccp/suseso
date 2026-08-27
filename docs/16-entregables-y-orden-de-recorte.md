# 16 — Entregables, Definition of Done y orden de recorte

## Definition of Done — la demo está terminada cuando:
- [ ] `pnpm install --frozen-lockfile && pnpm db:migrate && pnpm db:seed && pnpm build && pnpm start` levanta API + frontend en un solo proceso. (Dominio, TLS y monitoreo directo sobre la URL del sitio los pone Francisco; el VPS necesita pnpm — `corepack enable` basta.)
- [ ] Las 4 cuentas demo entran desde las tarjetas del login sin instrucciones externas; banner visible en todas las pantallas.
- [ ] **Tabla RQ-01…RQ-27 completada navegando la demo** (misma tabla de `docs/01`, con una columna "cómo se verificó" y la ruta exacta): alimenta la columna "hoja" de la propuesta técnica y el manual.
- [ ] AD-01: `openapi.yaml` descargable y cada endpoint responde con la API key · AD-02: al menos una OC real cacheada y vinculada a un activo · AD-03: portal con solicitudes operativo y pantallazos exportados.
- [ ] Los 7 contenidos DEMO-01…07 ejecutables en **una pasada de 15 minutos, ensayada y cronometrada**; esa pasada es la "ruta sugerida de revisión" del manual.
- [ ] **Manual de uso del demo (PDF):** portada con URL y credenciales · qué es cada módulo con capturas · la pasada de 15 minutos · convenciones de depreciación (`docs/09`) · cómo funciona el escáner sin lector físico · API: enlace a `/integraciones`, API key demo y `openapi.yaml` adjunto · respaldo diario y canal de soporte · nota de datos ficticios. Cumple RQ-27 y la respuesta 11 del foro.
- [ ] `entregables/`: manual PDF, `openapi.yaml`, pantallazos del portal (`docs/11`), `planilla-ejemplo-vista-general.xlsx`, tabla de verificación RQ.
- [ ] Suite unitaria y de API en verde; e2e de la pasada principal en verde. `git tag v1.0-oferta`.

## Plan de trabajo sugerido (cada bloque deja algo demostrable)
| Bloque | Entrega | Recortable |
|---|---|---|
| A1 | `server/` con Prisma, sesión, `/api/salud`, auth completa, seed mínimo, front conectado (auth + activos + almacén) | No |
| A2 | Actas, vida útil, reportes y dashboard conectados; eliminar todo `localStorage` de negocio | No |
| B1 | Usuarios + Auditoría + roles en servidor | No |
| B2 | Alertas + campos de mantención/garantía + banner + textos del login + renombre de Actas + depreciación mensual | No |
| B3 | Adjuntos con georreferencia | No |
| C1 | `/api/v1` + `openapi.yaml` + botón "Probar"; Mercado Público real + vincular OC | No (son los AD) |
| C2 | Seed completo (~500 activos) + solicitudes del portal | Seed no; solicitudes P1 |
| C3 | Etiquetas + escáner + campos personalizados + importador | Ver orden abajo |
| D | Tests, pasada cronometrada, manual, pantallazos, tag | No |

## Orden de recorte si no alcanza (solo en este orden)
1. Lectura con cámara (`@zxing`) — ni empezarla.
2. Reinicio automático nocturno de la demo.
3. Hoja mural en PDF (queda la etiqueta individual y el pliego).
4. Editor de campos personalizados (dejar la definición sembrada y los valores visibles en la ficha).
5. Vista "Perfiles y permisos" (la matriz queda solo en el manual).
6. Solicitudes del portal (la autoconsulta actual ya cumple AD-03; se pierde el diferencial de la respuesta 9).
7. Importador con mapeo manual (dejar solo mapeo automático por encabezados esperados).

**Nunca se recorta:** servidor + BD, Usuarios, Auditoría, Adjuntos, Alertas, seed, banner, los 3 AD verificables, depreciación mensual, manual.
