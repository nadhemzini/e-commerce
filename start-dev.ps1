# ─── start-dev.ps1 ────────────────────────────────────────────────────────────
# Lance tout le projet en développement local :
#   - PostgreSQL via Docker Compose
#   - Backend Express  → http://localhost:4000
#   - Frontend Next.js → http://localhost:3000
# Usage : .\start-dev.ps1

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║     ShopVault — Starting Dev Env     ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Free ports if already in use
Write-Host "  [1/4] Freeing ports 3000 & 4000..." -ForegroundColor Yellow
@(3000, 3001, 4000) | ForEach-Object {
    $proc = (Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
    if ($proc) { Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue }
}

# 2. Start PostgreSQL
Write-Host "  [2/4] Starting PostgreSQL (Docker)..." -ForegroundColor Yellow
docker-compose up -d postgres | Out-Null
Start-Sleep -Seconds 3

# 3. Start Backend in a new window
Write-Host "  [3/4] Starting Backend  → http://localhost:4000" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"Set-Location '$Root\backend'; Write-Host 'Backend — http://localhost:4000' -ForegroundColor Green; npm run dev`""

Start-Sleep -Seconds 2

# 4. Start Frontend in a new window
Write-Host "  [4/4] Starting Frontend → http://localhost:3000" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"Set-Location '$Root\frontend'; Write-Host 'Frontend — http://localhost:3000' -ForegroundColor Green; npm run dev`""

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "  ✅ All services started!" -ForegroundColor Green
Write-Host "     Frontend : http://localhost:3000" -ForegroundColor Cyan
Write-Host "     Backend  : http://localhost:4000" -ForegroundColor Cyan
Write-Host "     Database : localhost:5432"         -ForegroundColor Cyan
Write-Host ""
Write-Host "  👉 Run .\stop-dev.ps1 to stop everything." -ForegroundColor Gray
Write-Host ""

# Open browser
Start-Process "http://localhost:3000"
