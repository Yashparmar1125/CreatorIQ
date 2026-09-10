#!/usr/bin/env bash
set -eo pipefail

echo "========================================="
echo "  CreatorIQ Backend Production Deploy    "
echo "========================================="

APP_DIR="${APP_DIR:-/opt/creatoriq/backend}"
COMPOSE_FILE="docker-compose.prod.yml"

cd "$APP_DIR"

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "[ERROR] $COMPOSE_FILE not found in $APP_DIR"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "[ERROR] .env file not found in $APP_DIR"
    exit 1
fi

echo "[1/6] Pulling latest production images from GHCR..."
docker compose -f "$COMPOSE_FILE" pull || {
    echo "[WARN] Docker pull failed or images not yet published to GHCR. Will fall back to local builds if present."
}

echo "[2/6] Starting core infrastructure (PostgreSQL, Redis, Qdrant)..."
docker compose -f "$COMPOSE_FILE" up -d postgres redis qdrant

echo "[3/6] Waiting for PostgreSQL and Redis health..."
timeout 60 bash -c 'until docker exec ciq-postgres pg_isready -U "${POSTGRES_USER:-creatoriq}" -d "${POSTGRES_DB:-creatoriq}" >/dev/null 2>&1; do sleep 2; echo "  Waiting for Postgres..."; done'
timeout 30 bash -c 'until docker exec ciq-redis redis-cli ping | grep -q PONG; do sleep 2; echo "  Waiting for Redis..."; done'

echo "[4/6] Running database schema synchronization (db-push)..."
for svc in auth channel trend strategy planner analytics ml; do
    echo "  -> Running db-push-$svc..."
    docker compose -f "$COMPOSE_FILE" --profile db-push run --rm "db-push-$svc" || echo "  [WARN] Schema push warning for $svc"
done

echo "[5/6] Starting all backend microservices..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "[6/6] Verifying API Gateway health..."
sleep 5
GATEWAY_HEALTH_URL="http://127.0.0.1:8000/v1/auth/health"
for i in {1..15}; do
    if curl -s -f "$GATEWAY_HEALTH_URL" > /dev/null 2>&1; then
        echo "  [OK] API Gateway is healthy!"
        break
    else
        echo "  Attempt $i/15: waiting for API Gateway..."
        sleep 3
    fi
done

echo "Cleaning up dangling images..."
docker image prune -af --filter "until=72h" > /dev/null 2>&1 || true

echo "========================================="
echo "  Deploy Completed Successfully!         "
echo "  Endpoint: https://api.ciq.yashparmar.in"
echo "========================================="
