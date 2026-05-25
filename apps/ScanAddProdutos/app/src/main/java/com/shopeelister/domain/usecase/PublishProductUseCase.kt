package com.shopeelister.domain.usecase

import android.graphics.Bitmap
import com.shopeelister.domain.model.Product
import com.shopeelister.domain.repository.ProductRepository
import com.shopeelister.domain.repository.ShopeeRepository
import javax.inject.Inject

class PublishProductUseCase @Inject constructor(
    private val shopeeRepository: ShopeeRepository,
    private val productRepository: ProductRepository,
    private val removeBackgroundUseCase: RemoveBackgroundUseCase
) {
    sealed class Result {
        data class Success(val message: String) : Result()
        data class Error(val message: String) : Result()
    }

    suspend operator fun invoke(product: Product, originalBitmap: Bitmap?): Result {
        return try {
            // 1. Remove background
            val cleanBitmap = if (originalBitmap != null) {
                removeBackgroundUseCase(originalBitmap) ?: originalBitmap
            } else null

            // 2. Upload image
            val imageUrl = if (cleanBitmap != null) {
                shopeeRepository.uploadImage(cleanBitmap)
            } else ""

            // 3. Add item
            val success = shopeeRepository.addItem(product, imageUrl)

            if (success) {
                productRepository.save(product)
                Result.Success("Produto publicado com sucesso!")
            } else {
                Result.Error("Erro ao publicar na Shopee")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Erro desconhecido")
        }
    }
}
