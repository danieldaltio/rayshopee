package com.rayshopee.app.di

import com.rayshopee.app.data.prefs.SharedPrefsNetworkPreferences
import com.rayshopee.core.network.NetworkPreferences
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Hilt module do PedidosEditProduto para [NetworkPreferences].
 *
 * **Por que existe:** O `:rayshopee-core` traz um `@Binds` default pra
 * `NullNetworkPreferences` (apps sem URL configurável). Este module **sobrescreve**
 * esse binding injetando [SharedPrefsNetworkPreferences] — que persiste a URL do
 * usuário no mesmo SharedPrefs que o app já usava (`app_prefs/base_url`), preservando
 * compatibilidade com installs existentes.
 *
 * Como ambos os módulos são `InstallIn(SingletonComponent::class)` e este declara
 * um `@Binds` mais específico, o Hilt prefere esta implementação. O `NullNetworkPreferences`
 * do core permanece no classpath mas não é instanciado.
 *
 * **Criado em:** 2026-07-02 (integração com :rayshopee-core).
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class AppNetworkModule {

    @Binds
    @Singleton
    abstract fun bindNetworkPreferences(
        impl: SharedPrefsNetworkPreferences
    ): NetworkPreferences
}