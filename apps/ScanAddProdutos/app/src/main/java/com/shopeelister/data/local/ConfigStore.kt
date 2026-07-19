package com.shopeelister.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore("config")

class ConfigStore(private val context: Context) {
    companion object {
        val SHOP_ID = longPreferencesKey("shop_id")
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val SERVER_URL = stringPreferencesKey("server_url")
        val GROQ_KEY = stringPreferencesKey("groq_key")
        val GEMINI_KEY = stringPreferencesKey("gemini_key")
        val SHOPEE_PARTNER_ID = stringPreferencesKey("shopee_partner_id")
        val SHOPEE_PARTNER_KEY = stringPreferencesKey("shopee_partner_key")
        val REMOVEBG_KEY = stringPreferencesKey("removebg_key")
        val CLOUDINARY_CLOUD_NAME = stringPreferencesKey("cloudinary_cloud_name")
        val CLOUDINARY_API_KEY = stringPreferencesKey("cloudinary_api_key")
        val CLOUDINARY_API_SECRET = stringPreferencesKey("cloudinary_api_secret")
        val REMOVE_BG_ENABLED = stringPreferencesKey("remove_bg_enabled")
        val LOGISTICS_DIRECT = stringPreferencesKey("logistics_direct")
        val LOGISTICS_SHOPEE_EXPRESS = stringPreferencesKey("logistics_shopee_express")
        val LOGISTICS_PICKUP = stringPreferencesKey("logistics_pickup")

        /** Delimitador CSV das URLs em `SERVER_URL` (lista de URLs do usuário). */
        const val CSV_SEPARATOR = ","
    }

    val shopId: Flow<Long> = context.dataStore.data.map { it[SHOP_ID] ?: 0L }
    val accessToken: Flow<String> = context.dataStore.data.map { it[ACCESS_TOKEN] ?: "" }
    val refreshToken: Flow<String> = context.dataStore.data.map { it[REFRESH_TOKEN] ?: "" }

    /**
     * URL primária (1ª da lista) configurada pelo usuário — para UI single-field
     * e casos como `importFromRayShopee()`. Se nenhuma URL foi configurada,
     * retorna fallback de [com.shopeelister.util.Constants.SERVER_BASE_URL].
     *
     * **Storage:** chave `server_url` armazena a lista inteira como CSV
     * (ex.: `url1,url2`). Este flow só expõe a primeira URL.
     *
     * Para lista completa, use [serverUrls]. Para salvar, use
     * [saveServerUrl] (uma) ou [saveServerUrls] (várias).
     */
    val serverUrl: Flow<String> = context.dataStore.data.map { prefs ->
        val csv = prefs[SERVER_URL].orEmpty()
        if (csv.isBlank()) com.shopeelister.util.Constants.SERVER_BASE_URL
        else csv.split(CSV_SEPARATOR).map { it.trim().removeSuffix("/") }
            .filter { it.isNotBlank() }
            .firstOrNull()
            ?: com.shopeelister.util.Constants.SERVER_BASE_URL
    }

    /**
     * Lista completa de URLs configuradas pelo usuário — parsed do CSV em `server_url`.
     * Lista vazia se o usuário nunca configurou nada.
     *
     * **Backward compat:** o valor antigo (uma única URL sem vírgula) é tratado
     * como lista de 1 elemento ao parsear.
     */
    val serverUrls: Flow<List<String>> = context.dataStore.data.map { prefs ->
        val raw = prefs[SERVER_URL].orEmpty()
        if (raw.isBlank()) emptyList()
        else raw.split(CSV_SEPARATOR)
            .map { it.trim().removeSuffix("/") }
            .filter { it.isNotBlank() }
    }

