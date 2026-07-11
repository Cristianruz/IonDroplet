@echo off
color 0A
echo ===================================================
echo     Iniciando el Sistema Completo IonDroplet
echo ===================================================
echo.

echo 1. Iniciando Servidor Backend (Node.js)...
start "IonDroplet - Backend" cmd /k "cd /d "%~dp0iondroplet-backend" && node server.js"

echo 2. Iniciando Aplicacion Web (Next.js)...
start "IonDroplet - Frontend" cmd /k "cd /d "%~dp0IonDroplet-Front" && npm run dev"

echo.
echo Todo esta corriendo. Revisa las dos ventanas que se abrieron.
echo Puedes cerrar esta ventana.
pause > nul
