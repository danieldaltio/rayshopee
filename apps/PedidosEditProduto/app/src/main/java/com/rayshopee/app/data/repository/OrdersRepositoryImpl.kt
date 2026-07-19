package com.rayshopee.app.data.repository

import com.rayshopee.app.orders.OrdersResponse
import com.rayshopee.app.orders.parseOrdersResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Extrai a mensagem amigável de uma resposta JSON de erro da Shopee.
 *
 * A API devolve 2 formatos:
 * 1. HTTP 2xx com body `{"success":false,"message":"Update price failed, please try later."}`
 * 2. HTTP 4xx/5xx com body igual ou com stack trace
 *
 * Antes (2026-07-04) o app jogava o JSON cru como `e.message`, o que produzia diálogos
 * tipo `Falha ao atualizar price: {"success":false,"message":"Update price failed..."}`
 * — confuso pro usuário.
 *
 * Agora: retorna só o `message` se o body for JSON com `success:false`, ou o body
 * inteiro se não for JSON, ou um fallback "Erro <code>" se vazio.
 */
private fun extractFriendlyError(rawBody: String?, httpCode: Int): String {
    if (rawBody.isNullOrBlank()) return "Erro $httpCode"
    return try {
        val json = JSONObject(rawBody)
        // Tenta extrair "message"; cai pra "error" se faltar; cai pro body cru.
        json.optString("message").takeIf { it.isNotBlank() }
            ?: json.optString("error").takeIf { it.isNotBlank() }
            ?: rawBody
    } catch (e: Exception) {
        // Não é JSON: usa o body direto (ex.: HTML de erro do ngrok/cloudflare)
        rawBody
    }
}

/**
 * Implementação do [OrdersRepository] usando `HttpURLConnection` puro.
 *
 * Preserva o comportamento da lógica de rede que vivia inline na antiga
 * `OrdersScreen.kt` (versão pré-refatoração, hoje removida):
 * - Mesmas timeouts
 * - Mesmos headers (incluindo `bypass-tunnel-reminder: true` para ngrok)
 * - Mesmo parsing via [parseOrdersResponse] (testado em `OrdersResponseParserTest`)
 *
 * **Por que HttpURLConnection e não Retrofit?**
 * O caminho vivo funciona com HttpURLConnection. Retrofit/OkHttp já estão no
 * classpath (ver `libs.versions.toml`) mas não são usados em runtime por esta
 * implementação; podem ser adotados no futuro substituindo este impl — a interface
 * [OrdersRepository] permanece a mesma.
 *
 * **Hilt:** instanciado por [OrdersRepositoryModule] e injetado no
 * [com.rayshopee.app.ui.screens.OrdersViewModel].
 */
@Singleton
class OrdersRepositoryImpl @Inject constructor() : OrdersRepository {

    companion object {
        // Timeouts (em ms) — preservados do código original pré-refatoração.
        private const val CONNECT_TIMEOUT_MS = 15_000
        private const val READ_TIMEOUT_GET_MS = 30_000
        private const val READ_TIMEOUT_POST_MS = 60_000
    }

    override suspend fun fetchOrdersToShip(baseUrl: String): Result<List<OrdersResponse>> =
        withContext(Dispatchers.IO) {
            try {
                val url = "$baseUrl/api/orders/to-ship"
                val conn = URL(url).openConnection() as HttpURLConnection
                conn.connectTimeout = CONNECT_TIMEOUT_MS
                conn.readTimeout = READ_TIMEOUT_GET_MS
                conn.setRequestProperty("Connection", "close")
                conn.setRequestProperty("Accept-Encoding", "identity")
                conn.setRequestProperty("bypass-tunnel-reminder", "true")
                conn.setRequestProperty("User-Agent", "PedidosEditProduto/1.0")

                val code = conn.responseCode
                if (code != 200) {
                    val errorBody = conn.errorStream?.bufferedReader()?.readText() ?: "Erro $code"
                    return@withContext Result.failure(Exception("HTTP $code - $errorBody"))
                }

                val response = conn.inputStream.bufferedReader().readText()
                when (val parsed = parseOrdersResponse(response)) {
                    is com.rayshopee.app.orders.ParseResult.Success ->
                        Result.success(parsed.value)
                    is com.rayshopee.app.orders.ParseResult.Failure ->
                        Result.failure(Exception(parsed.error))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.message ?: "Erro desconhecido"))
            }
        }

    override suspend fun updateProductValue(
        baseUrl: String,
        endpoint: String,
        body: JSONObject
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl$endpoint"
            val conn = URL(url).openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.connectTimeout = CONNECT_TIMEOUT_MS
            conn.readTimeout = READ_TIMEOUT_POST_MS
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("Connection", "close")
            conn.setRequestProperty("Accept-Encoding", "identity")
            conn.setRequestProperty("bypass-tunnel-reminder", "true")

            conn.outputStream.use { it.write(body.toString().toByteArray()) }

            val code = conn.responseCode
            // Lê o body do stream certo: errorStream em 4xx/5xx, inputStream em 2xx.
            // (Não dá pra chamar os dois — um fecha o outro.)
            val responseText = if (code in 200..299) {
                conn.inputStream.bufferedReader().readText()
            } else {
                conn.errorStream?.bufferedReader()?.readText() ?: ""
            }

            if (code !in 200..299) {
                // HTTP não-2xx: extrai mensagem amigável do JSON de erro.
                return@withContext Result.failure(Exception(extractFriendlyError(responseText, code)))
            }

            // HTTP 2xx: checa se o body tem `success:false`. Algumas rotas Shopee
            // devolvem 200 com payload de erro (em vez de 4xx). Sem essa checagem
            // (que era o comportamento até 2026-07-04) o app achava que tinha
            // atualizado o preço e fechava o diálogo — bug crítico.
            try {
                val json = JSONObject(responseText)
                if (json.optBoolean("success", true) == false) {
                    val msg = json.optString("message").takeIf { it.isNotBlank() }
                        ?: "Operação recusada pela Shopee"
                    return@withContext Result.failure(Exception(msg))
                }
            } catch (e: Exception) {
                // Body não é JSON: assume sucesso (comportamento legado).
                // Provavelmente endpoint retornou string vazia ou HTML parcial.
            }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Erro desconhecido"))
        }
    }
}