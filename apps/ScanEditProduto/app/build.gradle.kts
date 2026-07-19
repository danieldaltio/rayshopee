plugins {
    alias(libs.plugins.android.application)
    id("com.google.devtools.ksp")
    alias(libs.plugins.hilt)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.room)
    id("org.jetbrains.kotlin.plugin.serialization")
}

import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.gradle.api.JavaVersion
import java.util.Properties

android {
    namespace = "com.rayshopee.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.rayshopee.scanedit"
        minSdk = 26
        targetSdk = 35
        versionCode = 3
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    // =========================================================================
    // 🆕 2026-07-18 (T1.3): Release signing config — lê de app/keystore.properties
    //
    // Setup (uma vez):
    //   1. Gerar keystore:  keytool -genkey -v -keystore rayshopee.keystore \
    //                          -alias rayshopee -keyalg RSA -keysize 2048 \
    //                          -validity 10000
    //   2. Criar app/keystore.properties (GITIGNORED):
    //        storeFile=../rayshopee.keystore
    //        storePassword=...
    //        keyAlias=rayshopee
    //        keyPassword=...
    //   3. Build:  ./gradlew assembleRelease
    //
    // Se keystore.properties NÃO existir, o build release usa debug.keystore
    // (com warning) — útil pra dev local, NUNCA pra Play Store.
    // =========================================================================
    signingConfigs {
        create("release") {
            val keystorePropertiesFile = rootProject.file("app/keystore.properties")
            if (keystorePropertiesFile.exists()) {
                val props = Properties()
                props.load(keystorePropertiesFile.inputStream())
                storeFile = rootProject.file(props.getProperty("storeFile"))
                storePassword = props.getProperty("storePassword")
                keyAlias = props.getProperty("keyAlias")
                keyPassword = props.getProperty("keyPassword")
            } else {
                // Fallback: usa debug.keystore (warning explícito, NÃO pra Play Store)
                storeFile = rootProject.file("debug.keystore")
                storePassword = "android"
                keyAlias = "androiddebugkey"
                keyPassword = "android"
                logger.warn("⚠️ keystore.properties não encontrado — usando debug.keystore. Configure antes de publicar!")
            }
        }
    }

    buildTypes {
        release {
            // 🆕 2026-07-18 (P10 resolvido): R8 ativado com regras em proguard-rules.pro
            // Cobre Hilt, Retrofit, kotlinx-serialization, MLKit, CameraX, Room, WorkManager, :rayshopee-core
            // Validar com: ./gradlew assembleRelease + smoke test em device (T1.7)
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            isMinifyEnabled = false
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

room {
    schemaDirectory("$projectDir/schemas")
}

// 🆕 2026-07-18: configurar sourceSet Kotlin para testes
// (AGP procura em src/test/java por padrão — mas estamos usando src/test/kotlin)
android {
    sourceSets {
        getByName("test") {
            kotlin.srcDirs("src/test/kotlin")
        }
        getByName("androidTest") {
            kotlin.srcDirs("src/androidTest/kotlin")
        }
    }
}

// 🆕 2026-07-18: habilitar JUnit 5 (Jupiter) — sem isso, os testes não são descobertos
// (default do Gradle é JUnit 4)
tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

dependencies {
    // Módulo compartilhado — NetworkDiscovery, NetworkMonitor, NetworkConfig,
    // FallbackUrlInterceptor, NetworkPreferences. Extraído em 2026-07-02 pra evitar
    // duplicação entre apps. Referência por coordinate porque rayshopee-core é
    // composite build (includeBuild) — ver settings.gradle.kts.
    implementation("com.rayshopee:core")

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.kotlinx)
    implementation(libs.kotlinx.serialization.json)
    implementation(platform(libs.okhttp.bom))
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)

    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.coroutines.android)

    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)

    implementation(libs.camerax.core)
    implementation(libs.camerax.camera2)
    implementation(libs.camerax.lifecycle)
    implementation(libs.camerax.view)
    implementation(libs.mlkit.barcode)

    debugImplementation(libs.androidx.ui.tooling)

    // WorkManager & Hilt Work
    implementation("androidx.work:work-runtime-ktx:2.9.0")
    implementation("androidx.hilt:hilt-work:1.2.0")
    ksp("androidx.hilt:hilt-compiler:1.2.0")

    // =========================================================================
    // 🆕 2026-07-18 (P6) — Testes JVM-puros (T2.1, T2.2, T2.3 do sprint.md)
    // Roda sem emulador/device (./gradlew testDebugUnitTest).
    // Cobre: parsers DTOs, ScannerViewModel (cooldown/dedupe), FallbackUrlInterceptor.
    // =========================================================================
    testImplementation(libs.junit.jupiter)
    testImplementation(libs.junit.jupiter.engine)
    testImplementation(libs.junit.platform.launcher)
    testImplementation(libs.mockk)
    testImplementation(libs.turbine)
    testImplementation(libs.kotlinx.coroutines.core)  // já está em main, mas explícito
    testImplementation(libs.kotlinx.coroutines.test)  // StandardTestDispatcher, runTest, advanceTimeBy
}