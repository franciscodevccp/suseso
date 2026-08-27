# 09 — Depreciación y vida útil (DEMO-05) — la comisión es de Finanzas: esto se revisa con lupa

## Problema actual
`features/depreciacion/utils/calculoDepreciacion.js` deprecia por **años completos** (aniversario cumplido) con residual 0. Un bien comprado hace 6 meses muestra depreciación cero; uno de 3,9 años muestra 3 años. Para un evaluador contable es un error, no una simplificación.

## Regla nueva — `shared/depreciacion.js` (función pura, usada por front y servidor)
- Método **lineal mensual**. `cuotaMensual = (valor − valorResidual) / (vidaUtilAnios × 12)`, con `valorResidual = 1` por defecto (convención de bien totalmente depreciado a $1).
- `mesesTranscurridos`: desde el **mes de adquisición inclusive** hasta el mes de la fecha de corte (máx. `vidaUtilAnios × 12`). Fecha de corte: hoy, o la fecha de baja si está dado de baja, o la que pida el reporte.
- `depreciacionAcumulada = cuotaMensual × meses`; `valorLibro = max(valorResidual, valor − depreciacionAcumulada)`; `depreciacionDelPeriodo(desde, hasta)` para el reporte por período.
- Devuelve además `tablaEvolucion` **anual** (año 1..N: depreciación del año, acumulada, valor libro al cierre) para que `BloqueDepreciacion` y el reporte sigan funcionando; y `vidaUtilRestanteMeses`.
- Redondeo: pesos enteros al mostrar (`formatoMoneda.js`), cálculo con decimales.
- Vida útil **acelerada** (tabla SII, columna opcional): misma fórmula con `vidaUtilAcelerada`; se muestra como columna adicional en el reporte, no reemplaza a la normal.

Firma: `calcularDepreciacion({ valor, fechaAlta, vidaUtilAnios, valorResidual = 1, fechaCorte = new Date(), vidaUtilAcelerada })`. Los consumidores actuales (`BloqueDepreciacion`, `reportesService`, `useVidaUtilCategoria`) reciben las mismas propiedades más las nuevas.

## Tabla de vida útil — Configuración → Vida útil
Mantener la edición por categoría (la pantalla existe) y agregar: columna "Acelerada", texto de referencia **"Valores referenciales según Resolución Exenta SII N°43 de 2002 (Tabla de vida útil de bienes físicos del activo inmovilizado). Editables por la institución."**, y validación de enteros > 0. Valores del seed para las categorías actuales del repo:

| Categoría (repo) | Normal | Acelerada | Referencia SII |
|---|---|---|---|
| Equipos computacionales | 6 | 2 | Sistemas computacionales, computadores, periféricos |
| Mobiliario | 7 | 2 | Muebles y enseres |
| Vehículos | 7 | 2 | Automóviles, camionetas |
| Maquinaria | 15 | 5 | Maquinarias y equipos en general |
| Equipos audiovisuales | 6 | 2 | Asimilado a equipos electrónicos |
| Herramientas | 8 | 2 | Herramientas pesadas (livianas: 3 / 1) |
| Instalaciones (nueva) | 10 | 3 | Instalaciones en general |
| Equipos de aire y refrigeración (nueva) | 10 | 3 | — |

## Dónde se ve
- Ficha del activo, pestaña Depreciación: valor de adquisición, vida útil, meses transcurridos, cuota mensual, depreciación acumulada, **valor libro**, tabla anual. Si la categoría no tiene vida útil: aviso "Configure la vida útil de la categoría" con enlace.
- Reporte Depreciación: filtros fecha de corte y categoría; columnas folio, nombre, categoría, fecha de alta, valor, vida útil, meses, acumulada, valor libro, (acelerada). Totales al pie. PDF/Excel/CSV.
- Panel: KPI "Valor libro total".
- `GET /api/v1/activos/{folio}/depreciacion` (AD-01) usa la misma función.

## Tests (`docs/15`)
Mes de compra (1 mes) · 18 meses · vida cumplida → $1 exacto · fecha de corte anterior a la alta → 0 · vida acelerada · valores con decimales · consistencia tabla anual vs. acumulado mensual al cierre de cada año.
