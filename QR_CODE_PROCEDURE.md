# 🚀 Procedimento Padronizado: Geração de QR Code após Build

## 📋 Visão Geral
Este procedimento automatiza a criação de QR codes para download do APK após cada build bem-sucedido do RayShopee Android.

## 📦 Pré-requisitos
- Python 3.x instalado
- Pacote `qrcode` instalado: `pip install qrcode[pil]`
- Build do APK concluído com sucesso
- Servidor HTTP rodando na porta 8080

## 🔧 Passo a Passo Automatizado

### 1. Build do APK
```bash
cd RayShopee
./gradlew assembleDebug
```

### 2. Iniciar Servidor HTTP
```bash
python3 serve_apk.py
```

### 3. Gerar QR Code
```bash
python3 generate_qr.py
```

## 📄 Arquivos Necessários

### generate_qr.py
```python
#!/usr/bin/env python3
"""
Gera QR Code para download do APK RayShopee
Uso: python3 generate_qr.py
"""

import qrcode
import os
import socket

def get_local_ip():
    """Obtém o IP local do computador"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def generate_qr():
    # Configurações
    ip = get_local_ip()
    port = 8080
    apk_name = "app-debug.apk"
    
    # URLs
    url = f"http://{ip}:{port}/{apk_name}"
    
    # Criar QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    # Gerar imagem
    img = qr.make_image(fill_color='#0066cc', back_color='white')
    
    # Salvar
    filename = "qrcode_rede.png"
    img.save(filename)
    
    print("=" * 50)
    print("✅ QR Code Gerado com Sucesso!")
    print("=" * 50)
    print(f"📁 Arquivo: {filename}")
    print(f"🔗 URL: {url}")
    print(f"📱 Escaneie com seu celular para baixar o APK")
    print("=" * 50)
    
    return filename, url

if __name__ == "__main__":
    generate_qr()
```

### serve_apk.py
```python
#!/usr/bin/env python3
"""
Servidor HTTP para servir o APK RayShopee
Uso: python3 serve_apk.py
"""

import http.server
import socketserver
import os

PORT = 8080
APK_DIR = "RayShopeeAndroid/app/build/outputs/apk/debug"

os.chdir(APK_DIR)

Handler = http.server.SimpleHTTPRequestHandler
socketserver.TCPServer.allow_reuse_address = True

print("=" * 50)
print("🚀 RayShopee APK Server")
print("=" * 50)
print(f"📁 Servindo: {os.getcwd()}")
print(f"🌐 URL: http://localhost:{PORT}/app-debug.apk")
print("=" * 50)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
```

## 📊 Script Completo: build_and_qr.sh

```bash
#!/bin/bash
# Builda o APK e gera QR Code automaticamente

set -e

echo "🚀 Iniciando build do RayShopee Android..."

# 1. Build
cd RayShopee
./gradlew assembleDebug

echo "✅ Build concluído!"

# 2. Iniciar servidor em background
echo "🚀 Iniciando servidor HTTP..."
python3 serve_apk.py &
SERVER_PID=$!
sleep 3

# 3. Gerar QR Code
echo "📷 Gerando QR Code..."
python3 generate_qr.py

# 4. Abrir página no navegador (opcional)
# xdg-open http://localhost:8080/apk_download.html

echo ""
echo "✅ Tudo pronto!"
echo "📱 Escaneie o QR code com seu celular"
echo "🛑 Pare o servidor com: kill $SERVER_PID"

# Manter servidor rodando
wait $SERVER_PID
```

## 🎯 Uso Rápido

### Opção 1: Manual
```bash
# Build
./gradlew assembleDebug

# Servidor
python3 serve_apk.py &

# QR Code
python3 generate_qr.py
```

### Opção 2: Automatizado
```bash
./build_and_qr.sh
```

### Opção 3: One-liner
```bash
cd RayShopee && ./gradlew assembleDebug && python3 serve_apk.py & sleep 3 && python3 generate_qr.py
```

## 📱 Instalação no Android

1. **Ativar fontes desconhecidas:**
   - Configurações → Segurança → Fontes Desconhecidas (ON)

2. **Baixar APK:**
   - Escaneie o QR code
   - Ou acesse: http://[SEU_IP]:8080/app-debug.apk

3. **Instalar:**
   - Abrir o APK baixado
   - Clicar em "Instalar"
   - Abrir o app

## 🔍 Troubleshooting

### Porta já em uso
```bash
# Linux/Mac
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID [PID] /F
```

### QR Code não funciona
- Verifique se está na mesma rede Wi-Fi
- Teste a URL no navegador do PC primeiro
- Desative firewall temporariamente

### APK não instala
- Ative "Fontes Desconhecidas" nas configurações
- Verifique espaço em disco
- Tente reinstalar (desinstalar versão anterior)

## 📝 Integração com CI/CD

Adicione ao seu pipeline:

```yaml
# Exemplo GitHub Actions
- name: Build APK
  run: ./gradlew assembleDebug

- name: Generate QR Code
  run: |
    cd RayShopee
    python3 serve_apk.py &
    sleep 3
    python3 generate_qr.py

- name: Upload QR Code
  uses: actions/upload-artifact@v3
  with:
    name: qrcode
    path: RayShopee/qrcode_rede.png
```

## 🎨 Personalização

### Cores do QR Code
```python
img = qr.make_image(
    fill_color='#0066cc',  # Azul escuro
    back_color='white'     # Branco
)
```

### Tamanho
```python
qr = qrcode.QRCode(
    box_size=10,  # Tamanho dos pixels (maior = QR maior)
    border=4,     # Margem em pixels
)
```

## 📋 Checklist

- [ ] Build do APK concluído
- [ ] Servidor HTTP rodando na porta 8080
- [ ] QR Code gerado (qrcode_rede.png)
- [ ] IP local verificado
- [ ] Android com fontes desconhecidas ativadas
- [ ] APK instalado com sucesso
- [ ] App funcionando corretamente

## 🚨 Segurança

⚠️ **Atenção:**
- Use apenas em rede local confiável
- Desative o servidor após uso
- Não exponha a porta 8080 para internet
- APK debug não deve ser distribuído publicamente

## 📚 Links Úteis

- [Documentação QR Code Python](https://pypi.org/project/qrcode/)
- [Android Debug Bridge (ADB)](https://developer.android.com/studio/command-line/adb)
- [Gradle Build Commands](https://docs.gradle.org/current/userguide/command_line_interface.html)

## 🔄 Atualizações

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | 2026-05-05 | Procedimento inicial |

---

**💡 Dica:** Adicione este procedimento ao README.md do projeto para fácil acesso pela equipe!
