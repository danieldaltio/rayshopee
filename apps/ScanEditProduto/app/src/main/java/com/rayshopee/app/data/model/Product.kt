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
    val item_id: String,
    val model_id: String,
    val cost: Double
)