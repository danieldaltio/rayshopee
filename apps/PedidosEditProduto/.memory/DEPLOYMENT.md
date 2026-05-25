# 🚀 Deployment Guide - RayShopeeAndroid

## 📋 Sumário

- [1. Build Types](#1-build-types)
- [2. Configuração](#2-configuração)
- [3. Processo de Build](#3-processo-de-build)
- [4. Assinatura](#4-assinatura)
- [5. Deploy](#5-deploy)
- [6. Monitoramento](#6-monitoramento)
- [7. Troubleshooting](#7-troubleshooting)

---

## 1. 🏗️ Build Types

### Configurados

```kotlin
// build.gradle.kts
buildTypes {
    release {
        isMinifyEnabled = true
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
        signingConfig = signingConfigs.getByName("debug")
    }
    debug {
        isMinifyEnabled = false
    }
}
```

### Variantes

| Variante | Minify | ProGuard | Assinatura | Uso |
|----------|--------|----------|------------|-----|
| `debug` | ❌ | ❌ | Debug | Desenvolvimento |
| `release` | ✅ | ✅ | Debug* | Produção |

> *Nota: Configurar assinatura release antes do deploy

---

## 2. ⚙️ Configuração

### BuildConfig

Campos gerados automaticamente:

```java
BuildConfig.SUPABASE_BASE_URL        // "https://xcvazbfjkiddzlxwynni.supabase.co"
BuildConfig.SHOPEE_API_BASE_URL      // "https://rayshopeeapi-8ivucqzy.b4a.run"
BuildConfig.APPLICATION_ID           // "com.rayshopee.app"
BuildConfig.VERSION_CODE             // 2
BuildConfig.VERSION_NAME             // "1.0.1"
BuildConfig.DEBUG                    // true/false
```

### Variáveis de Ambiente

```bash
# .env (não commitado)
SUPABASE_API_KEY=sb_publishable_...
SHOPEE_PARTNER_ID=...
SHOPEE_PARTNER_KEY=...
SHOPEE_ACCESS_TOKEN=...
SHOPEE_REFRESH_TOKEN=...
```

### Configuração por Build Variant

```kotlin
// build.gradle.kts
buildTypes {
    create("staging") {
        buildConfigField("String", "SUPABASE_BASE_URL", "\"https://staging.supabase.co\"")
    }
}
```

---

## 3. 🔨 Processo de Build

### Build Debug

```bash
# Compilar APK debug
./gradlew assembleDebug

# Resultado: app/build/outputs/apk/debug/app-debug.apk
```

### Build Release

```bash
# Compilar APK release
./gradlew assembleRelease

# Resultado: app/build/outputs/apk/release/app-release.apk
```

### Build Bundle (AAB)

```bash
# Compilar App Bundle
./gradlew bundleRelease

# Resultado: app/build/outputs/bundle/release/app-release.aab
```

### Build All

```bash
# Compilar todas variantes
./gradlew assemble

# Limpar e compilar
./gradlew clean assembleDebug
```

---

## 4. 🔐 Assinatura

### Configuração Atual

```kotlin
// build.gradle.kts
signingConfigs {
    create("debug") {
        storeFile = file("debug.keystore")
        storePassword = "android"
        keyAlias = "androiddebugkey"
        keyPassword = "android"
    }
}

buildTypes {
    release {
        signingConfig = signingConfigs.getByName("debug")
    }
}
```

### Configuração Release (Necessário)

```kotlin
// 1. Criar keystore
keytool -genkey -v -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

// 2. Configurar no build.gradle.kts
signingConfigs {
    create("release") {
        storeFile = file("my-release-key.keystore")
        storePassword = System.getenv("KEYSTORE_PASSWORD")
        keyAlias = "my-key-alias"
        keyPassword = System.getenv("KEY_PASSWORD")
    }
}

buildTypes {
    release {
        signingConfig = signingConfigs.getByName("release")
    }
}
```

### CI/CD (GitHub Actions)

```yaml
- name: Sign APK
  uses: r0adkll/sign-android-release@v1
  with:
    releaseDirectory: app/build/outputs/apk/release
    signingKeyBase64: ${{ secrets.SIGNING_KEY }}
    alias: ${{ secrets.KEY_ALIAS }}
    keyStorePassword: ${{ secrets.KEY_STORE_PASSWORD }}
    keyPassword: ${{ secrets.KEY_PASSWORD }}
```

---

## 5. 🚀 Deploy

### Google Play Console

#### Via AAB (Recomendado)

1. Buildar bundle:
   ```bash
   ./gradlew bundleRelease
   ```

2. Upload `app-release.aab` no Play Console

3. Configurar tracks:
   - Internal testing
   - Closed testing
   - Open testing
   - Production

#### Via APK

1. Buildar APK:
   ```bash
   ./gradlew assembleRelease
   ```

2. Upload `app-release.apk`

3. Configurar device targeting

### Firebase App Distribution

```bash
# Instalar plugin
./gradlew appDistributionUploadRelease
```

### Deploy Local

```bash
# Instalar no device/emulator
adb install app-debug.apk

# Ou via Android Studio
Run ▶️
```

---

## 6. 📊 Monitoramento

### Crashlytics (Futuro)

```gradle
// build.gradle.kts
plugins {
    id("com.google.firebase.crashlytics")
}
```

### Logs

```kotlin
// Debug
Log.d("RayShopee", "Evento")

// Release (remover)
if (BuildConfig.DEBUG) {
    Log.d("RayShopee", "Debug info")
}
```

### Analytics (Futuro)

```kotlin
// Firebase Analytics
Firebase.analytics.logEvent("screen_view") {
    param("screen_name", "ScannerScreen")
}
```

---

## 7. 🔧 Troubleshooting

### Erro: `Keystore not found`

**Solução:**
```bash
# Criar debug keystore
keytool -genkey -v -keystore debug.keystore \
  -alias androiddebugkey \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass android \
  -keypass android \
  -dname "CN=Android Debug,O=Android,C=US"
```

### Erro: `ProGuard rule missing`

**Solução:**
```proguard
# proguard-rules.pro
-keep class com.rayshopee.app.** { *; }
-dontwarn com.rayshopee.app.**
```

### Erro: `BuildConfig field not found`

**Solução:**
```gradle
// build.gradle.kts
android {
    buildFeatures {
        buildConfig = true
    }
}
```

### Erro: `APK too large`

**Solução:**
```gradle
// build.gradle.kts
android {
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(...)
        }
    }
}
```

### Erro: `Google Play rejects APK`

**Solução:**
```gradle
// build.gradle.kts
android {
    defaultConfig {
        targetSdk = 35
        minSdk = 26
    }
}
```

---

## 📋 Checklist de Deploy

### Pré-Deploy

- [ ] Build successful
- [ ] Tests passing
- [ ] ProGuard configurado
- [ ] Keystore configurado
- [ ] Version bump (se necessário)
- [ ] Release notes escritas

### Deploy

- [ ] Build release/AAB
- [ ] Assinar APK/AAB
- [ ] Upload no Play Console
- [ ] Configurar track
- [ ] Publicar

### Pós-Deploy

- [ ] Monitorar crashes
- [ ] Verificar analytics
- [ ] Coletar feedback
- [ ] Planejar hotfix (se necessário)

---

## 🔄 Workflow Recomendado

```
Desenvolvimento
    ↓
Testes Locais
    ↓
Build Debug
    ↓
Testes Internos (Firebase)
    ↓
Build Release
    ↓
Play Console (Internal)
    ↓
Feedback
    ↓
Correções
    ↓
Play Console (Production)
```

---

## 📦 Versionamento

```gradle
// build.gradle.kts
defaultConfig {
    versionCode = 2    // Incrementar a cada build
    versionName = "1.0.1"  // Semantic versioning
}
```

### Version Code
- Inteiro incremental
- Obrigatório no Play Store
- Exemplo: 1, 2, 3...

### Version Name
- String legível
- Semantic versioning
- Exemplo: 1.0.0, 1.0.1, 1.1.0

---

## 🎯 Configurações Recomendadas

### Build Performance

```gradle
// gradle.properties
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configureondemand=true
kotlin.incremental=true
```

### APK Size

```gradle
// build.gradle.kts
android {
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(...)
        }
    }
    
    splits {
        abi {
            isEnable = true
            reset()
            include("armeabi-v7a", "arm64-v8a", "x86", "x86_64")
            isUniversalApk = false
        }
    }
}
```

---

## 📚 Recursos

### Documentação

- [Android Build](https://developer.android.com/studio/build)
- [Play Console](https://play.google.com/console)
- [Firebase App Distribution](https://firebase.google.com/docs/app-distribution)

### Ferramentas

- [Android Studio](https://developer.android.com/studio)
- [Gradle](https://gradle.org/)
- [Fastlane](https://fastlane.tools/)

---

## ❓ FAQ

### Posso usar APK em produção?
**Resposta:** Sim, mas AAB é recomendado (otimização automática)

### Preciso de keystore para debug?
**Resposta:** Não, debug keystore é gerado automaticamente

### Posso pular ProGuard em release?
**Resposta:** Não recomendado (segurança e tamanho)

### Como testar build release local?
**Resposta:** `./gradlew assembleRelease` e instalar manualmente

---

## 🎓 Conclusão

O processo de build e deploy está configurado para:
- ✅ Build automático
- ✅ Assinatura segura
- ✅ Deploy simplificado
- ✅ Monitoramento

**Próximos passos:**
1. Configurar CI/CD
2. Adicionar Crashlytics
3. Configurar Analytics
4. Automatizar deploy

---

**Documentação:** Ver README.md  
**Configuração:** Ver build.gradle.kts  
**Última Atualização:** 05/05/2026  
**Versão:** 1.0

--- END OF GUIDE ---