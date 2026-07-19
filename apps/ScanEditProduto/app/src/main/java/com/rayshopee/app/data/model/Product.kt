package com.rayshopee.app.data.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

@Serializable
data class Product(
    val itemId: String = "",
    val itemName: String = "",
    val variations: List<ProductVariation> = emptyList(),
    @Transient val isFromCache: Boolean = false,
    @Transient val lastSyncedAt: Long = 0L
)

/**
 * Resultado de busca ampla (por nome / SKU / EAN).
 *
 * Diferente de [Product], que representa um produto JÁ carregado com todas
 * as variações prontas pra editar, este é só um "card de listagem" — UI
 * mostra vários e o usuário toca num pra abrir o detalhe (que aí sim vira
 * um [Product] via [searchByItemId]).
 *
 * NÃO é @Serializable porque a serialização é feita pela response do
 * repositório (camada de rede) — aqui é só modelo de domínio.
 */
data class ProductSearchResult(
    val itemId: String,
    val modelId: Long,
    val name: String,
    val variation: String,
    val sku: String,
    val price: Double,
    val stock: Int,
    val cost: Double,
    val image: String = ""
)

@Serializable
data class ProductVariation(
    val variationId: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val stock: Int = 0,
    val cost: Double = 0.0,
    val barcode: String = ""
)

@Serializable
data class UpdatePriceRequest(
    val itemId: String,
    val variationId: String,
    val price: Double
)

@Serializable
data class UpdateStockRequest(
    val itemId: String,
    val variationId: String,
    val stock: Int
)

@Serializable
data class UpdateCostRequest(
    val itemId: String,        // 🆕 camelCase (era snake_case, alinhado com Price/Stock em 2026-07-18 — P7 resolvido)
    val modelId: String,       // 🆕
    val cost: Double
)