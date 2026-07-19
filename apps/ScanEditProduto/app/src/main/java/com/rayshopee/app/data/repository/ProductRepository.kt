package com.rayshopee.app.data.repository

import com.rayshopee.app.data.model.Product
import com.rayshopee.app.data.model.ProductSearchResult
import com.rayshopee.app.data.model.ProductVariation
import kotlinx.coroutines.flow.Flow

interface ProductRepository {
    suspend fun searchByBarcode(barcode: String): Result<Product>
    suspend fun searchByItemId(itemId: String): Result<Product>
    /**
     * Busca direto na rede (ignora cache). Usado pra background refresh:
     * ViewModel mostra cache imediato, depois busca fresh e atualiza a UI.
     */
    suspend fun fetchFreshByBarcode(barcode: String): Result<Product>
    suspend fun fetchFreshByItemId(itemId: String): Result<Product>
    /**
     * Busca por nome/SKU/EAN parcial. Retorna lista de resultados (não um único Product)
     * porque a busca é ampla — UI mostra a lista pro usuário escolher qual abrir.
     */
    suspend fun searchByName(query: String): Result<List<ProductSearchResult>>
    suspend fun updatePrice(
        itemId: String,
        variationId: String,
        price: Double,
        fromQueue: Boolean = false
    ): Result<Unit>
    suspend fun updateStock(
        itemId: String,
        variationId: String,
        stock: Int,
        fromQueue: Boolean = false
    ): Result<Unit>
    suspend fun updateCost(
        itemId: String,
        variationId: String,
        cost: Double,
        fromQueue: Boolean = false
    ): Result<Unit>
    suspend fun checkHealth(): Boolean
}