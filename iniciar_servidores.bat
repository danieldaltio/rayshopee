@echo off
title RayShopee - Inicializador de Servidores
color 0B

echo ==========================================================
echo           RAYSHOPEE / SCANADDPRODUTOS
echo ==========================================================
echo.
echo [INFO] Iniciando servidores do ecossistema...
echo.

REM Verificar se o Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado! Por favor, instale o Node.js antes de continuar.
    pause
    exit /b 1
)

REM Mudar para o diretorio do script
cd /d "%~dp0"

echo [INFO] Verificando dependencias no projeto...
call npm install --no-audit --no-fund

echo.
echo ==========================================================
echo  Painel Web:   http://localhost:5173
echo  API Local:    http://localhost:3003
echo  Tunel Ngrok:  https://unpaining-transcriptionally-patrick.ngrok-free.dev
echo ==========================================================
echo.
echo [SUCESSO] Iniciando o servidor... (Pressione Ctrl+C para encerrar)
echo.

call npm run dev

pause
