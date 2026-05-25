package com.shopeelister.domain.model

data class SearchResult(
    val title: String? = null,
    val brand: String? = null,
    val weightGrams: Int? = null,
    val dimensions: String? = null,
    val priceCents: Long? = null,
    val description: String? = null,
    val category: String? = null,
    val variations: List<Variation> = emptyList()
)
