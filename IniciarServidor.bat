@echo off
title Iniciando Sistema de Cotizaciones
echo ==========================================
echo    INICIANDO SERVIDOR DE COTIZACIONES
echo ==========================================
echo.
echo 1. Accediendo al directorio...
cd /d "c:\Users\LENOVO\Documents\WEB DE cotizaciones"

echo 2. Iniciando servidor (Next.js)...
echo.
echo    [TIP] Deja esta ventana abierta mientras usas la aplicacion.
echo    [TIP] Para cerrar el servidor, cierra esta ventana.
echo.

:: Intenta abrir el navegador despues de 5 segundos
start /b cmd /c "timeout /t 5 >nul && start http://localhost:3000"

:: Ejecuta el servidor
npm run dev

pause
