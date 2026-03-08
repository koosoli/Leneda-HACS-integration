@echo off
cd /d "%~dp0"

set "DEV_PORT=5175"
set "DEV_URL=http://localhost:%DEV_PORT%/"

echo ====================================
echo   Leneda Dashboard - Local Dev
echo ====================================
echo.

:: Aggressive cleanup to avoid stale background node/vite processes
echo [INFO] Killing old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Leneda Dashboard*" >nul 2>&1
timeout /t 1 /nobreak >nul

if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 exit /b 1
)

echo.
echo [INFO] Starting Vite dev server on %DEV_URL%
echo [INFO] Browser will open automatically when the dashboard is ready.
echo.

:: Smart launcher: wait for the dev server, then open the browser
start "" /B powershell -NoProfile -Command "$port=%DEV_PORT%; $tcp = New-Object System.Net.Sockets.TcpClient; $start = Get-Date; while (-not $tcp.Connected) { try { $tcp.Connect('localhost', $port) } catch { Start-Sleep -Milliseconds 250 } if (((Get-Date) - $start).TotalSeconds -gt 30) { exit } }; $tcp.Close(); Start-Process '%DEV_URL%'"

call npm run dev
