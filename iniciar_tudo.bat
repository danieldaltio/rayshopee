@echo off
title RayShopee - Iniciar TUDO
color 0B

echo ==========================================================
echo       RAYSHOPEE - INICIALIZADOR DE TODOS OS SERVICOS
echo ==========================================================
echo.

REM Verificar se o Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado! Instale antes de continuar.
    pause
    exit /b 1
)

REM Diretorio base
cd /d "%~dp0"

echo [INFO] Diretorio base: %cd%
echo.

echo ==========================================================
echo  Servicos que serao iniciados:
echo.
echo  1. RayHub ERP (Web :3000 + API :3001)
echo  2. Legacy Server (:3003) + Web Dashboard (:5173) + Ngrok
echo ==========================================================
echo.

REM ---- 1. RayHub ERP (Turbo: api + web) ----
echo [1/2] Iniciando RayHub ERP (Next.js :3000 + NestJS :3001)...
start "RayHub ERP" cmd /k "cd /d %~dp0apps\RayHub && npm run dev"

REM Pequeno delay para nao sobrecarregar
timeout /t 3 /nobreak >nul

REM ---- 2. Legacy Server + Web + Tunnel ----
echo [2/2] Iniciando Legacy Server (:3003) + Dashboard (:5173) + Ngrok...
start "RayShopee Legacy" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ==========================================================
echo  TODOS OS SERVICOS INICIADOS!
echo.
echo  RayHub Web (ERP):     http://localhost:3000
echo  RayHub API:           http://localhost:3001
echo  Legacy API:           http://localhost:3003
echo  Legacy Dashboard:     http://localhost:5173
echo  Ngrok Tunnel:         https://unpaining-transcriptionally-patrick.ngrok-free.dev
echo ==========================================================
echo.
echo  Cada servico esta rodando em uma janela separada.
echo  Feche as janelas individuais para parar cada servico.
echo.
pause
