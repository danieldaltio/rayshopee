package com.shopeelister.domain.repository

import android.graphics.Bitmap
import com.shopeelister.domain.model.CategorySuggestion
import com.shopeelister.domain.model.Product
import com.shopeelister.data.remote.shopee.LogisticsOption

interface ShopeeRepository {
    suspend fun searchByKeyword(keyword: String): List<Product>
    suspend fun getCategories(): List<CategorySuggestion>
    suspend fun uploadImage(bitmap: Bitmap): String
    suspend fun addItem(product: Product, imageUrl: String): Boolean
    suspend fun getAuthUrl(callbackUrl: String): String
    suspend fun getAccessToken(code: String, shopId: Long): Boolean
    suspend fun getLogisticsChannels(): List<LogisticsOption>
    suspend fun refreshLogisticsChannel(channelId: Long, enabled: Boolean): Boolean
}
