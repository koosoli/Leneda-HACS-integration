@echo off
cd /d "%~dp0"

echo ====================================
echo   Leneda Dashboard - Local Dev
echo ====================================
echo.

:: Cleanup stale node processes on our port
echo [INFO] Checking for processes on port 5175...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5175 ^| findstr LISTENING 2^>nul') do (
    echo [INFO] Killing PID %%a on port 5175...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
)

echo.
echo [INFO] Starting Vite dev server on Port 5175...
echo [INFO] Browser will open automatically once connected...
echo.

:: Smart Launcher: wait for port 5175 then open browser
start "" /B powershell -NoProfile -Command "$port=5175; $tcp = New-Object System.Net.Sockets.TcpClient; $start = Get-Date; while (-not $tcp.Connected) { try { $tcp.Connect('localhost', $port) } catch { Start-Sleep -Milliseconds 250 } if (((Get-Date) - $start).TotalSeconds -gt 30) { Write-Host '[WARN] Timeout waiting for server'; exit } }; $tcp.Close(); Start-Process 'http://localhost:5175/'"

call npm run dev
