package com.shopeelister.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val ean: String,
    val description: String,
    val categoryName: String,
    val brand: String,
    val priceCents: Long,
    val weightGrams: Int,
    val widthCm: Int,
    val heightCm: Int,
    val lengthCm: Int,
    val sku: String,
    val stock: Int,
    val imagePath: String?,
    val createdAt: Long = System.currentTimeMillis()
)
