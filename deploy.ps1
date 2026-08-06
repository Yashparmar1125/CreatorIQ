param (
    [Parameter(Mandatory=$true)]
    [string]$VmHost,
    
    [Parameter(Mandatory=$true)]
    [string]$VmUser,
    
    [string]$IdentityFile = "~/.ssh/id_ed25519"
)

$ErrorActionPreference = "Stop"

Write-Host "Starting local deployment to $VmUser@$VmHost..." -ForegroundColor Cyan

# 1. Verify secrets exist locally
if (-Not (Test-Path ".\backend\.env.production")) {
    Write-Error "Could not find .\backend\.env.production. Please create this file with your production environment variables before deploying."
    exit 1
}

if (-Not (Test-Path ".\backend\secrets\jwt_private.pem") -or -Not (Test-Path ".\backend\secrets\jwt_public.pem")) {
    Write-Error "Could not find JWT keys in .\backend\secrets\. Please ensure jwt_private.pem and jwt_public.pem exist."
    exit 1
}

# 2. SSH command parameters
$sshArgs = @("-i", $IdentityFile, "-o", "StrictHostKeyChecking=accept-new", "${VmUser}@${VmHost}")
$scpArgs = @("-i", $IdentityFile, "-o", "StrictHostKeyChecking=accept-new")

# 3. Create directories on the VM if they don't exist
Write-Host "Ensuring directories exist on VM..."
& ssh $sshArgs "mkdir -p ~/CreatorIQ/backend/secrets"

# 4. Copy secrets to the VM
Write-Host "Copying secrets to VM..."
& scp $scpArgs ".\backend\.env.production" "${VmUser}@${VmHost}:~/CreatorIQ/backend/.env"
& scp $scpArgs ".\backend\secrets\jwt_private.pem" "${VmUser}@${VmHost}:~/CreatorIQ/backend/secrets/"
& scp $scpArgs ".\backend\secrets\jwt_public.pem" "${VmUser}@${VmHost}:~/CreatorIQ/backend/secrets/"

# 5. Create deployment script and transfer it
$deployScript = @'
set -e
echo "➡️ Navigating to repository..."
cd ~/CreatorIQ || { echo 'Repo not found. Clone it first!'; exit 1; }

echo "➡️ Pulling latest code..."
git fetch --all
git reset --hard origin/main

echo "➡️ Setting permissions..."
cd backend
chmod 600 secrets/*.pem

echo "➡️ Stopping existing containers..."
docker compose down

echo "➡️ Building and starting new containers..."
docker compose up -d --build

echo "➡️ Cleaning up unused images..."
docker image prune -f

echo "➡️ Building db-push containers..."
docker compose --profile db-push build

echo "➡️ Syncing database schema (db push)..."
docker compose --profile db-push run --rm db-push-auth
docker compose --profile db-push run --rm db-push-channel
docker compose --profile db-push run --rm db-push-trend
docker compose --profile db-push run --rm db-push-strategy
docker compose --profile db-push run --rm db-push-planner
docker compose --profile db-push run --rm db-push-analytics

echo "➡️ Priming trend concept store..."
TOKEN=$(docker exec ciq-trend printenv INTERNAL_SERVICE_TOKEN 2>/dev/null || true)
if [ -z "$TOKEN" ]; then
  echo "⚠️  Could not read INTERNAL_SERVICE_TOKEN — skipping trend collector"
else
  echo "➡️ Waiting for trend service to be ready..."
  for i in $(seq 1 30); do
    if curl -sf http://localhost:8003/health >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
  if curl -sf -X POST "http://localhost:8003/internal/trends/collect" \
      -H "X-Internal-Service-Token: $TOKEN"; then
    echo "✅ Trend concept store primed"
  else
    echo "⚠️  Trend collector failed — check YOUTUBE_API_KEY and run: docker logs ciq-trend"
  fi
fi

echo "✅ Deployment script finished successfully!"
'@

Write-Host "Preparing deployment script..."
$tmpScript = [System.IO.Path]::GetTempFileName()
# Convert to Unix line endings just in case
$deployScript = $deployScript -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($tmpScript, $deployScript, [System.Text.Encoding]::UTF8)

& scp $scpArgs $tmpScript "${VmUser}@${VmHost}:~/deploy_run.sh"
Remove-Item $tmpScript

Write-Host "Running deployment on VM (streaming output)..." -ForegroundColor Yellow
# Run script with real-time output
& ssh $sshArgs "bash ~/deploy_run.sh && rm ~/deploy_run.sh"

Write-Host "Deployment completed successfully!" -ForegroundColor Green
