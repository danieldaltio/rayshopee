while ($true) {
    Write-Host "Iniciando Localtunnel..."
    npx localtunnel --port 3003 --subdomain rayshopeemobile99
    Write-Host "Localtunnel caiu! Reiniciando em 2 segundos..."
    Start-Sleep -Seconds 2
}
