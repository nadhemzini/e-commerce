# ─── stop-dev.ps1 ─────────────────────────────────────────────────────────────
# Arrête tout le projet :
#   - Tue les processus sur les ports 3000 et 4000
#   - Arrête le container PostgreSQL Docker
# Usage : .\stop-dev.ps1

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Red
Write-Host "  ║     ShopVault — Stopping Dev Env     ║" -ForegroundColor Red
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

# 1. Kill Frontend (port 3000 / 3001)
Write-Host "  [1/3] Stopping Frontend (ports 3000, 3001)..." -ForegroundColor Yellow
@(3000, 3001) | ForEach-Object {
    $proc = (Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
    if ($proc) {
        Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
        Write-Host "        Killed PID $proc on port $_" -ForegroundColor Gray
    }
}

# 2. Kill Backend (port 4000)
Write-Host "  [2/3] Stopping Backend (port 4000)..." -ForegroundColor Yellow
$proc = (Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
if ($proc) {
    Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
    Write-Host "        Killed PID $proc on port 4000" -ForegroundColor Gray
}

# 3. Stop Docker containers
Write-Host "  [3/3] Stopping PostgreSQL (Docker)..." -ForegroundColor Yellow
docker-compose down | Out-Null

Write-Host ""
Write-Host "  ✅ All services stopped." -ForegroundColor Green
Write-Host ""
