package com.shopeelister.data.remote.gemini

import android.graphics.Bitmap
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.RequestOptions
import com.google.ai.client.generativeai.type.content
import com.shopeelister.domain.model.SearchResult
import com.squareup.moshi.Moshi
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GeminiService @Inject constructor(
    private val moshi: Moshi
) {
    private val initJob = kotlinx.coroutines.CompletableDeferred<Unit>()
    private var model: GenerativeModel? = null

    fun init(apiKey: String) {
        if (apiKey.isBlank()) {
            android.util.Log.e("GeminiService", "API Key is empty!")
            return
        }
        android.util.Log.d("GeminiService", "Initializing with key: ${apiKey.take(5)}...")
        model = GenerativeModel(
            modelName = "gemini-pro",
            apiKey = apiKey
        )
        initJob.complete(Unit)
    }

    private suspend fun getModel(): GenerativeModel? {
        kotlinx.coroutines.withTimeoutOrNull(5000) { initJob.await() }
        return model
    }
    suspend fun searchProductInfo(ean: String, webEvidence: String? = null): SearchResult {
        val m = getModel() ?: return SearchResult()
        val context = if (!webEvidence.isNullOrBlank()) {
            "Evidências encontradas na web:\n$webEvidence"
        } else ""

        val prompt = """
            Return a JSON object for this e-commerce product.
            EAN/Keyword: $ean
            Context: $context
            
            # NORMALIZATION RULES (2026 BEST PRACTICES)
            1. PREÇO: Retorne SEMPRE um número INTEIRO em centavos (Ex: R$ 15,50 -> 1550). Nunca use pontos ou vírgulas no valor do preço.
            2. DIMENSÕES: Padronize para o formato "Altura x Largura x Comprimento" em centímetros (apenas números e 'x').
            3. PESO: Converta todas as unidades (kg, lb, etc) para Gramas (Integer).
            4. TÍTULO: Remova emojis, excesso de exclamações e normalize espaços.
            5. CATEGORIA: Sugira o nome mais provável para a categoria na Shopee Brasil.
            6. VARIAÇÕES: Se o contexto mencionar múltiplos tamanhos (P, M, G, 38, 40), cores ou versões, crie uma lista no campo "variations". Cada item deve ter "name", "priceCents" (em centavos) e "stock" (use 5 como padrão se não souber).
            
            Return VALID JSON ONLY with fields: "title", "brand", "weightGrams" (Int), "dimensions" (String), "priceCents" (Long), "description", "category", "variations" (List of {name, priceCents, stock}).
        """.trimIndent()

        return try {
            android.util.Log.d("GeminiService", "Calling Gemini with prompt: $prompt")
            val response = m.generateContent(prompt)
            val text = response.text ?: ""
            android.util.Log.d("GeminiService", "Gemini Response: $text")
            parseSearchResult(text)
        } catch (e: Exception) {
            android.util.Log.e("GeminiService", "Gemini Error: ${e.message}")
            SearchResult()
        }
    }

    suspend fun identifyProductFromImage(bitmap: Bitmap): SearchResult {
        val m = getModel() ?: return SearchResult()
        val prompt = """
            Analyze this image and return a JSON object for e-commerce listing.
            Rules:
            1. Fields: "title", "brand", "weightGrams" (Int), "dimensions" (String "HxWxL cm"), "priceCents" (Long em centavos), "description", "category", "variations" (List of {name, priceCents, stock}).
            2. Estimate weight/dimensions from visual context if labels are not visible.
            3. If the image shows multiple sizes/colors, include them in "variations".
            4. Return VALID JSON ONLY.
        """.trimIndent()

        return try {
            val response = m.generateContent(
                content {
                    image(bitmap)
                    text(prompt)
                }
            )
            parseSearchResult(response.text ?: "")
        } catch (_: Exception) {
            SearchResult()
        }
    }

    suspend fun generateDescription(info: SearchResult): String {
        val m = getModel() ?: return ""
        val prompt = """
            Crie uma descrição de produto IRRESISTÍVEL e PERSUASIVA para a Shopee Brasil.
            Regras:
            1. Seja sucinto (máximo 600 caracteres).
            2. Use elementos visuais (bullets com emojis relevantes) para destacar diferenciais.
            3. Destaque os benefícios principais logo no início.
            4. Termine com uma chamada de ação sutil.
            5. Tom de voz: Profissional, confiável e empolgante.
            
            Dados do Produto:
            Título: ${info.title ?: "Produto Selecionado"}
            Marca: ${info.brand ?: "Qualidade Garantida"}
            Categoria: ${info.category ?: "Específica"}
            Preço Médio: R$ ${if (info.priceCents != null) "%.2f".format(info.priceCents / 100.0) else "Consultar"}
            
            Retorne APENAS o texto da descrição final.
        """.trimIndent()

        return try {
            m.generateContent(prompt).text?.trim() ?: ""
        } catch (_: Exception) {
            info.description ?: ""
        }
    }

    suspend fun suggestCategory(info: SearchResult): String {
        val m = getModel() ?: return "Outros"
        val prompt = """
            Dado o produto: "${info.title ?: ""}" da marca "${info.brand ?: ""}".
            Sugira UMA categoria para listagem na Shopee Brasil.
            Retorne APENAS o nome da categoria, sem JSON.
        """.trimIndent()

        return try {
            m.generateContent(prompt).text?.trim() ?: "Outros"
        } catch (_: Exception) {
            info.category ?: "Outros"
        }
    }

    suspend fun improveTitle(title: String, category: String? = null): String {
        val m = getModel() ?: return title
        val prompt = """
            Atue como um especialista em SEO para e-commerce (Shopee Brasil).
            Melhore o seguinte título de produto para maximizar as vendas e buscas.
            Regras:
            1. Formato ideal: [Produto] + [Marca/Modelo] + [Característica Principal] + [Benefício/Tamanho/Cor].
            2. Todas as palavras devem ter a PRIMEIRA LETRA MAIÚSCULA. Não use tudo em maiúsculo (CAIXA ALTA).
            3. Não use emojis.
            4. Limite de 120 caracteres.
            5. Retorne APENAS o novo título, sem aspas, sem formatação markdown e sem explicações adicionais.
            
            Título Original: "$title"
            ${if (category != null) "Categoria/Contexto: $category" else ""}
        """.trimIndent()

        return try {
            val responseText = m.generateContent(prompt).text?.trim() ?: title
            // Clean up any potential markdown quotes and enforce Title Case
            val cleanText = responseText.removePrefix("\"").removeSuffix("\"").trim()
            cleanText.split(" ").joinToString(" ") { word -> 
                word.lowercase().replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() } 
            }
        } catch (_: Exception) {
            title
        }
    }

    private fun parseSearchResult(json: String): SearchResult {
        return try {
            android.util.Log.d("GeminiService", "Raw Response: $json")
            
            // Defensiva: extrair conteúdo entre { }
            val startIndex = json.indexOf('{')
            val endIndex = json.lastIndexOf('}')
            if (startIndex == -1 || endIndex == -1) return SearchResult()
            
            val cleanJson = json.substring(startIndex, endIndex + 1)
            
            // Usar Map para flexibilidade (Moshi pode falhar com tipos se usarmos classe direta e a IA retornar string em vez de int)
            val type = com.squareup.moshi.Types.newParameterizedType(Map::class.java, String::class.java, Any::class.java)
            val adapter = moshi.adapter<Map<String, Any>>(type)
            val map = adapter.fromJson(cleanJson) ?: return SearchResult()

            val variations = (map["variations"] as? List<*>)?.mapNotNull { item ->
                (item as? Map<*, *>)?.let { v ->
                    com.shopeelister.domain.model.Variation(
                        name = v["name"]?.toString() ?: "Padrão",
                        priceCents = v["priceCents"]?.toString()?.filter { it.isDigit() }?.toLongOrNull() ?: 0L,
                        stock = v["stock"]?.toString()?.filter { it.isDigit() }?.toIntOrNull() ?: 1
                    )
                }
            } ?: emptyList()

            SearchResult(
                title = map["title"]?.toString(),
                brand = map["brand"]?.toString(),
                weightGrams = map["weightGrams"]?.toString()?.filter { it.isDigit() }?.toIntOrNull(),
                dimensions = map["dimensions"]?.toString(),
                priceCents = map["priceCents"]?.toString()?.filter { it.isDigit() }?.toLongOrNull(),
                description = map["description"]?.toString(),
                category = map["category"]?.toString(),
                variations = variations
            )
        } catch (e: Exception) {
            android.util.Log.e("GeminiService", "Error parsing: ${e.message}")
            SearchResult()
        }
    }
}

@com.squareup.moshi.JsonClass(generateAdapter = true)
data class SearchResultJson(
    val title: String? = null,
    val brand: String? = null,
    val weightGrams: Int? = null,
    val dimensions: String? = null,
    val priceCents: Long? = null,
    val description: String? = null,
    val category: String? = null
)
