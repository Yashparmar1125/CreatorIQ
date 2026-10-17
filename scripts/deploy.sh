#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/ubuntu/CreatorIQ"
cd "$REPO_DIR"

echo "=== [1/4] Pulling latest git changes from origin/main ==="
git fetch origin main
git reset --hard origin/main

SERVICES="${*:-}"
if [ -z "$SERVICES" ]; then
    echo "=== [2/4] Rebuilding and restarting all containers ==="
    sudo docker compose -f backend/docker-compose.yml up -d --build
else
    echo "=== [2/4] Rebuilding and restarting specific containers: $SERVICES ==="
    sudo docker compose -f backend/docker-compose.yml up -d --build $SERVICES
fi

echo "=== [3/4] Checking container statuses ==="
sudo docker compose -f backend/docker-compose.yml ps

echo "=== [4/4] Verifying Gateway Health ==="
sleep 3
curl -s http://127.0.0.1:8000/health || echo "Warning: Gateway health check did not return HTTP 200"
echo ""
echo "=== Deployment Complete ==="
