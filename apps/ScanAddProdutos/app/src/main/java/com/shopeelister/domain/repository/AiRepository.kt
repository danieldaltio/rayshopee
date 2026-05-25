package com.shopeelister.domain.repository

import android.graphics.Bitmap
import com.shopeelister.domain.model.SearchResult

interface AiRepository {
    suspend fun searchProductInfo(ean: String, webEvidence: String? = null): SearchResult
    suspend fun identifyProductFromImage(bitmap: Bitmap): SearchResult
    suspend fun generateDescription(productInfo: SearchResult): String
    suspend fun suggestCategory(productInfo: SearchResult): String
    suspend fun improveTitle(title: String, category: String? = null): String
}
