package com.shopeelister.data.local

import com.shopeelister.domain.model.Product
import java.io.File

fun ProductEntity.toDomain() = Product(
    imageFile = imagePath?.let { File(it) },
    title = title,
    ean = ean,
    description = description,
    categoryName = categoryName,
    brand = brand,
    priceCents = priceCents,
    weightGrams = weightGrams,
    widthCm = widthCm,
    heightCm = heightCm,
    lengthCm = lengthCm,
    sku = sku,
    stock = stock
)

fun Product.toEntity() = ProductEntity(
    title = title,
    ean = ean,
    description = description,
    categoryName = categoryName,
    brand = brand,
    priceCents = priceCents,
    weightGrams = weightGrams,
    widthCm = widthCm,
    heightCm = heightCm,
    lengthCm = lengthCm,
    sku = sku,
    stock = stock,
    imagePath = imageFile?.absolutePath
)
