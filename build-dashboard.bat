@echo off
cd /d "%~dp0frontend-src"
echo "===================================="
echo "  Leneda Dashboard - Build & Sync"
echo "===================================="
echo [INFO] Installing dependencies (if needed)...
call npm install --no-fund --no-audit
echo.
echo [INFO] Building Leneda Dashboard...
call npm run build
echo.
echo [SUCCESS] Dashboard built and synced to custom_components/leneda/frontend/
echo [TIP] Remember to Hard Refresh (Ctrl+F5) in Home Assistant to see changes.
echo.
pause
