package com.shopeelister.util

object SkuGenerator {
    private val stopWords = setOf(
        "de", "do", "da", "dos", "das", "para", "com", "e", "em", "o", "a", "os", "as",
        "um", "uma", "the", "of", "and", "for", "to", "in", "is", "it", "an", "by"
    )

    fun generate(title: String): String {
        val words = title.split("\\s+".toRegex())
            .filter { it.isNotBlank() && it.lowercase() !in stopWords }
            .map { it.replace("[^a-zA-Z0-9]".toRegex(), "") }
            .filter { it.isNotEmpty() }
            .take(5)

        val parts = words.map { word ->
            if (word.length <= 3) word.uppercase()
            else word.take(3).uppercase()
        }

        return parts.joinToString("-").take(Constants.MAX_SKU_LENGTH)
    }
}
