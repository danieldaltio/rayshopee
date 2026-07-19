plugins {
    alias(libs.plugins.android.application)
    id("com.google.devtools.ksp")
    alias(libs.plugins.hilt)
    alias(libs.plugins.kotlin.compose)
}

import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.gradle.api.JavaVersion

android {
    namespace = "com.rayshopee.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.rayshopee.orders"
        minSdk = 26
        targetSdk = 35
        versionCode = 4
        versionName = "1.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
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

dependencies {
    // Módulo compartilhado — NetworkDiscovery, NetworkMonitor, NetworkConfig,
    // FallbackUrlInterceptor, NetworkPreferences. Integração feita em 2026-07-02
    // para unificar a lógica de URL (user LAN cloudflare) entre os 3 apps RayShopee.
    // O :rayshopee-core exporta OkHttp via `api(...)` — o PedidosEditProduto ainda
    // usa HttpURLConnection em OrdersRepositoryImpl, mas passa a ter NetworkConfig
    // disponível para evolução futura (LAN discovery + fallback transparente).
    // Referência por coordinate porque rayshopee-core é composite build (includeBuild)
    // — ver settings.gradle.kts.
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

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.coroutines.android)

    debugImplementation(libs.androidx.ui.tooling)
}