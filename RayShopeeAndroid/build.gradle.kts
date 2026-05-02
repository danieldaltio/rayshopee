plugins {
    alias(libs.plugins.android.application) apply false
    id("com.google.devtools.ksp") version "2.3.5" apply false
    alias(libs.plugins.hilt) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.room) apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "2.3.10" apply false
}