package com.shopeelister.di

import com.shopeelister.data.repository.AiRepositoryImpl
import com.shopeelister.data.repository.ProductRepositoryImpl
import com.shopeelister.data.repository.ShopeeRepositoryImpl
import com.shopeelister.domain.repository.AiRepository
import com.shopeelister.domain.repository.ProductRepository
import com.shopeelister.domain.repository.ShopeeRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Bindings de repositórios do ScanAddProdutos.
 *
 * **Mudança 2026-07-03:** `bindAiRepository` aponta para `AiRepositoryImpl`
 * (wrapper do GeminiService), não mais para `GroqAiRepositoryImpl`. O Groq
 * ficou 100% offline em 2026-08-16 quando `llama-3.3-70b-versatile` foi
 * descontinuado pela Groq (anunciado em 2026-06-17). Substituímos por
 * **Gemini 2.5 Flash** (Google AI Studio, free tier 1500 req/dia, 1M ctx,
 * multimodal, sem cartão). O `GeminiService` é inicializado em
 * `ShopeeListerApp.onCreate()` lendo a key do DataStore (prioridade) ou do
 * BuildConfig (fallback).
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds @Singleton
    abstract fun bindProductRepository(impl: ProductRepositoryImpl): ProductRepository

    @Binds @Singleton
    abstract fun bindShopeeRepository(impl: ShopeeRepositoryImpl): ShopeeRepository

    @Binds @Singleton
    abstract fun bindAiRepository(impl: AiRepositoryImpl): AiRepository

    @Binds @Singleton
    abstract fun bindWebScraperRepository(impl: com.shopeelister.data.repository.WebScraperRepositoryImpl): com.shopeelister.domain.repository.WebScraperRepository
}
