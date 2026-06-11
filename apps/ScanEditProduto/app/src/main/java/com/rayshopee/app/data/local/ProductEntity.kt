package com.rayshopee.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import com.rayshopee.app.data.model.Product
import com.rayshopee.app.data.model.ProductVariation
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Entity(tableName = "products")
@TypeConverters(ProductConverters::class)
data class ProductEntity(
    @PrimaryKey
    val itemId: String,
    val itemName: String,
    val barcode: String?,
    val variations: List<ProductVariation>
)

fun ProductEntity.toDomain() = Product(
    itemId = itemId,
    itemName = itemName,
    variations = variations
)

fun Product.toEntity(barcode: String? = null) = ProductEntity(
    itemId = itemId,
    itemName = itemName,
    barcode = barcode,
    variations = variations
)

class ProductConverters {
    @TypeConverter
    fun fromVariationsList(value: List<ProductVariation>): String {
        return Json.encodeToString(value)
    }

    @TypeConverter
    fun toVariationsList(value: String): List<ProductVariation> {
        return Json.decodeFromString(value)
    }
}
