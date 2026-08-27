# 01 — Requisitos trazables y brechas (RQ / AD / DEMO)

Estado en este repo: ✅ hecho · ⚠️ parcial · ❌ falta · 📄 se cumple en la propuesta, no en la demo. Prioridad: **P0** sin esto no se envía · **P1** paga puntos · **P2** pulido.

## RQ — Checklist Anexo 2A (27/27 obligatorios; menos del 100 % = inadmisible)

| Cód. | Requisito | Estado | Dónde se resuelve | Pri |
|---|---|---|---|---|
| RQ-01 | 100 % web, sin instalaciones | ✅ | — | P0 |
| RQ-02 | Chrome, Edge, Firefox | ✅ | Probar los tres antes de entregar (`docs/15`) | P0 |
| RQ-03 | Arquitectura web escalable | ⚠️ | Servidor + BD (`docs/02`) + sección de arquitectura en la propuesta | P0 |
| RQ-04 | HTTPS/TLS | 📄 | Lo resuelve el despliegue de Francisco; el servidor debe funcionar detrás de un proxy (`trust proxy`, cookies `secure`) | P0 |
| RQ-05 | Responsive PC/tablet/móvil | ✅ | Verificar a 360 px las pantallas nuevas | P0 |
| RQ-06 | Autenticación y perfiles parametrizables | ⚠️ | Sesión en servidor + módulo Usuarios (`docs/04`) | P0 |
| RQ-07 | Permisos por roles y niveles | ⚠️ | 4 roles + matriz aplicada en servidor y UI (`docs/04`, `docs/14`) | P0 |
| RQ-08 | Bitácora / auditoría de acciones | ❌ | `docs/05` | P0 |
| RQ-09 | Multiusuario concurrente | ❌ | Servidor + BD (`docs/02`) | P0 |
| RQ-10 | Disponibilidad ≥ 99 % mensual | ⚠️ | `/api/salud` (`docs/02`); compromiso 99,5 % en Anexo 2B | P0 |
| RQ-11 | Respaldo automático diario | ❌ | Script `pg_dump` + copia de `storage/` (`docs/02`), documentado en el manual | P0 |
| RQ-12 | Adjuntar fotos, PDF, OC, garantías | ❌ | `docs/06` | P0 |
| RQ-13 | Búsqueda avanzada (código, descripción, ubicación, responsable, estado) | ⚠️ | Agregar filtro **responsable** a `FiltrosActivos` (el mock ya lo soporta) | P1 |
| RQ-14 | Folios automáticos correlativos | ✅ | Pasa al servidor con secuencia atómica (`docs/02`) | P0 |
| RQ-15 | Export PDF, Excel y CSV | ✅ | Reutilizar `reportes/utils/exportar*.js` en Auditoría y Alertas | P0 |
| RQ-16 | Panel de control con indicadores | ⚠️ | El mock devuelve ceros: endpoints de resumen reales (`docs/07`) | P0 |
| RQ-17 | Alertas de mantenciones/vencimientos | ❌ | `docs/07` | P0 |
| RQ-18 | Historial y trazabilidad por activo | ✅ | Ya existe; el servidor lo persiste | P0 |
| RQ-19 | Impresión de etiquetas y hojas murales | ❌ | `docs/08` | P1 |
| RQ-20 | Compatibilidad con lectores de código de barras y RFID | ⚠️ | Campos existen; falta el campo "Escanear código" (`docs/08`) | P1 |
| RQ-21 | Campos personalizados | ❌ | `docs/08` | P1 |
| RQ-22 | Imágenes georreferenciadas desde móviles | ❌ | `docs/06` | P1 |
| RQ-23 | Compatibilidad con BD relacionales | ❌ | PostgreSQL (`docs/02`) | P0 |
| RQ-24 | Escalabilidad de usuarios/activos | ❌ | Seed de ~500 activos + importador de 3.530 filas (`docs/12`) | P0 |
| RQ-25 | Actualizaciones evolutivas incluidas | 📄 | Propuesta | — |
| RQ-26 | Soporte remoto semanal | 📄 | Propuesta + canal de soporte en el manual | — |
| RQ-27 | Incluye demo y manual de usuario | ⚠️ | Esta demo + manual PDF (`docs/16`) | P0 |

## AD — Elementos adicionales (se declaran exactamente 3)

| Cód. | Elemento | Estado | Dónde se resuelve | Pri |
|---|---|---|---|---|
| AD-01 | API/Web service con sistema contable/SIGFE, con especificación técnica adjunta | ⚠️ (solo documentación en pantalla) | Endpoints reales `/api/v1` con API key + `openapi.yaml` descargable (`docs/10`) | P0 |
| AD-02 | API/Web service con mercadopublico.cl | ⚠️ (simulación) | Consulta real por código de OC, caché y "vincular a activo" (`docs/10`) | P0 |
| AD-03 | Portal de autoconsulta para usuarios sin perfil admin | ✅ base | Agregar **solicitudes** de insumos; pantallazos para el Anexo 2A (`docs/11`) | P1 |

FEA y "app en tienda" **no se declaran ni se mencionan**.

## DEMO — Contenidos mínimos que la comisión validará (respuesta 15 del foro)

| Cód. | Contenido | Estado | Nota |
|---|---|---|---|
| DEMO-01 | Gestión de activos fijos y almacenes | ✅ | — |
| DEMO-02 | Ingreso y egreso de inventario | ✅ | Rechaza stock negativo |
| DEMO-03 | Trazabilidad de movimientos | ✅ | — |
| DEMO-04 | Altas, bajas y traslados | ✅ | — |
| DEMO-05 | Cálculo de depreciación | ⚠️ | Pasar a lineal mensual con residual $1 y citar la tabla SII (`docs/09`) |
| DEMO-06 | Reportabilidad y exportación | ✅ | — |
| DEMO-07 | Administración de usuarios y roles | ❌ | `docs/04` |

## Reglas de la demo (respuestas 11–15 y 17 del foro)
- En línea, por URL, credenciales adjuntas en la oferta, disponibilidad continua durante toda la revisión.
- Navegación real por los módulos: nada estático.
- Manual de uso del demo como entregable (`docs/16`).
- "La demo exigida constituye el medio de verificación práctica de lo declarado": lo que se declare en el Anexo 2A tiene que poder hacerse en la demo.
