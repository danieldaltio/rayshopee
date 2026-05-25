package com.shopeelister.domain.model

import java.io.File
import com.shopeelister.util.Constants

data class Variation(
    val name: String = "Padrão",
    val priceCents: Long = 0L,
    val stock: Int = Constants.DEFAULT_STOCK,
    val sku: String = "",
    val costCents: Long? = null
)

data class Product(
    val imageFile: File? = null,
    val title: String = "",
    val ean: String = "",
    val description: String = "",
    val categoryId: Long = 0L,
    val categoryName: String = "",
    val widthCm: Int = Constants.DEFAULT_WIDTH_CM,
    val heightCm: Int = Constants.DEFAULT_HEIGHT_CM,
    val lengthCm: Int = Constants.DEFAULT_LENGTH_CM,
    val weightGrams: Int = Constants.DEFAULT_WEIGHT_GRAMS,
    val brand: String = "Sem Marca",
    val priceCents: Long = 0L,
    val stock: Int = Constants.DEFAULT_STOCK,
    val sku: String = "",
    val condition: String = "NEW",
    val variations: List<Variation> = emptyList(),
    val costCents: Long? = null
) {
    val packageHeightCm get() = heightCm + Constants.PACKAGE_PADDING_CM
    val packageWidthCm get() = widthCm + Constants.PACKAGE_PADDING_CM
    val packageLengthCm get() = lengthCm + Constants.PACKAGE_PADDING_CM
    val packageWeightGrams get() = weightGrams + Constants.PACKAGE_WEIGHT_PADDING_GRAMS

    val priceFormatted: String
        get() = "R$ %.2f".format(priceCents / 100.0)
}
