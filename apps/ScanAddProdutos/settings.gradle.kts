pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
    plugins {
        id("com.google.devtools.ksp") version "2.3.5"
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ScanAddProdutos"
include(":app")

// Composite build do módulo compartilhado rayshopee-core (NetworkDiscovery,
// NetworkMonitor, NetworkConfig, FallbackUrlInterceptor, NetworkPreferences).
// ScanAddProdutos usa desde 2026-07-02 (Sessão 4 — alinhamento de versões
// OkHttp 4->5, Moshi->kotlinx-serialization, Compose BOM 2024->2026).
// Usamos `includeBuild` (composite) em vez de `include + projectDir` para que
// o settings.gradle.kts próprio do rayshopee-core seja carregado e o subprojeto
// `:core` fique disponível. O consumidor referencia por coordinate: `com.rayshopee:core`.
includeBuild("../rayshopee-core")