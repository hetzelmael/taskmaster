# === Dockerfile — Backend TaskMaster ===
# Couvre : Conteneurisation (CP 1.3), Docker orchestration (CP 11.2)

# Étape 1 : Image de base — toujours spécifier une version précise
# Alpine = image légère (~50 Mo vs ~350 Mo pour la version complète)
FROM node:20-alpine AS base

# Métadonnées
LABEL maintainer="votre-email@example.com"
LABEL description="TaskMaster API Backend"

# Créer un utilisateur non-root (sécurité ANSSI)
# Ne JAMAIS exécuter l'application en tant que root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Répertoire de travail dans le conteneur
WORKDIR /app

# --- Étape 2 : Installer les dépendances ---
# On copie SEULEMENT package.json d'abord (cache Docker)
# Si le code change mais pas les dépendances, Docker réutilise le cache
COPY package.json package-lock.json* ./
RUN npm ci --production && npm cache clean --force
# npm ci est plus fiable que npm install pour la reproductibilité

# --- Étape 3 : Copier le code source ---
COPY src/ ./src/

# --- Étape 4 : Sécurité ---
# Changer le propriétaire des fichiers
RUN chown -R appuser:appgroup /app

# Passer à l'utilisateur non-root
USER appuser

# Port exposé (documentation, ne l'ouvre pas réellement)
EXPOSE 3000

# Healthcheck : vérifie que l'app répond
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Commande de démarrage
CMD ["node", "src/app.js"]
