# 🚀 QR Code Generation After Build

Automated QR code generation for RayShopee Android APK distribution.

## Quick Start

### One Command
```bash
# Build and generate QR code
./gradlew assembleDebug && python3 generate_qr.py
```

### Full Process
```bash
# 1. Build
./gradlew assembleDebug

# 2. Start HTTP server
python3 serve_apk.py &

# 3. Generate QR code
python3 generate_qr.py

# 4. Scan and install on your phone!
```

## Files

| File | Description |
|------|-------------|
| `generate_qr.py` | Generates QR code |
| `serve_apk.py` | HTTP server for APK |
| `qrcode_rede.png` | Generated QR code |
| `apk_download.html` | Web page with QR code |

## Installation

### Android 16

1. **Enable Unknown Sources:**
   - Settings → Security → Install unknown apps
   - Enable for your browser

2. **Scan QR Code:**
   - Open `qrcode_rede.png`
   - Scan with phone camera
   - Download and install APK

### Requirements

- Python 3.x
- `pip install qrcode[pil]`
- Same Wi-Fi network (phone & computer)

## Scripts

### generate_qr.py

Generates QR code with local IP address.

```bash
python3 generate_qr.py
```

Output:
```
==================================================
QR Code Generated Successfully!
==================================================
File: qrcode_rede.png
URL: http://192.168.15.9:8080/app-debug.apk
==================================================
```

### serve_apk.py

Serves APK via HTTP.

```bash
python3 serve_apk.py
```

Output:
```
==================================================
RayShopee APK Server
==================================================
Serving files from: .../apk/debug
URL: http://localhost:8080/app-debug.apk
==================================================
```

## Troubleshooting

### Connection Refused

```bash
# Start server first
python3 serve_apk.py &

# Check IP
hostname -I  # Linux
ipconfig     # Windows
```

### QR Code Not Working

- Verify server is running
- Check phone and computer on same network
- Test URL in browser first

### APK Won't Install

- Enable "Unknown Sources" in settings
- Uninstall old version first
- Check storage space

## CI/CD Integration

### GitHub Actions

```yaml
- name: Generate QR Code
  run: |
    pip install qrcode[pil]
    python3 generate_qr.py

- name: Upload QR Code
  uses: actions/upload-artifact@v3
  with:
    name: qrcode
    path: qrcode_rede.png
```

## Security

⚠️ **Important:**
- Use only on trusted networks
- Debug APKs contain sensitive info
- Don't expose port 8080 to internet
- Use firewall to restrict access

## License

Apache 2.0 - Same as RayShopeeAndroid project
