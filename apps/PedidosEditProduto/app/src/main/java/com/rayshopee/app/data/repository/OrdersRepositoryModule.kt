package com.rayshopee.app.data.repository

import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Módulo Hilt para o [OrdersRepository].
 *
 * Módulo vivo: vincula [OrdersRepositoryImpl] a [OrdersRepository] como `@Singleton`,
 * consumido pelo [com.rayshopee.app.ui.screens.OrdersViewModel].
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class OrdersRepositoryModule {
    @Binds
    @Singleton
    abstract fun bindOrdersRepository(impl: OrdersRepositoryImpl): OrdersRepository
}