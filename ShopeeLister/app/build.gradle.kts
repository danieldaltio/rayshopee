import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.shopeelister"
    compileSdk = 35

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

dependencies {
    // Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
    implementation(composeBom)
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material:material-icons-extended")
    debugImplementation("androidx.compose.ui:ui-tooling")

    // Core
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.2")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.2")
    implementation("androidx.activity:activity-compose:1.9.0")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.59.2")
    ksp("com.google.dagger:hilt-compiler:2.59.2")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // ML Kit Barcode
    implementation("com.google.mlkit:barcode-scanning:17.3.0")

    // CameraX
    implementation("androidx.camera:camera-core:1.3.4")
    implementation("androidx.camera:camera-camera2:1.3.4")
    implementation("androidx.camera:camera-lifecycle:1.3.4")
    implementation("androidx.camera:camera-view:1.3.4")

    // Gemini AI SDK
    implementation("com.google.ai.client.generativeai:generativeai:0.9.0")

    // Retrofit + OkHttp
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Moshi
    implementation("com.squareup.moshi:moshi:1.15.1")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.1")
    ksp("com.squareup.moshi:moshi-kotlin-codegen:1.15.1")
    implementation("org.jsoup:jsoup:1.17.2")

    // Room
    implementation("androidx.room:room-runtime:2.8.4")
    implementation("androidx.room:room-ktx:2.8.4")
    ksp("androidx.room:room-compiler:2.8.4")

    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Coil
    implementation("io.coil-kt:coil-compose:2.6.0")

    // Accompanist Permissions
    implementation("com.google.accompanist:accompanist-permissions:0.34.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // Gson (for Shopee API body parsing)
    implementation("com.google.code.gson:gson:2.11.0")

    // Cloudinary Android SDK
    implementation("com.cloudinary:cloudinary-android:3.1.2")
}
