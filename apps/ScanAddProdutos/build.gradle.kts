plugins {
    // Versões via libs.versions.toml (mesmo padrão do PedidosEditProduto).
    // NÃO declarar `version "..."` aqui — conflita com `alias(libs.plugins.xxx)`
    // que o `app/build.gradle.kts` usa. Ver Sessão 3 do Pedidos, Issue 1.
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.hilt) apply false
    alias(libs.plugins.kotlin.compose) apply false
    id("com.google.devtools.ksp") version "2.3.5" apply false
}
