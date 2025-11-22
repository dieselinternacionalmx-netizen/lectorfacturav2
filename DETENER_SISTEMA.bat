@echo off
echo Deteniendo el sistema...

REM Matar procesos de Node.js relacionados con el proyecto
taskkill /F /FI "WINDOWTITLE eq Backend - Lector Facturas*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend - Lector Facturas*" >nul 2>&1

echo Sistema detenido.
timeout /t 2 /nobreak >nul
