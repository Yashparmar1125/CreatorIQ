# Build and start the full CreatorIQ backend stack in Docker.
# Schema is synced via SQLAlchemy db-push (create_all) — no Alembic migrations.
param(
    [switch]$SkipDbPush,
    [switch]$PrimeTrends
)

$ErrorActionPreference = "Stop"
$BackendRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

# Docker Desktop is not always on PATH in PowerShell (e.g. Cursor terminal).
$dockerBin = Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\resources\bin"
if ((Test-Path $dockerBin) -and ($env:PATH -notlike "*$dockerBin*")) {
    $env:PATH = "$dockerBin;$env:PATH"
}

Set-Location $BackendRoot

# Local Docker stack always uses the compose Postgres/Redis containers.
# backend/.env may contain an Azure DATABASE_URL for production deploy — that hostname
# is not reachable from inside db-push containers (and @ in passwords breaks URL parsing).
$LocalDatabaseUrl = "postgresql+asyncpg://creatoriq:creatoriq@postgres:5432/creatoriq"
$LocalRedisUrl = "redis://redis:6379/0"
$env:DATABASE_URL = $LocalDatabaseUrl
$env:REDIS_URL = $LocalRedisUrl

$dbServices = @("auth", "channel", "trend", "strategy", "planner", "analytics")

function Sync-DatabaseSchema {
    Write-Host ""
    Write-Host "Syncing database schema (db push)..." -ForegroundColor Cyan
    foreach ($svc in $dbServices) {
        Write-Host "  -> db-push-$svc" -ForegroundColor Gray
        docker compose --profile db-push run --rm "db-push-$svc"
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Schema sync failed for $svc"
            exit $LASTEXITCODE
        }
    }
    Write-Host "  [OK] All service schemas synced" -ForegroundColor Green
}

function Invoke-TrendCollector {
    Write-Host ""
    Write-Host "Priming trend concept store..." -ForegroundColor Cyan
    $token = docker exec ciq-trend printenv INTERNAL_SERVICE_TOKEN 2>$null
    if (-not $token) {
        Write-Host "  [SKIP] Could not read INTERNAL_SERVICE_TOKEN from ciq-trend" -ForegroundColor Yellow
        return
    }
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8003/internal/trends/collect" `
            -Method POST `
            -Headers @{ "X-Internal-Service-Token" = $token.Trim() } `
            -UseBasicParsing -TimeoutSec 120
        if ($r.StatusCode -eq 200) {
            Write-Host "  [OK] $($r.Content)" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] Collector returned HTTP $($r.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [WARN] Trend collector failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== CreatorIQ Docker Backend ===" -ForegroundColor Cyan
Write-Host "Database: $LocalDatabaseUrl" -ForegroundColor DarkGray

# 1. JWT keys
& (Join-Path $PSScriptRoot "generate-jwt-keys.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 2. Check .env exists
if (-not (Test-Path ".env")) {
    Write-Host "No .env found - copying from .env.example" -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Edit backend/.env with your API keys" -ForegroundColor Yellow
}

# 3. Build images (app services + db-push runners)
Write-Host ""
Write-Host "Building Docker images..." -ForegroundColor Cyan
docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose --profile db-push build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 4. Start infra
Write-Host ""
Write-Host "Starting Postgres + Redis..." -ForegroundColor Cyan
docker compose up -d postgres redis
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Waiting for Postgres to be healthy..." -ForegroundColor Gray
$retries = 30
while ($retries -gt 0) {
    $health = docker inspect --format='{{.State.Health.Status}}' ciq-postgres 2>$null
    if ($health -eq "healthy") { break }
    Start-Sleep -Seconds 2
    $retries--
}
if ($retries -eq 0) {
    Write-Error "Postgres did not become healthy in time"
    exit 1
}

# 5. Sync schema from SQLAlchemy models (no migration history)
if (-not $SkipDbPush) {
    Sync-DatabaseSchema
} else {
    Write-Host ""
    Write-Host "Skipping db push (-SkipDbPush)" -ForegroundColor Yellow
}

# 6. Start all services
Write-Host ""
Write-Host "Starting all microservices..." -ForegroundColor Cyan
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Start-Sleep -Seconds 8

if ($PrimeTrends) {
    Invoke-TrendCollector
}

# 7. Health checks
Write-Host ""
Write-Host "Health checks:" -ForegroundColor Cyan
$endpoints = @(
    @{ Name = "API Gateway"; Url = "http://localhost:8000/health" },
    @{ Name = "Auth"; Url = "http://localhost:8001/auth/health" },
    @{ Name = "Channel"; Url = "http://localhost:8002/health" },
    @{ Name = "Trend"; Url = "http://localhost:8003/health" },
    @{ Name = "Strategy"; Url = "http://localhost:8004/health" },
    @{ Name = "Planner"; Url = "http://localhost:8005/health" },
    @{ Name = "Analytics"; Url = "http://localhost:8006/health" },
    @{ Name = "ML"; Url = "http://localhost:8007/health" }
)

$allOk = $true
foreach ($ep in $endpoints) {
    try {
        $r = Invoke-WebRequest -Uri $ep.Url -UseBasicParsing -TimeoutSec 15
        if ($r.StatusCode -eq 200) {
            Write-Host "  [OK] $($ep.Name)" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] $($ep.Name) HTTP $($r.StatusCode)" -ForegroundColor Red
            $allOk = $false
        }
    } catch {
        Write-Host "  [FAIL] $($ep.Name) $($_.Exception.Message)" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
Write-Host "=== Stack URLs ===" -ForegroundColor Cyan
Write-Host "  API Gateway:  http://localhost:8000/v1"
Write-Host "  Postgres:     localhost:5432 (user/pass/db: creatoriq)"
Write-Host "  Redis:        localhost:6379"
Write-Host "  Frontend:     VITE_API_URL=http://localhost:8000/v1"
Write-Host ""
Write-Host "=== Database ===" -ForegroundColor Cyan
Write-Host "  Schema sync:  docker compose --profile db-push run --rm db-push-<service>"
Write-Host "  Fresh DB:     docker compose down -v  (then re-run this script)"
Write-Host "  Skip sync:    .\scripts\docker-up.ps1 -SkipDbPush"
Write-Host "  Prime trends: .\scripts\docker-up.ps1 -PrimeTrends"

if ($allOk) {
    Write-Host ""
    Write-Host "Backend is live." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Some services failed. Run: docker compose logs -f" -ForegroundColor Yellow
}
