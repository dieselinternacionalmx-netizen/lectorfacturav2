@echo off
echo ========================================
echo   REINSTALACION DE DEPENDENCIAS
echo ========================================
echo.
echo Este script borrara las carpetas node_modules y las volvera a instalar.
echo Esto es necesario si moviste la carpeta a otra computadora.
echo.
echo IMPORTANTE: Necesitas internet para este paso.
echo.
pause

echo.
echo [1/4] Limpiando dependencias antiguas...
if exist "server\node_modules" rmdir /s /q "server\node_modules"
if exist "client\node_modules" rmdir /s /q "client\node_modules"

echo.
echo [2/4] Instalando dependencias del Servidor...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo la instalacion del servidor.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/4] Instalando dependencias del Cliente...
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo la instalacion del cliente.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   INSTALACION COMPLETADA
echo ========================================
echo.
echo Ahora puedes ejecutar INICIAR_SISTEMA.bat
echo.
pause
