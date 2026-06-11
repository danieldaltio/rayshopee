package com.rayshopee.app.data.repository

import com.rayshopee.app.data.model.Product
import com.rayshopee.app.data.model.ProductVariation
import kotlinx.coroutines.flow.Flow

interface ProductRepository {
    suspend fun searchByBarcode(barcode: String): Result<Product>
    suspend fun searchByItemId(itemId: String): Result<Product>
    suspend fun updatePrice(itemId: String, variationId: String, price: Double): Result<Unit>
    suspend fun updateStock(itemId: String, variationId: String, stock: Int): Result<Unit>
    suspend fun updateCost(itemId: String, variationId: String, cost: Double): Result<Unit>
    suspend fun checkHealth(): Boolean
}