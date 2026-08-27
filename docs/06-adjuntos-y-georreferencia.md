# 06 — Adjuntos y fotos georreferenciadas (RQ-12, RQ-22)

## Modelo y almacenamiento
`Adjunto` (`docs/02`). Archivos en `STORAGE_DIR/adjuntos/<cuid>.<ext>`; el nombre original solo como metadato. Nunca se sirve `storage/` como estático: `GET /api/adjuntos/:id` verifica sesión y permisos, fija `Content-Type` del registro y `Content-Disposition` (inline para imágenes, attachment para PDF).

## Subida — `POST /api/activos/:id/adjuntos` (multipart, Gestor/Administrador)
- Campos: `archivo` (uno por request), `tipo` (`foto | pdf | orden_compra | garantia | otro`), opcionales `latitud`, `longitud` (si vienen del navegador).
- multer en memoria, límite 10 MB, whitelist por **contenido** (no por extensión): `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. Otro → `TIPO_NO_PERMITIDO`.
- Fotos: `exifr.gps(buffer)` → si trae GPS se guardan `latitud/longitud` y `fecha` EXIF; si no, se usan las coordenadas del formulario si existen. Se eliminan los metadatos al guardar solo si es trivial; no es requisito.
- Primera foto subida pasa a ser `fotoPrincipalId` (cambiable con `POST /api/activos/:id/foto-principal`).
- Auditoría `adjunto_agregado` / `adjunto_eliminado`.

## Georreferencia desde el navegador (RQ-22)
En el formulario de subida, botón **"Usar mi ubicación"** → `navigator.geolocation.getCurrentPosition` rellena `latitud/longitud` (precisión mostrada). Funciona en móvil y en PC (con menos precisión). Así el requisito es demostrable desde el celular de la comisión y desde el escritorio.

## UI — ficha del activo, pestaña **Adjuntos** (nueva; las pestañas actuales de `FichaActivoPage` se conservan)
- Galería de fotos (miniatura, fecha, "Ver en mapa" → `https://www.openstreetmap.org/?mlat=<lat>&mlon=<lng>#map=17/<lat>/<lng>`, sin claves de API) y lista de documentos (tipo, nombre, tamaño, descargar, eliminar si `puedeGestionar`).
- Formulario: seleccionar archivo, tipo, "Usar mi ubicación", subir. En móvil `accept="image/*" capture="environment"` abre la cámara.
- Listado de activos: miniatura de `fotoPrincipalId` si existe.

## Seed
~40 % de los activos con una foto (imágenes genéricas generadas o SVG placeholder con el nombre del bien), 10 con coordenadas alrededor de Huérfanos 1376, Santiago (−33.4405, −70.6520 ± 0,001), 15 con "orden de compra" y 10 con "garantía" en PDF de una página generado con jsPDF en el seed.
