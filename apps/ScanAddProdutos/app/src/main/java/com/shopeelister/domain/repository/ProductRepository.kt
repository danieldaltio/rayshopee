package com.shopeelister.domain.repository

import com.shopeelister.domain.model.Product
import kotlinx.coroutines.flow.Flow

interface ProductRepository {
    fun getHistory(): Flow<List<Product>>
    suspend fun save(product: Product)
    suspend fun delete(product: Product)
}
