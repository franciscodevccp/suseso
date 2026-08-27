#!/usr/bin/env bash
#
# Respaldo diario de SISGA (RQ-11, docs/02): dump comprimido de PostgreSQL
# + tar de los adjuntos, con rotación de 14 días. Francisco lo programa en
# cron al desplegar (documentado en el manual como "respaldo automático
# diario a las 03:00"). Ensayar una restauración antes de entregar:
#   pg_restore --clean --dbname "$DATABASE_URL" backups/sisga-<fecha>.dump
#
# Usa pg_dump del sistema (VPS); si no existe y hay un contenedor
# sisga-db (desarrollo), respalda a través de Docker.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO="${RESPALDO_DIR:-$RAIZ/backups}"
FECHA="$(date +%F)"
mkdir -p "$DESTINO"

# DATABASE_URL desde el entorno o desde .env (sin ejecutar el archivo).
if [ -z "${DATABASE_URL:-}" ] && [ -f "$RAIZ/.env" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$RAIZ/.env" | head -1 | cut -d= -f2- | tr -d '"')"
fi
[ -n "${DATABASE_URL:-}" ] || { echo "Falta DATABASE_URL (.env)"; exit 1; }

DUMP="$DESTINO/sisga-$FECHA.dump"
if command -v pg_dump >/dev/null 2>&1; then
  pg_dump --dbname "$DATABASE_URL" -Fc -f "$DUMP"
elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^sisga-db$'; then
  docker exec sisga-db pg_dump -U sisga -d sisga -Fc > "$DUMP"
else
  echo "No hay pg_dump ni contenedor sisga-db disponibles"; exit 1
fi

# Adjuntos (docs/06): solo si ya existen archivos.
if [ -d "$RAIZ/storage/adjuntos" ] && [ -n "$(ls -A "$RAIZ/storage/adjuntos" 2>/dev/null)" ]; then
  tar -czf "$DESTINO/adjuntos-$FECHA.tar.gz" -C "$RAIZ/storage" adjuntos
fi

# Rotación: 14 días (docs/02).
find "$DESTINO" -name 'sisga-*.dump' -mtime +14 -delete
find "$DESTINO" -name 'adjuntos-*.tar.gz' -mtime +14 -delete

echo "Respaldo listo: $DUMP ($(du -h "$DUMP" | cut -f1))"
