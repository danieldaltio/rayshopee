# Network Connectivity Debug Guide

## CURRENT STATUS (as of $(date -u))
✅ Backend Server: Running on 0.0.0.0:3001
✅ Health Check: http://192.168.15.10:3001/api/health returns 200 OK
✅ Local Access: PC can reach itself at 192.168.15.10:3001
❓ Unknown: Android device (192.168.15.8) → PC (192.168.15.10:3001)

## ERROR MESSAGE FROM APP
```
failed to connect to /192.168.15.10 (port 3001) from /192.168.15.8(port 42414) after 30000ms
```

## DIAGNOSIS STEPS (ANDROID DEVICE)

### 1. TEST BASIC CONNECTIVITY
On your Android device, open Chrome/Browser and visit:
```
http://192.168.15.10:3001/api/health
```
- If you see JSON response: ✅ Network OK, issue is app-specific
- If timeout/error: ❌ Network connectivity problem

### 2. CHECK SAME NETWORK
Ensure both devices are on the SAME Wi-Fi network:
- PC IP: 192.168.15.10 (from ipconfig)
- Device IP: 192.168.15.8 (from error message)
- Both should share 192.168.15.x subnet

### 3. WINDOWS FIREWALL CHECK
On PC (Windows):
1. Windows Security → Firewall & network protection
2. Advanced settings → Inbound Rules
3. Look for or create rule:
   - Port: 3001
   - Protocol: TCP
   - Action: Allow the connection
   - Profile: Domain, Private, Public (as needed)
   - Name: RayShopee Backend

### 4. ALTERNATIVE TEST METHODS
From Android device, try:
- Ping test (requires terminal app): `ping 192.168.15.10`
- Port scan (requires network utility app): Check if port 3001 is open
- Use PC's hostname instead of IP: `http://[PC-NAME]:3001/api/health`

### 5. TEMPORARY WORKAROUNDS
If firewall/router settings can't be changed immediately:
- Connect Android device to PC's mobile hotspot (uses different network)
- Use USB reverse tethering (advanced)
- Test on different Wi-Fi network

## IF STILL NOT WORKING
Check if backend is actually bound to correct interface:
On PC, verify with:
```
netstat -ano | findstr :3001
```
Should show: `0.0.0.0:3001` (means all interfaces) NOT `127.0.0.1:3001` (localhost only)

## PERSISTENT SOLUTION
Once working, consider:
1. Documenting the exact firewall/router fix that worked
2. Adding network retry logic to app for better UX
3. Creating a setup script that configures firewall automatically

---
Last updated: $(date -u)
This guide helps resolve the most common issue: Android device cannot reach PC backend due to network isolation/firewall.