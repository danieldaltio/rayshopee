import qrcode
import os

base = r"C:\Ubuntu\root\Projeto-OpenClaw-Docker\RayShopee"

apk_path = base + r"\RayShopeeAndroid\app\build\outputs\apk\debug\app-debug.apk"

print(f"APK: {apk_path}")
print(f"Exists: {os.path.exists(apk_path)}")
print(f"Size: {os.path.getsize(apk_path) / 1024 / 1024:.2f} MB")

url = "https://rayshopeeapi-0ts7mvyr.b4a.run"
qr = qrcode.QRCode(box_size=10, border=4)
qr.add_data(url)
qr.make(fit=True)
img = qr.make_image(fill_color="black", back_color="white")
img.save(base + r"\api-qrcode.png")

print(f"QR for API: {url}")
print(f"Saved to: {base}\\api-qrcode.png")
print("Done!")
