# RayShopee Project Summary

## SYSTEM STATUS (Last Updated: $(date))

### ✅ WORKING COMPONENTS
1. **Backend Server**
   - Node.js/Express server starts successfully
   - Shopee API authentication configured and working
   - Token refresh mechanism operational
   - Health check endpoint: `http://192.168.15.10:3001/api/health` returns configured=true
   - Listening on 0.0.0.0:3001 (all interfaces)
   - Windows Firewall rule for port 3001 added ✓

2. **Development Tools**
   - Vite dev server available (`npm run dev` or `vite`)
   - Gradle wrapper functional
   - Node dependencies installed

### ⚠️ PENDING RESOLUTION (JVM VERSION)
1. **JVM Target Mismatch**
   - Java compileOptions set to VERSION_17
   - Kotlin compilerOptions set to VERSION_25
   - Build fails with: "Inconsistent JVM targets between Java and Kotlin compile tasks: 17 and 25"
   - **Requirement**: Maintain Java 25 version as requested
   - **Solution Needed**: Install JDK 25 and update both to VERSION_25

### 📁 PROJECT STRUCTURE
```
RayShopee/
├── docs/                     # Spec, sprint, PRD documents (moved for preservation)
├── server/                   # Backend (Node.js/Express)
│   ├── index.js              # Main server
│   └── certs/                # SSL certs
├── RayShopeeAndroid/         # Native Android app (Kotlin/Compose)
│   └── app/build/outputs/apk/debug/app-debug.apk  # NEEDS REBUILD w/ Java 25
├── RayShopeeMobile/          # Expo/React Native app
├── mobile-app/               # React Native alternative
└── vite.config.js            # Web dev server config
```

### 🔧 TECH STACK
**Android App:**
- Kotlin, Jetpack Compose, CameraX, ML Kit, Hilt, Retrofit, Room

**Backend:**
- Node.js, Express, Supabase, node-fetch, dotenv, selfsigned

**Web Dev:**
- Vite, React 18, @vitejs/plugin-basic-ssl

### 🐛 RECENT FIXES APPLIED
- **Barcode Scanner Fix**: In `ScannerScreen.kt`:
  - Added `.trim()` to barcode value
  - Changed condition from `barcode.isNotEmpty()` to `barcode.isNotBlank()`
  - Better handles whitespace and empty values from ML Kit

### 🚨 PRIORITY ACTIONS (NEXT TIME)
1. Install JDK 25 (requires administrator)
2. Update JAVA_HOME to point to JDK 25 installation
3. Update both `compileOptions` and `kotlin.compilerOptions` to VERSION_25
4. Rebuild APK: `./gradlew.bat assembleDebug`
5. Install APK and test barcode scanner end-to-end

### 📝 RECENT CHANGES
- Fixed barcode scanner whitespace handling
- Moved spec/sprint/prd to docs/ for preservation
- Cleaned up unnecessary files (gradle.zip, gradle-9.5.0/, temp files)
- Created PROJECT_SUMMARY.md, NETWORK_DEBUG_GUIDE.md
- Verified backend is running and accessible
- Windows Firewall rule added for port 3001