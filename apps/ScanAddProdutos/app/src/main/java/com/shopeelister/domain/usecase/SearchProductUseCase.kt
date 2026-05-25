package com.shopeelister.domain.usecase

import android.graphics.Bitmap
import com.shopeelister.domain.model.Product
import com.shopeelister.domain.model.SearchResult
import com.shopeelister.domain.repository.AiRepository
import com.shopeelister.domain.repository.ShopeeRepository
import com.shopeelister.domain.repository.WebScraperRepository
import com.shopeelister.util.Constants
import com.shopeelister.util.SkuGenerator
import kotlinx.coroutines.*
import javax.inject.Inject

class SearchProductUseCase @Inject constructor(
    private val aiRepository: AiRepository,
    private val shopeeRepository: ShopeeRepository,
    private val webScraperRepository: WebScraperRepository
) {
    suspend operator fun invoke(name: String?, ean: String?, image: Bitmap?): Product {
        val searchTerm = if (name?.isNotBlank() == true) name else (ean ?: "Novo Produto")
        android.util.Log.d("SearchUseCase", "Generating description for title: $searchTerm")
        
        // Final title is exactly what the user typed
        val title = searchTerm.take(Constants.MAX_TITLE_LENGTH)
        
        // Create a dummy result to pass to the generator
        val dummyResult = SearchResult(title = title)

        // Generate full description based ONLY on the title
        val finalDescription = try {
            val desc = aiRepository.generateDescription(dummyResult)
            android.util.Log.d("SearchUseCase", "Generated Description: ${desc.take(50)}...")
            desc.ifBlank { "Descrição em breve..." }
        } catch (e: Exception) { 
            android.util.Log.e("SearchUseCase", "AI Error: ${e.message}")
            "Descrição em breve..." 
        }

        // Quick category suggestion (optional but helpful)
        val category = try {
            aiRepository.suggestCategory(dummyResult)
        } catch (_: Exception) { "Outros" }

        return Product(
            ean = ean ?: "",
            title = title,
            description = finalDescription,
            brand = "Sem Marca",
            priceCents = 0L,
            weightGrams = Constants.DEFAULT_WEIGHT_GRAMS,
            widthCm = Constants.DEFAULT_WIDTH_CM,
            heightCm = Constants.DEFAULT_HEIGHT_CM,
            lengthCm = Constants.DEFAULT_LENGTH_CM,
            categoryName = category,
            sku = SkuGenerator.generate(title),
            stock = Constants.DEFAULT_STOCK,
            variations = emptyList()
        )
    }

    private fun mergeResults(base: SearchResult, overlay: SearchResult): SearchResult {
        return SearchResult(
            title = overlay.title?.takeIf { it.isNotBlank() } ?: base.title,
            brand = overlay.brand?.takeIf { it.isNotBlank() } ?: base.brand,
            weightGrams = overlay.weightGrams ?: base.weightGrams,
            dimensions = overlay.dimensions?.takeIf { it.isNotBlank() } ?: base.dimensions,
            priceCents = overlay.priceCents ?: base.priceCents,
            description = overlay.description?.takeIf { it.isNotBlank() } ?: base.description,
            category = overlay.category?.takeIf { it.isNotBlank() } ?: base.category,
            variations = if (overlay.variations.isNotEmpty()) overlay.variations else base.variations
        )
    }

    private fun parseDimensions(dim: String?): Triple<Int, Int, Int>? {
        if (dim.isNullOrBlank()) return null
        val nums = Regex("\\d+").findAll(dim).map { it.value.toInt() }.toList()
        return when (nums.size) {
            3 -> Triple(nums[0], nums[1], nums[2])
            2 -> Triple(nums[0], nums[1], nums[1])
            1 -> Triple(nums[0], nums[0], nums[0])
            else -> null
        }
    }
}
