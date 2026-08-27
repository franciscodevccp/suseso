# 12 — Importador de la planilla "Vista General" (RQ-24, criterio B.3) y seed de datos

## Importador — Configuración → Importar planilla (Gestor/Administrador)
La respuesta 8 del foro fija el origen de la migración: una planilla Excel "Vista General" con **codificación, descripción/nombre, ubicación física, características y valores contables**. El importador de la demo sustenta el plan de migración del criterio B.3 y demuestra RQ-24 en vivo con 3.530 filas.

Flujo (dos pasos, dos endpoints):
1. `POST /api/importaciones/vista-general/previsualizar` (multipart `.xlsx`, máx. 20 MB; `exceljs` en servidor, en memoria). Detecta encabezados y propone el mapeo a: `codigo → codigoBarras`, `nombre/descripcion → nombre`, `caracteristicas → descripcion`, `ubicacion → ubicacion`, `categoria → categoria`, `valor/valor contable → valor`, `fecha adquisicion → fechaAlta`, `responsable → responsable`, `serie → campo personalizado`. Si un encabezado no calza, la UI ofrece un selector por columna. Devuelve `{ idPrevisualizacion, columnas, mapeoSugerido, muestra (20 filas), totalFilas, validacion: { validas, conObservaciones, errores:[{fila, columna, motivo}] }, ubicacionesNuevas[], categoriasNuevas[] }`. La previsualización se guarda temporalmente en `Configuracion` (clave `importacion:<id>`, TTL 30 min).
2. `POST /api/importaciones/vista-general/confirmar` `{ idPrevisualizacion, mapeo, crearCatalogosFaltantes: true }` → crea Ubicaciones/Categorías faltantes (vida útil por defecto según nombre, o 5 años), inserta activos en lotes de 500 con `createMany` (folio correlativo por lote desde `Secuencia`), genera el movimiento `alta` "Importado desde planilla Vista General" por activo, y devuelve `{ creados, omitidos, errores, duracionMs, reporteUrl }`. El reporte de resultado se descarga como Excel. Auditoría `activos/importacion` con el total.

Validaciones: duplicados de código dentro del archivo y contra la BD (se omiten y se informan), valor no numérico (fila con observación; se importa con 0 solo si el usuario lo acepta), fecha inválida (usa hoy y observa), filas vacías. **Rendimiento exigido: 3.530 filas en menos de 60 s** de punta a punta.

UI: página `/configuracion/importar` con los tres pasos (subir → revisar mapeo y validación → confirmar y ver resultado), barra de progreso honesta y enlace "Ver activos importados" (filtro por fecha de alta = hoy).

## Seed — `server/prisma/seed.js` (reproducible: `pnpm db:seed` borra y recrea)
- **Usuarios:** las 4 cuentas demo (`docs/04`) + 12 usuarios ficticios activos/inactivos para que el módulo Usuarios tenga contenido.
- **Categorías:** las 8 de `docs/09` con vida útil normal y acelerada.
- **Ubicaciones:** "Huérfanos 1376 — Piso N, <área>" × 18 (Fiscalía, Gabinete, Administración y Finanzas, Intendencia, etc.), "Bodega Central", "Bodega Anexo", "Archivo".
- **Funcionarios (responsables):** 40 nombres chilenos ficticios con cargo.
- **Activos:** ~500 con distribución realista (notebooks, monitores, escritorios, sillas, estantes, impresoras, equipos de aire, proyectores, teléfonos IP —categoría *Equipos computacionales*, no audiovisuales—, 3 vehículos), fechas de alta 2019–2026 para que la depreciación muestre bienes nuevos, a media vida y **en $1**; 8 % en reparación, 4 % dados de baja (con fecha y motivo), 1 % extraviados; `codigoBarras` EAN-13 ficticio válido y único (el seed actual deja `''` en algunos: se corrige); `rfid` en el 30 %; `proximaMantencion`/`finGarantia` en equipos y aire (2 mantenciones y 1 garantía dentro de la ventana de alerta, 1 atrasada); campos personalizados en ~300.
- **Movimientos de activos:** alta de cada uno + 120 traslados/ediciones/bajas repartidos en 2024–2026, con usuario variado.
- **Almacén:** 30 ítems (resmas, tóner por modelo, artículos de aseo y escritorio), 3 bajo mínimo, 1 sin stock; 150 movimientos de ingreso/egreso con `stockResultante` consistente.
- **Actas:** 8 (5 cerradas con sello, 3 pendientes). **Solicitudes:** 6 en estados variados. **OC Mercado Público:** 3–5 reales cacheadas, 1 vinculada. **Adjuntos:** según `docs/06`. **Auditoría:** se genera sola al ejecutar el seed a través de las mismas funciones de dominio (no insertar auditoría "a mano"), más 40 ingresos históricos.
- **Planilla de importación:** el seed escribe `entregables/planilla-ejemplo-vista-general.xlsx` con **3.530 filas** en el formato de la respuesta 8 (códigos distintos de los sembrados), para la demostración en vivo. Después de una importación de prueba, `pnpm db:seed` vuelve todo al estado inicial.
- **Prohibido:** RUT válidos, nombres de funcionarios reales de SUSESO, correos con dominio real. Todo ficticio y rotulado como tal por el banner.
