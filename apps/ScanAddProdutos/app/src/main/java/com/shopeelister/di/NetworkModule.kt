package com.shopeelister.di

import retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.shopeelister.data.local.ConfigStore
import com.shopeelister.data.remote.scraper.ScraperApiService
import com.shopeelister.data.remote.shopee.ShopeeApiService
import com.shopeelister.data.remote.shopee.ShopeeAuthInterceptor
import com.shopeelister.util.Constants
import com.rayshopee.core.network.FallbackUrlInterceptor
import com.rayshopee.core.network.NetworkConfig
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Named
import javax.inject.Singleton

/**
 * NetworkModule do ScanAddProdutos — alinhado com :rayshopee-core desde 2026-07-02.
 *
 * **Mudanças da migração:**
 *  - Removido Moshi: substituído por kotlinx-serialization (`Json` + `asConverterFactory`)
 *  - Removido interceptor customizado que reescrevia URL baseado em
 *    `configStore.serverUrl.first()` — agora o `FallbackUrlInterceptor` do
 *    `:rayshopee-core` faz isso, com fallback chain `userUrl → lanUrl → cloudflareUrl`
 *    em vez de só `userUrl`.
 *  - `baseUrl` agora é o `NetworkConfig.DEFAULT_CLOUDFLARE_URL` (placeholder —
 *    o Interceptor reescreve na hora da request).
 *
 * **Mudança 2026-07-03:** Removido o cliente Retrofit **Groq** (modelo
 * `llama-3.3-70b-versatile` descontinuado pela Groq em 2026-08-16).
 * A camada de IA agora usa **Gemini 2.5 Flash** via SDK oficial
 * `com.google.ai.client.generativeai` em `data/remote/gemini/GeminiService.kt`
 * — não precisa de Retrofit porque o SDK faz HTTP nativo.
 *
 * **Mantido:** os 2 clients restantes (shopee / scraper) cada um com seu
 * conjunto de interceptors específicos (auth, ngrok header, etc).
 */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        explicitNulls = false
    }

    @Provides
    @Singleton
    @Named("shopee")
    fun provideShopeeRetrofit(
        configStore: ConfigStore,
        json: Json,
        fallbackInterceptorFactory: FallbackUrlInterceptor.Factory
    ): Retrofit {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(ShopeeAuthInterceptor(configStore))
            .addInterceptor(fallbackInterceptorFactory.create())
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(NetworkConfig.DEFAULT_CLOUDFLARE_URL)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    fun provideShopeeApiService(@Named("shopee") retrofit: Retrofit): ShopeeApiService =
        retrofit.create(ShopeeApiService::class.java)

    @Provides
    @Singleton
    @Named("scraper")
    fun provideScraperRetrofit(
        json: Json,
        fallbackInterceptorFactory: FallbackUrlInterceptor.Factory
    ): Retrofit {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(fallbackInterceptorFactory.create())
            .addInterceptor(logging)
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(NetworkConfig.DEFAULT_CLOUDFLARE_URL) // Placeholder; o interceptor reescreve
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    fun provideScraperApiService(@Named("scraper") scraperRetrofit: Retrofit): ScraperApiService =
        scraperRetrofit.create(ScraperApiService::class.java)
}