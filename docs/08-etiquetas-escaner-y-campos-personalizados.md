# 08 — Etiquetas y hojas murales (RQ-19), escáner (RQ-20), campos personalizados (RQ-21)

## Etiqueta individual
- `GET /api/activos/:id/etiqueta.svg` → `bwip-js` Code128 del `codigoBarras`, con texto legible. Sesión requerida.
- Página `/activos-fijos/:id/etiqueta` (dentro de `AppLayout`) con vista previa y botón **Imprimir** (`window.print()`); CSS `@media print { @page { size: 50mm 25mm; margin: 2mm } }` que oculta sidebar y banner. Contenido: nombre (2 líneas máx.), folio, código de barras, "SUSESO — Activo fijo".
- En `TablaActivos`: selección múltiple → "Imprimir etiquetas" abre `/activos-fijos/etiquetas?ids=a,b,c` con un pliego (grid de 4 × 10 en A4).
- `codigoBarras` obligatorio y único; si el formulario lo deja vacío, el servidor asigna el folio como código (lo que hoy pasa con `''` deja de permitirse: `docs/12` corrige el seed).

## Hoja mural por ubicación
Para no sumar dependencias se genera **en el navegador** con `jspdf` + `jspdf-autotable` (ya instalados) desde `Configuración → Ubicaciones` y desde el filtro de ubicación en Activos: encabezado (institución, ubicación, fecha, responsable), tabla folio · nombre · categoría · estado · código, pie con total. Auditar `etiqueta_generada` cuando se imprime desde la ficha (opcional).

## Escáner de código de barras y RFID (RQ-20)
Un lector USB escribe como teclado y termina con Enter; los lectores RFID USB hacen lo mismo con el EPC. Componente `CampoEscaneo` (`components/common/`): input con autofoco, placeholder "Escanear o escribir código y presionar Enter", al Enter llama `GET /api/activos/por-codigo/:codigo` (busca en `folio`, `codigoBarras`, `rfid`) y navega a la ficha; si no existe, muestra "Código no registrado" y ofrece "Dar de alta con este código" (prellena `codigoBarras`). Ubicarlo en la cabecera de **Activos fijos** y de **Almacén** (busca por folio BOD). Así se demuestra tipeando, sin lector físico; un párrafo del manual lo explica y menciona el PDA cotizado en la propuesta. **P2:** lectura con cámara (`@zxing/browser`) solo si sobra tiempo.

## Campos personalizados (RQ-21)
- Definición en `Configuracion` (`clave = "campos_personalizados"`): `[{ id, nombre, tipo: texto|numero|fecha|lista, opciones?: string[], obligatorio: boolean }]`. Pantalla **Configuración → Campos personalizados** (Administrador): agregar, editar, ordenar, desactivar. El submenú de Configuración pasa a tener: Vida útil, Campos personalizados, Perfiles y permisos, Importar planilla, Reiniciar demo.
- `Activo.camposPersonalizados` (JSON `{ [id]: valor }`). `FormularioActivo` renderiza los campos definidos debajo de los estándar; la ficha los muestra en la pestaña Datos; `buscarActivos` acepta `texto` también sobre estos valores (búsqueda simple `contains` sobre JSON serializado; suficiente).
- Seed: dos campos ("Número de serie", texto; "Centro de costo", lista) con valores en ~300 activos.
