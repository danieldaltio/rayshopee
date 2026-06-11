#!/bin/bash
# install_apk.sh - Script de instalação fácil para RayShopee Android
# Uso: ./install_apk.sh

set -e

echo "=========================================="
echo "  🚀 RayShopee Android - Instalação"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "apps/ScanEditProduto/app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "⚠️  APK não encontrado!"
    echo "Executando build..."
    cd RayShopee
    ./gradlew assembleDebug
    cd ..
fi

# Iniciar servidor
echo "🚀 Iniciando servidor HTTP..."
cd RayShopee
python3 serve_apk.py &
SERVER_PID=$!
sleep 3

# Verificar servidor
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/app-debug.apk | grep -q "200"; then
    echo "✅ Servidor rodando!"
else
    echo "❌ Servidor falhou ao iniciar"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Gerar QR Code
echo "📷 Gerando QR Code..."
python3 generate_qr.py

# Mostrar informações
echo ""
echo "=========================================="
echo "  ✅ Tudo pronto!"
echo "=========================================="
echo ""
echo "📱 Para instalar no Android:"
echo ""
echo "   1. Abra qrcode_rede.png"
echo "   2. Escaneie com seu celular"
echo "   3. Baixe o APK"
echo "   4. Instale"
echo ""
echo "🌐 Ou acesse:"
echo "   http://localhost:8080/app-debug.apk"
echo ""
echo "🛑 Pare o servidor com:"
echo "   kill $SERVER_PID"
echo "=========================================="

# Manter servidor rodando
wait $SERVER_PID
