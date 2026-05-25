package com.shopeelister.data.remote.shopee

import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import com.shopeelister.data.local.ConfigStore

class ShopeeAuthInterceptor(
    private val configStore: ConfigStore
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val url = original.url
        val isPublicApi = url.encodedPath.contains("/auth/token/get") || url.encodedPath.contains("/auth/access_token/get")

        val partnerId: String
        val partnerKey: String
        val accessToken: String
        val refreshToken: String
        val shopId: Long

        runBlocking {
            partnerId = configStore.partnerId.first().trim().ifBlank { com.shopeelister.BuildConfig.SHOPEE_PARTNER_ID }
            partnerKey = configStore.partnerKey.first().trim().ifBlank { com.shopeelister.BuildConfig.SHOPEE_PARTNER_KEY }
            accessToken = configStore.accessToken.first().trim().ifBlank { com.shopeelister.BuildConfig.SHOPEE_ACCESS_TOKEN }
            refreshToken = configStore.refreshToken.first().trim().ifBlank { com.shopeelister.BuildConfig.SHOPEE_REFRESH_TOKEN }
            shopId = configStore.shopId.first().takeIf { it > 0 } 
                ?: (com.shopeelister.BuildConfig.SHOPEE_SHOP_ID.toLongOrNull() ?: 0L)
        }

        if (partnerId.isBlank() || partnerKey.isBlank()) {
            android.util.Log.e("ShopeeAuth", "Partner ID or Key is blank!")
            return chain.proceed(original)
        }

        val newRequest = buildSignedRequest(original, partnerId, partnerKey, accessToken, shopId, isPublicApi)
        var response = chain.proceed(newRequest)

        // Verificamos se houve erro de autenticação.
        var isAuthError = !response.isSuccessful && response.code == 403
        
        if (response.isSuccessful && !isPublicApi) {
            try {
                val peekedBody = response.peekBody(1024 * 1024).string()
                if (peekedBody.contains("\"error\":\"error_auth\"") || 
                    peekedBody.contains("\"error\":\"invalid_access_token\"") || 
                    peekedBody.contains("\"error\":\"error_token_expired\"")) {
                    isAuthError = true
                    android.util.Log.e("ShopeeAuth", "Auth error inside JSON: $peekedBody")
                }
            } catch (e: Exception) {
                // Ignore
            }
        }

        if (isAuthError && !isPublicApi && refreshToken.isNotBlank()) {
            android.util.Log.e("ShopeeAuth", "Token expired or invalid! Attempting to refresh...")
            response.close() // Close original response to prevent leaks

            val newTokens = doRefreshToken(chain, partnerId, partnerKey, shopId, refreshToken)
            if (newTokens != null) {
                val newAccessToken = newTokens.first
                val newRefreshToken = newTokens.second
                
                android.util.Log.d("ShopeeAuth", "Token refresh successful! Retrying request...")
                runBlocking {
                    configStore.saveTokens(newAccessToken, newRefreshToken, shopId)
                }

                // Retry original request with new token
                val retriedRequest = buildSignedRequest(original, partnerId, partnerKey, newAccessToken, shopId, false)
                response = chain.proceed(retriedRequest)
            } else {
                android.util.Log.e("ShopeeAuth", "Token refresh failed.")
                // Retornamos um response sintético se quisermos, ou o ultimo response de erro (se pudessemos, mas fechamos)
                // Vamos tentar fazer a request de novo pra devolver o erro final pro Retrofit
                return chain.proceed(newRequest) 
            }
        }
        
        return response
    }

    private fun buildSignedRequest(
        original: Request,
        partnerId: String,
        partnerKey: String,
        accessToken: String,
        shopId: Long,
        isPublicApi: Boolean
    ): Request {
        val url = original.url
        val path = url.encodedPath
        val timestamp = (System.currentTimeMillis() / 1000).toString()
        
        val signString = if (isPublicApi) {
            partnerId + path + timestamp
        } else {
            partnerId + path + timestamp + accessToken + shopId
        }
        
        val sign = hmacSha256(partnerKey, signString)

        val urlBuilder = url.newBuilder()
            // setQueryParameter substitui se existir, evitando duplicar na retry
            .setQueryParameter("partner_id", partnerId)
            .setQueryParameter("timestamp", timestamp)
            .setQueryParameter("sign", sign)

        if (!isPublicApi) {
            urlBuilder.setQueryParameter("access_token", accessToken)
            urlBuilder.setQueryParameter("shop_id", shopId.toString())
        }

        return original.newBuilder().url(urlBuilder.build()).build()
    }

    private fun doRefreshToken(
        chain: Interceptor.Chain,
        partnerId: String,
        partnerKey: String,
        shopId: Long,
        refreshToken: String
    ): Pair<String, String>? {
        try {
            val timestamp = (System.currentTimeMillis() / 1000).toString()
            val path = "/api/v2/auth/access_token/get"
            val signString = partnerId + path + timestamp
            val sign = hmacSha256(partnerKey, signString)

            // Build URL from scratch using the correct Shopee base URL
            val refreshUrl = "https://partner.shopeemobile.com${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}"
            
            android.util.Log.d("ShopeeAuth", "Refresh URL: $refreshUrl")

            val jsonBody = """{"shop_id":$shopId,"refresh_token":"$refreshToken","partner_id":${partnerId.toLongOrNull() ?: 0}}"""
            
            android.util.Log.d("ShopeeAuth", "Refresh Body: $jsonBody")

            val body = jsonBody.toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())

            // Use a separate OkHttpClient to avoid interceptor recursion
            val refreshClient = okhttp3.OkHttpClient.Builder()
                .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                .build()

            val refreshRequest = Request.Builder()
                .url(refreshUrl)
                .post(body)
                .addHeader("Content-Type", "application/json")
                .build()

            val refreshResponse = refreshClient.newCall(refreshRequest).execute()
            
            android.util.Log.d("ShopeeAuth", "Refresh HTTP Status: ${refreshResponse.code}")
            
            val respStr = refreshResponse.body?.string()
            android.util.Log.d("ShopeeAuth", "Refresh Response: $respStr")

            if (refreshResponse.isSuccessful && respStr != null) {
                if (respStr.contains("\"access_token\"")) {
                    val accTokenRegex = "\"access_token\"\\s*:\\s*\"([^\"]+)\"".toRegex()
                    val refTokenRegex = "\"refresh_token\"\\s*:\\s*\"([^\"]+)\"".toRegex()
                    
                    val newAcc = accTokenRegex.find(respStr)?.groupValues?.get(1)
                    val newRef = refTokenRegex.find(respStr)?.groupValues?.get(1)
                    
                    if (newAcc != null && newRef != null) {
                        android.util.Log.d("ShopeeAuth", "Got new access_token: ${newAcc.take(10)}...")
                        android.util.Log.d("ShopeeAuth", "Got new refresh_token: ${newRef.take(10)}...")
                        return Pair(newAcc, newRef)
                    }
                }
                // Check for error in the response
                if (respStr.contains("\"error\"")) {
                    android.util.Log.e("ShopeeAuth", "Shopee refresh error: $respStr")
                }
            } else {
                android.util.Log.e("ShopeeAuth", "Refresh failed HTTP ${refreshResponse.code}: $respStr")
            }
        } catch (e: Exception) {
            android.util.Log.e("ShopeeAuth", "Refresh exception: ${e.message}", e)
        }
        return null
    }

    private fun hmacSha256(key: String, data: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(key.toByteArray(), "HmacSHA256"))
        val hash = mac.doFinal(data.toByteArray())
        return hash.joinToString("") { "%02x".format(it) }
    }
}
