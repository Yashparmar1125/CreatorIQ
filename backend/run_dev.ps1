$Services = @(
    @{ Name = "API Gateway"; Dir = "api-gateway"; Port = 8000 },
    @{ Name = "Auth"; Dir = "auth"; Port = 8001 },
    @{ Name = "Channel"; Dir = "channel"; Port = 8002 },
    @{ Name = "Trend"; Dir = "trend"; Port = 8003 },
    @{ Name = "Strategy"; Dir = "strategy"; Port = 8004 },
    @{ Name = "Planner"; Dir = "planner"; Port = 8005 },
    @{ Name = "Analytics"; Dir = "analytics"; Port = 8006 },
    @{ Name = "ML"; Dir = "ml"; Port = 8007 }
)

$EnvName = "base"

Write-Host "--- CreatorIQ Service Runner (Conda) ---" -ForegroundColor Cyan

foreach ($Service in $Services) {
    $Path = "services/$($Service.Dir)"

    Write-Host "[+] Launching $($Service.Name)..."

    Start-Process powershell -ArgumentList "-NoExit -Command `"cd $Path; conda activate $EnvName; uvicorn app.main:app --host 127.0.0.1 --port $($Service.Port) --reload`""
}