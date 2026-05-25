package com.shopeelister.di

import android.content.Context
import com.shopeelister.data.local.AppDatabase
import com.shopeelister.data.local.ConfigStore
import com.shopeelister.data.local.ProductDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideConfigStore(@ApplicationContext context: Context): ConfigStore =
        ConfigStore(context)

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        androidx.room.Room.databaseBuilder(
            context, AppDatabase::class.java, "shopeelister.db"
        ).build()

    @Provides
    fun provideProductDao(db: AppDatabase): ProductDao = db.productDao()
}
