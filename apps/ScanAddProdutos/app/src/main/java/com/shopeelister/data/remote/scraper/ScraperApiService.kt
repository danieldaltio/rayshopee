package com.shopeelister.data.remote.scraper

import retrofit2.http.GET
import retrofit2.http.Query

interface ScraperApiService {
    @GET("/api/scrape")
    suspend fun scrapeProduct(
        @Query("query") query: String?,
        @Query("ean") ean: String?
    ): ScraperResponse

    @GET("/api/config")
    suspend fun getConfig(): Map<String, String?>
}

data class ScraperResponse(
    val title: String?,
    val price: String?,
    val description: String?,
    val brand: String?,
    val source_url: String?,
    val success: Boolean,
    val error: String? = null
)
