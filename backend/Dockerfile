# === Dockerfile — Backend TaskMaster ===
# Couvre : Conteneurisation (CP 1.3), Docker orchestration (CP 11.2)

# Étape 1 : construction des dépendances et préparation du runtime
FROM node:20-alpine AS builder

LABEL maintainer="votre-email@example.com"
LABEL description="TaskMaster API Backend"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm prune --omit=dev

COPY src/ ./src/

# Étape 2 : image d'exécution minimale et non-root
FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache wget \
  && addgroup -S appgroup \
  && adduser -S appuser -G appgroup

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/app.js"]
