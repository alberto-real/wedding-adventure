#!/bin/bash
set -euo pipefail

# ─── Wedding Adventure Deploy Script ───
# Called by GitHub Actions CI/CD pipeline.
# Usage: ./deploy/deploy.sh [branch]
# Example: ./deploy/deploy.sh main

BRANCH="${1:-main}"
PROJECT_DIR="/opt/wedding-adventure"
COMPOSE_FILE="docker-compose.prod.yml"

echo "═══════════════════════════════════════════"
echo "  🚀 Deploying Wedding Adventure"
echo "  Branch: ${BRANCH}"
echo "  Time: $(date)"
echo "═══════════════════════════════════════════"

cd "${PROJECT_DIR}"

# ─── Pull latest code ───
echo ""
echo "📥 Pulling latest code from '${BRANCH}'..."
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git reset --hard "origin/${BRANCH}"

# ─── Build and restart containers ───
echo ""
echo "🐳 Building and restarting containers..."
docker compose -f "${COMPOSE_FILE}" build --no-cache
docker compose -f "${COMPOSE_FILE}" up -d --force-recreate

# ─── Cleanup old images ───
echo ""
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

# ─── Health check ───
echo ""
echo "🏥 Waiting for services to be healthy..."
sleep 10

if curl -sf http://localhost:80 > /dev/null 2>&1; then
  echo "✅ Frontend is UP!"
else
  echo "⚠️  Frontend health check failed. Check logs:"
  docker compose -f "${COMPOSE_FILE}" logs --tail=20 front
fi

if curl -sf http://localhost:80/back > /dev/null 2>&1; then
  echo "✅ Backend API is UP!"
else
  echo "⚠️  Backend health check failed. Check logs:"
  docker compose -f "${COMPOSE_FILE}" logs --tail=20 back
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Deploy complete!"
echo "  Time: $(date)"
echo "═══════════════════════════════════════════"
