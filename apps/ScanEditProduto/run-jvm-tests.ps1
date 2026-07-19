# =========================================================================
# ScanEditProduto — Run JVM tests (T2.7 do sprint.md)
# Adicionado em 2026-07-18 (P6 / Sprint 2).
#
# Roda ./gradlew testDebugUnitTest e mostra o relatório HTML.
# Mesmo padrão do apps/PedidosEditProduto/run-jvm-tests.ps1.
# =========================================================================

$ErrorActionPreference = "Stop"

Write-Host "==> Rodando testDebugUnitTest..." -ForegroundColor Cyan
& .\gradlew.bat testDebugUnitTest
if ($LASTEXITCODE -ne 0) {
    Write-Host "==> ❌ Testes falharam. Veja o relatório:" -ForegroundColor Red
    Write-Host "    app/build/reports/tests/testDebugUnitTest/index.html" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==> ✅ Testes passaram!" -ForegroundColor Green
Write-Host "==> Relatório HTML:" -ForegroundColor Cyan
$reportPath = Join-Path $PSScriptRoot "app\build\reports\tests\testDebugUnitTest\index.html"
if (Test-Path $reportPath) {
    $absPath = (Resolve-Path $reportPath).Path
    Write-Host "    $absPath" -ForegroundColor Yellow
    # Abre no navegador padrão
    Start-Process $absPath
} else {
    Write-Host "    (relatório não encontrado — verifique o output acima)" -ForegroundColor Yellow
}
