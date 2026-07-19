plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.hilt)
    id("com.google.devtools.ksp")
    alias(libs.plugins.room)
}

import org.jetbrains.kotlin.gradle.dsl.JvmTarget

android {
    namespace = "com.shopeelister"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.shopeelister"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "1.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        buildConfigField("String", "SHOPEE_PARTNER_ID", "\"${project.findProperty("SHOPEE_PARTNER_ID") ?: ""}\"")
        buildConfigField("String", "SHOPEE_PARTNER_KEY", "\"${project.findProperty("SHOPEE_PARTNER_KEY") ?: ""}\"")
        buildConfigField("String", "SHOPEE_ACCESS_TOKEN", "\"${project.findProperty("SHOPEE_ACCESS_TOKEN") ?: ""}\"")
        buildConfigField("String", "SHOPEE_REFRESH_TOKEN", "\"${project.findProperty("SHOPEE_REFRESH_TOKEN") ?: ""}\"")
        buildConfigField("String", "SHOPEE_SHOP_ID", "\"${project.findProperty("SHOPEE_SHOP_ID") ?: ""}\"")
        buildConfigField("String", "GEMINI_API_KEY", "\"${project.findProperty("GEMINI_API_KEY") ?: ""}\"")
        buildConfigField("String", "GROQ_API_KEY", "\"${project.findProperty("GROQ_API_KEY") ?: ""}\"")
        buildConfigField("String", "REMOVEBG_API_KEY", "\"${project.findProperty("REMOVEBG_API_KEY") ?: ""}\"")
        buildConfigField("String", "SERVER_BASE_URL", "\"${project.findProperty("SERVER_BASE_URL") ?: "https://unpaining-transcriptionally-patrick.ngrok-free.dev"}\"")
        buildConfigField("String", "CLOUDINARY_CLOUD_NAME", "\"${project.findProperty("CLOUDINARY_CLOUD_NAME") ?: ""}\"")
        buildConfigField("String", "CLOUDINARY_API_KEY", "\"${project.findProperty("CLOUDINARY_API_KEY") ?: ""}\"")
        buildConfigField("String", "CLOUDINARY_API_SECRET", "\"${project.findProperty("CLOUDINARY_API_SECRET") ?: ""}\"")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

// Room schema location (obrigatório desde Room 2.7+). O Room plugin exige
// esta DSL mesmo quando `exportSchema = false` no @Database. Apontamos pra
// `app/schemas/` (convenção padrão Room, gitignored).
room {
    schemaDirectory("$projectDir/schemas")
}

dependencies {
    // Módulo compartilhado (rayshopee-core): NetworkDiscovery, NetworkMonitor,
    // NetworkConfig, FallbackUrlInterceptor, NetworkPreferences. Extraído em
    // 2026-07-02 pra evitar duplicação entre apps. Referência por coordinate
    // porque rayshopee-core é composite build (includeBuild) — ver settings.gradle.kts.
    implementation("com.rayshopee:core")

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.activity.compose)

    // Compose
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    debugImplementation(libs.androidx.ui.tooling)

    // Navigation
    implementation(libs.androidx.navigation.compose)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)
    implementation(libs.hilt.work)
    ksp(libs.hilt.work.compiler)

    // Retrofit + kotlinx-serialization (sem Moshi — alinhado com o core)
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.kotlinx)
    implementation(libs.kotlinx.serialization.json)
    implementation(platform(libs.okhttp.bom))
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)

    // Coroutines
    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.coroutines.android)

    // Room
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)

    // CameraX + ML Kit Barcode
    implementation(libs.camerax.core)
    implementation(libs.camerax.camera2)
    implementation(libs.camerax.lifecycle)
    implementation(libs.camerax.view)
    implementation(libs.mlkit.barcode)

    // DataStore
    implementation(libs.datastore.preferences)

    // Coil
    implementation(libs.coil.compose)

    // Accompanist Permissions
    implementation(libs.accompanist.permissions)

    // Gemini AI SDK
    implementation(libs.gemini.ai)

    // Gson (Shopee API body parsing legado)
    implementation(libs.gson)

    // Jsoup
    implementation(libs.jsoup)

    // Cloudinary Android SDK
    implementation(libs.cloudinary.android)

    // WorkManager
    implementation(libs.work.runtime.ktx)
}