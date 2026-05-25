#!/bin/bash
# === deploy.sh — Script de déploiement TaskMaster ===
# Couvre : Procédures de déploiement (CP 10.2)
# Usage : ./scripts/deploy.sh [dev|staging|prod]

set -euo pipefail  # Arrêter si une commande échoue

# --- Configuration ---
ENV=${1:-dev}
echo "=== Déploiement TaskMaster — Environnement : $ENV ==="
echo "Date : $(date '+%Y-%m-%d %H:%M:%S')"

# --- Étape 1 : Vérifications préalables ---
echo "[1/6] Vérifications préalables..."
command -v docker >/dev/null 2>&1 || { echo "ERREUR : Docker non installé"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "ERREUR : Docker Compose non installé"; exit 1; }

if [ ! -f .env ]; then
  echo "ERREUR : fichier .env manquant. Copiez .env.example en .env"
  exit 1
fi

# --- Étape 2 : Sauvegarde de la BDD avant déploiement ---
echo "[2/6] Sauvegarde de la base de données..."
if docker ps | grep -q taskmaster-db; then
  ./scripts/backup.sh || echo "ATTENTION : Sauvegarde échouée (première installation ?)"
fi

# --- Étape 3 : Pull des dernières images ---
echo "[3/6] Mise à jour des images Docker..."
docker compose pull db cache frontend

# --- Étape 4 : Build du backend ---
echo "[4/6] Build du backend..."
docker compose build --no-cache backend

# --- Étape 5 : Démarrage des services ---
echo "[5/6] Démarrage des services..."
docker compose up -d

# --- Étape 6 : Vérification de santé ---
echo "[6/6] Vérification de santé..."
sleep 10  # Attendre le démarrage

# Tester le healthcheck de l'API
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "OK : API backend répond (HTTP 200)"
else
  echo "ATTENTION : API ne répond pas (HTTP $HTTP_CODE)"
  echo "Logs du backend :"
  docker compose logs --tail 20 backend
  exit 1
fi

# Tester le frontend
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "OK : Frontend répond (HTTP 200)"
else
  echo "ATTENTION : Frontend ne répond pas (HTTP $HTTP_CODE)"
fi

echo ""
echo "=== Déploiement terminé avec succès ==="
echo "  API     : http://localhost:3000"
echo "  Frontend: http://localhost:8080"
DB_PORT_DISPLAY=${DB_PORT:-5433}
echo "  BDD     : localhost:${DB_PORT_DISPLAY}"
