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

rootProject.name = "ScanEditProduto"
include(":app")

// Composite build do módulo compartilhado rayshopee-core (NetworkDiscovery,
// NetworkMonitor, NetworkConfig, FallbackUrlInterceptor, NetworkPreferences).
// Cada app standalone aponta pro mesmo diretório. ScanEditProduto usa desde 2026-07-02.
// Usamos `includeBuild` (composite) em vez de `include + projectDir` para que
// o settings.gradle.kts próprio do rayshopee-core seja carregado e o subprojeto
// `:core` fique disponível. O consumidor referencia por coordinate: `com.rayshopee:core`.
includeBuild("../rayshopee-core")