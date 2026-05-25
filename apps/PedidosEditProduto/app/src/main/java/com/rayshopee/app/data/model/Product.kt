package com.rayshopee.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Product(
    val itemId: String = "",
    val itemName: String = "",
    val variations: List<ProductVariation> = emptyList()
)

@Serializable
data class ProductVariation(
    val variationId: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val stock: Int = 0
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