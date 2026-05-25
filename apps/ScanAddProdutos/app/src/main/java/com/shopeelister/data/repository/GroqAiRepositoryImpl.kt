package com.shopeelister.data.repository

import android.graphics.Bitmap
import com.shopeelister.BuildConfig
import com.shopeelister.data.remote.groq.*
import com.shopeelister.domain.model.SearchResult
import com.shopeelister.domain.model.Variation
import com.shopeelister.domain.repository.AiRepository
import com.squareup.moshi.Moshi
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GroqAiRepositoryImpl @Inject constructor(
    private val groqApiService: GroqApiService,
    private val moshi: Moshi,
    private val configStore: com.shopeelister.data.local.ConfigStore
) : AiRepository {

    private suspend fun getApiKey(): String {
        return configStore.groqKey.first().ifBlank { BuildConfig.GROQ_API_KEY }
    }

    override suspend fun searchProductInfo(ean: String, webEvidence: String?): SearchResult {
        val context = if (!webEvidence.isNullOrBlank()) {
            "Evidências encontradas na web:\n$webEvidence"
        } else ""

        val prompt = """
            Return a VALID JSON object for this e-commerce product.
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
            val request = GroqRequest(
                messages = listOf(
                    GroqMessage("system", "You are a specialized e-commerce data extractor. Always return valid JSON."),
                    GroqMessage("user", prompt)
                ),
                responseFormat = GroqResponseFormat()
            )
            val apiKey = getApiKey()
            val response = groqApiService.chatCompletion("Bearer $apiKey", request)
            val json = response.choices.firstOrNull()?.message?.content ?: ""
            parseSearchResult(json)
        } catch (e: Exception) {
            android.util.Log.e("GroqRepository", "Error: ${e.message}")
            SearchResult()
        }
    }

    override suspend fun identifyProductFromImage(bitmap: Bitmap): SearchResult {
        // Groq doesn't support images yet in the free tier llama3 models
        return SearchResult()
    }

    override suspend fun generateDescription(productInfo: SearchResult): String {
        val prompt = """
            Crie uma descrição de produto IRRESISTÍVEL e PERSUASIVA para a Shopee Brasil.
            Regras:
            1. Seja sucinto (máximo 600 caracteres).
            2. Use elementos visuais (bullets com emojis relevantes) para destacar diferenciais.
            3. Destaque os benefícios principais logo no início.
            4. Termine com uma chamada de ação sutil.
            5. Tom de voz: Profissional, confiável e empolgante.
            
            Dados do Produto:
            Título: ${productInfo.title ?: "Produto Selecionado"}
            Marca: ${productInfo.brand ?: "Qualidade Garantida"}
            Categoria: ${productInfo.category ?: "Específica"}
            Preço Médio: R$ ${if (productInfo.priceCents != null) "%.2f".format(productInfo.priceCents / 100.0) else "Consultar"}
            
            Retorne APENAS o texto da descrição final.
        """.trimIndent()

        return try {
            val request = GroqRequest(
                messages = listOf(
                    GroqMessage("system", "You are a professional copywriter for Shopee Brazil."),
                    GroqMessage("user", prompt)
                )
            )
            val apiKey = getApiKey()
            android.util.Log.d("GroqAiRepository", "API KEY: ${apiKey.take(5)}...")
            val response = groqApiService.chatCompletion("Bearer $apiKey", request)
            val content = response.choices.firstOrNull()?.message?.content?.trim() ?: ""
            android.util.Log.d("GroqAiRepository", "Groq Response Content: $content")
            content
        } catch (e: Exception) {
            android.util.Log.e("GroqAiRepository", "FATAL AI ERROR", e)
            productInfo.description ?: ""
        }
    }

    override suspend fun suggestCategory(productInfo: SearchResult): String {
        val prompt = """
            Você é um assistente especializado em E-commerce e SEO para Shopee Brasil.
            Tarefa: Qual é a categoria 'leaf' (nível final) da Shopee Brasil para o produto: ${productInfo.title ?: ""}?
            
            IMPORTANTE:
            - Se o produto for de Churrasco, Cozinha ou Casa, JAMAIS sugira categorias de 'Beleza' ou 'Cabelo'.
            - Foque em 'Casa e Decoração > Utensílios de Cozinha > Utensílios para Churrasco' se for o caso.
            - Retorne APENAS o caminho completo ou o nome final da categoria.
            - Sem explicações, apenas o texto.
        """.trimIndent()

        return try {
            android.util.Log.d("GroqAiRepository", "Prompt: $prompt")
            val request = GroqRequest(
                messages = listOf(
                    GroqMessage("system", "You are a professional copywriter for Shopee Brazil."),
                    GroqMessage("user", prompt)
                )
            )
            val apiKey = getApiKey()
            android.util.Log.d("GroqAiRepository", "API KEY: ${apiKey.take(5)}...")
            val response = groqApiService.chatCompletion("Bearer $apiKey", request)
            val suggested = response.choices.firstOrNull()?.message?.content?.trim() ?: "Outros"
            android.util.Log.d("GroqAiRepository", "AI Suggested Category: $suggested")
            suggested
        } catch (e: Exception) {
            productInfo.category ?: "Outros"
        }
    }

    override suspend fun improveTitle(title: String, category: String?): String {
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
            val request = GroqRequest(
                messages = listOf(
                    GroqMessage("system", "You are an SEO expert for Shopee Brazil."),
                    GroqMessage("user", prompt)
                )
            )
            val apiKey = getApiKey()
            val response = groqApiService.chatCompletion("Bearer $apiKey", request)
            val improved = response.choices.firstOrNull()?.message?.content?.trim() ?: title
            // Clean up any potential markdown quotes and enforce Title Case
            val cleanText = improved.removePrefix("\"").removeSuffix("\"").trim()
            cleanText.split(" ").joinToString(" ") { word -> 
                word.lowercase().replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() } 
            }
        } catch (e: Exception) {
            title
        }
    }

    private fun parseSearchResult(json: String): SearchResult {
        return try {
            val startIndex = json.indexOf('{')
            val endIndex = json.lastIndexOf('}')
            if (startIndex == -1 || endIndex == -1) return SearchResult()
            val cleanJson = json.substring(startIndex, endIndex + 1)

            val type = com.squareup.moshi.Types.newParameterizedType(Map::class.java, String::class.java, Any::class.java)
            val adapter = moshi.adapter<Map<String, Any>>(type)
            val map = adapter.fromJson(cleanJson) ?: return SearchResult()

            val variations = (map["variations"] as? List<*>)?.mapNotNull { item ->
                (item as? Map<*, *>)?.let { v ->
                    Variation(
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
            SearchResult()
        }
    }
}
