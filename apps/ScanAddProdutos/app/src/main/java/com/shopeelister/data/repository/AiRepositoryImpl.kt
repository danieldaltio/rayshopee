package com.shopeelister.data.repository

import android.graphics.Bitmap
import com.shopeelister.data.remote.gemini.GeminiService
import com.shopeelister.domain.model.SearchResult
import com.shopeelister.domain.repository.AiRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AiRepositoryImpl @Inject constructor(
    private val geminiService: GeminiService
) : AiRepository {

    override suspend fun searchProductInfo(ean: String, webEvidence: String?): SearchResult =
        geminiService.searchProductInfo(ean, webEvidence)

    override suspend fun identifyProductFromImage(bitmap: Bitmap): SearchResult =
        geminiService.identifyProductFromImage(bitmap)

    override suspend fun generateDescription(productInfo: SearchResult): String =
        geminiService.generateDescription(productInfo)

    override suspend fun suggestCategory(productInfo: SearchResult): String =
        geminiService.suggestCategory(productInfo)

    override suspend fun improveTitle(title: String, category: String?): String =
        geminiService.improveTitle(title, category)
}
