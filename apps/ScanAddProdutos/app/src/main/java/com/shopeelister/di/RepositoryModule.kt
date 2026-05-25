package com.shopeelister.di

import com.shopeelister.data.repository.GroqAiRepositoryImpl
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

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds @Singleton
    abstract fun bindProductRepository(impl: ProductRepositoryImpl): ProductRepository

    @Binds @Singleton
    abstract fun bindShopeeRepository(impl: ShopeeRepositoryImpl): ShopeeRepository

    @Binds @Singleton
    abstract fun bindAiRepository(impl: GroqAiRepositoryImpl): AiRepository

    @Binds @Singleton
    abstract fun bindWebScraperRepository(impl: com.shopeelister.data.repository.WebScraperRepositoryImpl): com.shopeelister.domain.repository.WebScraperRepository
}
