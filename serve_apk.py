#!/usr/bin/env python3
"""
Servidor HTTP simples para servir o APK do RayShopee

Uso:
    python3 serve_apk.py

O servidor ficará disponível em:
    http://localhost:8080/app-debug.apk

Para baixar o APK no celular:
1. Escaneie o QR code (qrcode.png)
2. Ou acesse a URL acima no navegador
"""

import http.server
import socketserver
import os

# Configuração
PORT = 8080
APK_DIR = "apps/ScanEditProduto/app/build/outputs/apk/debug"

# Mudar para o diretório do APK
os.chdir(APK_DIR)

# Configurar handler
Handler = http.server.SimpleHTTPRequestHandler

# Permitir reuso do endereço
socketserver.TCPServer.allow_reuse_address = True

print("=" * 50)
print("🚀 RayShopee APK Server")
print("=" * 50)
print(f"📁 Servindo arquivos de: {os.getcwd()}")
print(f"🌐 URL do APK: http://localhost:{PORT}/app-debug.apk")
print(f"📱 QR Code: qrcode.png")
print("=" * 50)
print()
print("Pressione Ctrl+C para parar o servidor")
print()

# Iniciar servidor
try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n🛑 Servidor parado")
except Exception as e:
    print(f"\n❌ Erro: {e}")
