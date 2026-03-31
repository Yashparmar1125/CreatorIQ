# CreatorIQ Microservices Runner (Development)
# This script starts all backend microservices in separate background processes.

$Services = @(
    @{ Name = "API Gateway"; Dir = "api-gateway"; Port = 8000 },
    @{ Name = "Auth"; Dir = "auth"; Port = 8001 },
    @{ Name = "Channel"; Dir = "channel"; Port = 8002 },
    @{ Name = "Trend"; Dir = "trend"; Port = 8003 },
    @{ Name = "Strategy"; Dir = "strategy"; Port = 8004 },
    @{ Name = "ML"; Dir = "ml"; Port = 8007 }
)

Write-Host "--- CreatorIQ Service Runner ---" -ForegroundColor Cyan
Write-Host "Starting 8 services..." -ForegroundColor Green

foreach ($Service in $Services) {
    $Path = "services/$($Service.Dir)"
    Write-Host "[+] Launching $($Service.Name) on port $($Service.Port)..."
    
    # Start uvicorn in a new background process
    # We use -NoNewWindow to keep output in this shell, or we can use Start-Process for separate windows.
    # For dev, separate windows is often better to see logs.
    Start-Process powershell -ArgumentList "-NoExit -Command `"cd $Path; uvicorn app.main:app --host 127.0.0.1 --port $($Service.Port) --reload`"" -WindowStyle Normal
}

Write-Host "`nAll services have been launched in separate windows." -ForegroundColor green
Write-Host "Press any key to exit this runner (services will keep running)."
Read-Host
