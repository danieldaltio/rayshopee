package com.shopeelister.util

object Constants {
    const val SHOPEE_BASE_URL = "https://partner.shopeemobile.com"
    const val SERVER_BASE_URL = "http://localhost:3003"
    const val REMOVEBG_BASE_URL = "https://api.remove.bg/v1.0/"
    /**
     * Base URL da Google Gemini API.
     *
     * O `GeminiService` usa o SDK oficial `com.google.ai.client.generativeai`
     * que aponta automaticamente para `generativelanguage.googleapis.com/v1beta/`.
     * Esta constante fica aqui como referência caso algum dia queiramos migrar
     * para chamadas HTTP nativas (OpenAI-compat ainda não exposto pela Google
     * para Gemini em 2026-07).
     *
     * Substitui o antigo `GROQ_BASE_URL` (Groq descontinuou `llama-3.3-70b-versatile`
     * em 2026-08-16; Groq foi removido do app em 2026-07-03).
     */
    const val GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/"
    const val DEFAULT_WIDTH_CM = 14
    const val DEFAULT_HEIGHT_CM = 14
    const val DEFAULT_LENGTH_CM = 14
    const val DEFAULT_WEIGHT_GRAMS = 500
    const val PACKAGE_PADDING_CM = 4
    const val PACKAGE_WEIGHT_PADDING_GRAMS = 100
    const val DEFAULT_STOCK = 1
    const val MAX_TITLE_LENGTH = 120
    const val MAX_SKU_LENGTH = 20
}