    val groqKey: Flow<String> = context.dataStore.data.map { it[GROQ_KEY] ?: "" }
    val geminiKey: Flow<String> = context.dataStore.data.map { it[GEMINI_KEY] ?: "" }
    val partnerId: Flow<String> = context.dataStore.data.map { it[SHOPEE_PARTNER_ID] ?: "" }
    val partnerKey: Flow<String> = context.dataStore.data.map { it[SHOPEE_PARTNER_KEY] ?: "" }
    val removeBgKey: Flow<String> = context.dataStore.data.map { it[REMOVEBG_KEY] ?: "" }
    val cloudinaryCloudName: Flow<String> = context.dataStore.data.map { it[CLOUDINARY_CLOUD_NAME] ?: "" }
    val cloudinaryApiKey: Flow<String> = context.dataStore.data.map { it[CLOUDINARY_API_KEY] ?: "" }
    val cloudinaryApiSecret: Flow<String> = context.dataStore.data.map { it[CLOUDINARY_API_SECRET] ?: "" }
    val removeBgEnabled: Flow<Boolean> = context.dataStore.data.map {
        (it[REMOVE_BG_ENABLED] ?: "true") == "true"
    }

    val logisticsDirect: Flow<Boolean> = context.dataStore.data.map {
        (it[LOGISTICS_DIRECT] ?: "true") == "true"
    }
    val logisticsShopeeExpress: Flow<Boolean> = context.dataStore.data.map {
        (it[LOGISTICS_SHOPEE_EXPRESS] ?: "true") == "true"
    }
    val logisticsPickup: Flow<Boolean> = context.dataStore.data.map {
        (it[LOGISTICS_PICKUP] ?: "true") == "true"
    }

    suspend fun saveTokens(access: String, refresh: String, shopId: Long) {
        context.dataStore.edit {
            it[ACCESS_TOKEN] = access
            it[REFRESH_TOKEN] = refresh
            it[SHOP_ID] = shopId
        }
    }

    suspend fun saveGroqKey(key: String) {
        context.dataStore.edit { it[GROQ_KEY] = key }
    }

    suspend fun saveGeminiKey(key: String) {
        context.dataStore.edit { it[GEMINI_KEY] = key }
    }

    suspend fun saveShopeeCredentials(partnerId: String, partnerKey: String) {
        context.dataStore.edit {
            it[SHOPEE_PARTNER_ID] = partnerId
            it[SHOPEE_PARTNER_KEY] = partnerKey
        }
    }

    suspend fun saveRemoveBgKey(key: String) {
        context.dataStore.edit { it[REMOVEBG_KEY] = key }
    }

    suspend fun saveCloudinaryCredentials(cloudName: String, apiKey: String, apiSecret: String) {
        context.dataStore.edit {
            it[CLOUDINARY_CLOUD_NAME] = cloudName
            it[CLOUDINARY_API_KEY] = apiKey
            it[CLOUDINARY_API_SECRET] = apiSecret
        }
    }

    suspend fun saveRemoveBgEnabled(enabled: Boolean) {
        context.dataStore.edit { it[REMOVE_BG_ENABLED] = enabled.toString() }
    }

    suspend fun saveShopId(id: Long) {
        context.dataStore.edit { it[SHOP_ID] = id }
    }

    suspend fun saveAccessToken(token: String) {
        context.dataStore.edit { it[ACCESS_TOKEN] = token }
    }

    /**
     * Persiste UMA URL como CSV de 1 elemento (formato `server_url:url1`).
     * Mantido pra compat com `importFromRayShopee()` da UI que setta um único valor.
     * Pra salvar várias URLs de uma vez, use [saveServerUrls].
     */
    suspend fun saveServerUrl(url: String) {
        context.dataStore.edit { it[SERVER_URL] = url }
    }

    /**
     * Persiste a lista de URLs do usuário (CSV). Lista vazia apaga (string `""`).
     *
     * **Importante:** URLs devem estar normalizadas (sem `/` final) antes de chamar.
     */
    suspend fun saveServerUrls(urls: List<String>) {
        val normalized = urls
            .map { it.trim().removeSuffix("/") }
            .filter { it.isNotBlank() }
        val joined = normalized.joinToString(CSV_SEPARATOR)
        context.dataStore.edit { it[SERVER_URL] = joined }
    }

    suspend fun saveLogisticsDirect(enabled: Boolean) {
        context.dataStore.edit { it[LOGISTICS_DIRECT] = enabled.toString() }
    }

    suspend fun saveLogisticsShopeeExpress(enabled: Boolean) {
        context.dataStore.edit { it[LOGISTICS_SHOPEE_EXPRESS] = enabled.toString() }
    }

    suspend fun saveLogisticsPickup(enabled: Boolean) {
        context.dataStore.edit { it[LOGISTICS_PICKUP] = enabled.toString() }
    }
}
