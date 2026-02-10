@echo off
title Leneda Dashboard (Standalone)
echo.
echo  Starting Leneda Energy Dashboard...
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Node.js is not installed or not in PATH.
    echo  Download from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if frontend is built
if not exist "%~dp0..\custom_components\leneda\frontend\index.html" (
    echo  WARNING: Frontend not built yet.
    echo  Building frontend...
    echo.
    cd /d "%~dp0..\frontend-src"
    call npm install
    call npm run build
    cd /d "%~dp0"
    echo.
)

:: Start server
cd /d "%~dp0"
node server.js

pause
