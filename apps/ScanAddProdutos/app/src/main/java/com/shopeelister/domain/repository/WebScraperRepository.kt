package com.shopeelister.domain.repository

interface WebScraperRepository {
    suspend fun searchProductOnWeb(query: String?, ean: String?): String
    suspend fun fetchDeepEvidence(url: String): String
}
