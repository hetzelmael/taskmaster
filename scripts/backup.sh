#!/bin/bash
# === backup.sh — Sauvegarde de la base de données ===
# Couvre : Sauvegarde/restauration (CP 7.4)
# Usage : ./scripts/backup.sh

set -euo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/taskmaster_${TIMESTAMP}.sql.gz"

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p "$BACKUP_DIR"

echo "=== Sauvegarde TaskMaster ==="
echo "Date : $(date)"
echo "Fichier : $BACKUP_FILE"

# pg_dump via Docker — exporte la base complète, compressée avec gzip
docker exec taskmaster-db pg_dump \
  -U postgres \
  -d taskmaster \
  --no-owner \
  --no-privileges \
  --format=plain \
  | gzip > "$BACKUP_FILE"

# Vérifier que le fichier n'est pas vide
SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
if [ "$SIZE" -lt 100 ]; then
  echo "ERREUR : Sauvegarde vide ou trop petite ($SIZE octets)"
  rm -f "$BACKUP_FILE"
  exit 1
fi

echo "OK : Sauvegarde réussie ($(du -h "$BACKUP_FILE" | cut -f1))"

# Garder uniquement les 7 dernières sauvegardes (rotation)
cd "$BACKUP_DIR"
ls -t taskmaster_*.sql.gz | tail -n +8 | xargs -r rm -f
echo "Rotation : $(ls taskmaster_*.sql.gz | wc -l) sauvegardes conservées"

# === RESTAURATION (mode manuel) ===
# Pour restaurer :
#   gunzip -c backups/taskmaster_20240101_120000.sql.gz | \
#     docker exec -i taskmaster-db psql -U postgres -d taskmaster
