package com.shopeelister.di

import com.shopeelister.data.local.ConfigStore
import com.shopeelister.data.remote.shopee.ShopeeApiService
import com.shopeelister.data.remote.shopee.ShopeeAuthInterceptor
import com.shopeelister.data.remote.scraper.ScraperApiService
import com.shopeelister.data.remote.groq.GroqApiService
import com.shopeelister.util.Constants
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.flow.first
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import kotlinx.coroutines.runBlocking
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Named
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder()
        .addLast(KotlinJsonAdapterFactory())
        .build()

    @Provides
    @Singleton
    @Named("shopee")
    fun provideShopeeRetrofit(
        configStore: ConfigStore,
        moshi: Moshi
    ): Retrofit {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(ShopeeAuthInterceptor(configStore))
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(Constants.SHOPEE_BASE_URL)
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
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
        configStore: ConfigStore,
        moshi: Moshi
    ): Retrofit {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val originalRequest = chain.request()
                // Get the current server URL from ConfigStore (sync for interceptor)
                val serverUrl = runBlocking { 
                    configStore.serverUrl.first() 
                }
                
                val parsedServerUrl = serverUrl.toHttpUrlOrNull() ?: Constants.SERVER_BASE_URL.toHttpUrlOrNull() ?: error("Invalid Server URL")
                
                val newUrl = originalRequest.url.newBuilder()
                    .scheme(parsedServerUrl.scheme)
                    .host(parsedServerUrl.host)
                    .port(parsedServerUrl.port)
                    .build()
                
                val isNgrok = serverUrl.contains("ngrok")
                val request = originalRequest.newBuilder()
                    .url(newUrl)
                    .apply {
                        if (isNgrok) addHeader("ngrok-skip-browser-warning", "true")
                    }
                    .build()
                chain.proceed(request)
            }
            .addInterceptor(logging)
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl("https://placeholder.api/") // Will be replaced by interceptor
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }

    @Provides
    @Singleton
    fun provideScraperApiService(@Named("scraper") scraperRetrofit: Retrofit): ScraperApiService =
        scraperRetrofit.create(ScraperApiService::class.java)

    @Provides
    @Singleton
    @Named("groq")
    fun provideGroqRetrofit(moshi: Moshi): Retrofit {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(Constants.GROQ_BASE_URL)
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }

    @Provides
    @Singleton
    fun provideGroqApiService(@Named("groq") groqRetrofit: Retrofit): GroqApiService =
        groqRetrofit.create(GroqApiService::class.java)
}
