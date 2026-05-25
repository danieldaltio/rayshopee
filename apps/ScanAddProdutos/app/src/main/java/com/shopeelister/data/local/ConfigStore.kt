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
    }

    val shopId: Flow<Long> = context.dataStore.data.map { it[SHOP_ID] ?: 0L }
    val accessToken: Flow<String> = context.dataStore.data.map { it[ACCESS_TOKEN] ?: "" }
    val refreshToken: Flow<String> = context.dataStore.data.map { it[REFRESH_TOKEN] ?: "" }
    val serverUrl: Flow<String> = context.dataStore.data.map { 
        it[SERVER_URL] ?: com.shopeelister.util.Constants.SERVER_BASE_URL
    }
    val groqKey: Flow<String> = context.dataStore.data.map { it[GROQ_KEY] ?: "" }
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

    suspend fun saveServerUrl(url: String) {
        context.dataStore.edit { it[SERVER_URL] = url }
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
