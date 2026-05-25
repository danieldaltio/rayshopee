package com.shopeelister.data.repository

import com.shopeelister.domain.repository.WebScraperRepository
import com.shopeelister.data.remote.scraper.ScraperApiService
import org.jsoup.Jsoup
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WebScraperRepositoryImpl @Inject constructor(
    private val scraperApiService: ScraperApiService
) : WebScraperRepository {

    override suspend fun searchProductOnWeb(query: String?, ean: String?): String = withContext(Dispatchers.IO) {
        if (query.isNullOrBlank() && ean.isNullOrBlank()) return@withContext ""
        
        try {
            val response = scraperApiService.scrapeProduct(query, ean)
            android.util.Log.d("WebScraper", "Server Response success=${response.success}: title=${response.title}, price=${response.price}")
            if (response.success) {
                val result = "SCRAPE_RESULT: TITLE: ${response.title} | PRICE: ${response.price} | DESC: ${response.description} | URL: ${response.source_url}"
                android.util.Log.d("WebScraper", "Returning evidence: $result")
                result
            } else {
                android.util.Log.w("WebScraper", "Server returned success=false")
                ""
            }
        } catch (e: Exception) {
            android.util.Log.e("WebScraper", "Error calling server scraper: ${e.message}")
            ""
        }
    }

    override suspend fun fetchDeepEvidence(url: String): String = withContext(Dispatchers.IO) {
        android.util.Log.d("WebScraper", "Fetching deep evidence for: $url")
        try {
            when {
                url.contains("mercadolivre.com.br") -> fetchMLApi(url)
                url.contains("shopee.com.br") -> fetchShopeeApi(url)
                else -> fetchJsonLd(url)
            }
        } catch (e: Exception) {
            android.util.Log.e("WebScraper", "Error fetching deep evidence: ${e.message}")
            ""
        }
    }

    private fun fetchMLApi(url: String): String {
        // Extrai ID do tipo MLB12345678
        val idMatch = Regex("MLB-?(\\d+)").find(url) ?: return ""
        val itemId = "MLB${idMatch.groupValues[1]}"
        return try {
            val doc = Jsoup.connect("https://api.mercadolibre.com/items/$itemId").ignoreContentType(true).execute().body()
            val desc = Jsoup.connect("https://api.mercadolibre.com/items/$itemId/description").ignoreContentType(true).execute().body()
            "ML_API_DATA: $doc \n DESCRIPTION: $desc"
        } catch (_: Exception) { "" }
    }

    private fun fetchShopeeApi(url: String): String {
        // Shopee URLs: .../product/SHOPID/ITEMID
        val regex = Regex("product/(\\d+)/(\\d+)").find(url) ?: return ""
        val shopId = regex.groupValues[1]
        val itemId = regex.groupValues[2]
        return try {
            val apiUrl = "https://shopee.com.br/api/v4/item/get?itemid=$itemId&shopid=$shopId"
            Jsoup.connect(apiUrl).ignoreContentType(true).execute().body()
        } catch (_: Exception) { "" }
    }

    private fun fetchJsonLd(url: String): String {
        return try {
            val doc = Jsoup.connect(url)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .get()
            val scripts = doc.select("script[type=application/ld+json]")
            scripts.joinToString("\n") { it.html() }
        } catch (_: Exception) { "" }
    }
}
