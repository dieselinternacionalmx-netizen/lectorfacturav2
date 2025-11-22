@echo off
echo ========================================
echo   LECTOR DE FACTURAS - INICIANDO...
echo ========================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no está instalado.
    echo Por favor instala Node.js desde: https://nodejs.org
    pause
    exit /b 1
)

REM Verificar si las dependencias están instaladas
if not exist "server\node_modules" (
    echo.
    echo [!] NO SE ENCONTRARON LAS DEPENDENCIAS DEL SERVIDOR
    echo.
    echo Parece que es la primera vez que ejecutas el sistema o lo moviste de carpeta.
    echo Por favor ejecuta el archivo: REINSTALAR_DEPENDENCIAS.bat
    echo.
    pause
    exit /b 1
)


echo [1/3] Iniciando servidor backend...
start "Backend - Lector Facturas" cmd /k "cd /d "%~dp0" && node server/index.js"
timeout /t 3 /nobreak >nul

echo [2/3] Iniciando interfaz frontend...
start "Frontend - Lector Facturas" cmd /k "cd /d "%~dp0client" && npm run dev"
timeout /t 8 /nobreak >nul

echo [3/3] Abriendo navegador...
start http://localhost:5173

echo.
echo ========================================
echo   SISTEMA INICIADO CORRECTAMENTE
echo ========================================
echo.
echo El sistema se ha abierto en tu navegador.
echo.
echo IMPORTANTE:
echo - NO cierres las ventanas negras (terminales)
echo - Para detener el sistema, cierra todas las ventanas
echo.
pause
