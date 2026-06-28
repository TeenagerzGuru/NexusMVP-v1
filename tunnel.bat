@echo off
setlocal
cd /d "%~dp0"

where cloudflared >nul 2>&1
if errorlevel 1 (
    echo [ERROR] cloudflared tidak dijumpai. Install dari https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    pause
    exit /b 1
)

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [1/2] Starting Next.js dev server...
    start "NexusMVP Dev" cmd /k pushd "%~dp0" ^&^& npm run dev
    echo       Tunggu dev server ready...
    timeout /t 6 /nobreak >nul
) else (
    echo [OK] Dev server dah jalan pada port 3000
)

echo.
echo [2/2] Starting Cloudflare Tunnel...
echo       URL public akan muncul bawah (cari *.trycloudflare.com)
echo       Tekan Ctrl+C untuk hentikan tunnel
echo.

cloudflared tunnel --url http://localhost:3000

pause
