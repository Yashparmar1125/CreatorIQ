# Build and start the full CreatorIQ backend stack in Docker.
$ErrorActionPreference = "Stop"
$BackendRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

# Docker Desktop is not always on PATH in PowerShell (e.g. Cursor terminal).
$dockerBin = Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\resources\bin"
if ((Test-Path $dockerBin) -and ($env:PATH -notlike "*$dockerBin*")) {
    $env:PATH = "$dockerBin;$env:PATH"
}

Set-Location $BackendRoot

Write-Host ""
Write-Host "=== CreatorIQ Docker Backend ===" -ForegroundColor Cyan

# 1. JWT keys
& (Join-Path $PSScriptRoot "generate-jwt-keys.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 2. Check .env exists
if (-not (Test-Path ".env")) {
    Write-Host "No .env found - copying from .env.example" -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Edit backend/.env with your API keys" -ForegroundColor Yellow
}

# 3. Build images
Write-Host ""
Write-Host "Building Docker images..." -ForegroundColor Cyan
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

# 5. Sync database schema (no Alembic)
Write-Host ""
Write-Host "Syncing database schema (db push)..." -ForegroundColor Cyan
$services = @("auth", "channel", "trend", "strategy", "planner", "analytics")
foreach ($svc in $services) {
    Write-Host "  -> db-push-$svc" -ForegroundColor Gray
    docker compose --profile db-push run --rm "db-push-$svc"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Schema sync failed for $svc"
        exit $LASTEXITCODE
    }
}

# 6. Start all services
Write-Host ""
Write-Host "Starting all microservices..." -ForegroundColor Cyan
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Start-Sleep -Seconds 8

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

if ($allOk) {
    Write-Host ""
    Write-Host "Backend is live." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Some services failed. Run: docker compose logs -f" -ForegroundColor Yellow
}
