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
    port = 8081
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
    print("QR Code Gerado com Sucesso!")
    print("=" * 50)
    print(f"Arquivo: {filename}")
    print(f"URL: {url}")
    print(f"Escaneie com seu celular para baixar o APK")
    print("=" * 50)
    
    return filename, url

if __name__ == "__main__":
    generate_qr()
