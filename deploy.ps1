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

# 2. SSH command prefix
$sshCmd = "ssh -i $IdentityFile -o StrictHostKeyChecking=accept-new $VmUser@$VmHost"
$scpCmd = "scp -i $IdentityFile -o StrictHostKeyChecking=accept-new"

# 3. Create directories on the VM if they don't exist
Write-Host "Ensuring directories exist on VM..."
Invoke-Expression "$sshCmd `"mkdir -p ~/CreatorIQ/backend/secrets`""

# 4. Copy secrets to the VM
Write-Host "Copying secrets to VM..."
Invoke-Expression "$scpCmd .\backend\.env.production ${VmUser}@${VmHost}:~/CreatorIQ/backend/.env"
Invoke-Expression "$scpCmd .\backend\secrets\jwt_private.pem ${VmUser}@${VmHost}:~/CreatorIQ/backend/secrets/"
Invoke-Expression "$scpCmd .\backend\secrets\jwt_public.pem ${VmUser}@${VmHost}:~/CreatorIQ/backend/secrets/"

# 5. Execute the deployment script on the VM
$deployScript = @"
cd ~/CreatorIQ || { echo 'Repo not found. Clone it first!'; exit 1; }
git fetch --all
git reset --hard origin/main
cd backend
chmod 600 secrets/*.pem
docker compose down
docker compose up -d --build
docker image prune -f
docker compose --profile migrate run --rm migrate-auth
docker compose --profile migrate run --rm migrate-channel
docker compose --profile migrate run --rm migrate-trend
docker compose --profile migrate run --rm migrate-strategy
docker compose --profile migrate run --rm migrate-planner
docker compose --profile migrate run --rm migrate-analytics
"@

Write-Host "Running deployment commands on VM..."
$encodedScript = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($deployScript))
Invoke-Expression "$sshCmd `"echo $encodedScript | base64 --decode | bash`""

Write-Host "Deployment completed successfully!" -ForegroundColor Green
