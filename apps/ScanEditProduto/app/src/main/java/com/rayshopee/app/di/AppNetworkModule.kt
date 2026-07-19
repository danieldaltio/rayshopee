package com.rayshopee.app.di

import com.rayshopee.app.data.prefs.SharedPrefsNetworkPreferences
import com.rayshopee.core.network.NetworkPreferences
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Hilt module do ScanEditProduto para [NetworkPreferences].
 *
 * **Por que existe:** O `:rayshopee-core` exige que cada app RayShopee prove seu
 * próprio binding de `NetworkPreferences` (o `CoreNetworkModule` NÃO fornece
 * default — decisão da Sessão 3 pra resolver DuplicateBindings do Hilt). Este
 * module declara que o impl é [SharedPrefsNetworkPreferences], que persiste a URL
 * do usuário em `SharedPreferences("app_prefs")` chave `"base_url"` (mesmo padrão
 * do PedidosEditProduto).
 *
 * **Criado em:** 2026-07-02 (Sessão 4 — completar migração que ficou com
 * MissingBinding de NetworkPreferences após Sessão 2).
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