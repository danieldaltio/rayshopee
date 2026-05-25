package com.shopeelister.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shopeelister.data.local.ConfigStore
import com.shopeelister.data.remote.gemini.GeminiService
import com.shopeelister.data.remote.scraper.ScraperApiService
import com.shopeelister.data.remote.cloudinary.CloudinaryService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val partnerId: String = "",
    val partnerKey: String = "",
    val shopId: String = "",
    val accessToken: String = "",
    val groqKey: String = "",
    val cloudinaryCloudName: String = "",
    val cloudinaryApiKey: String = "",
    val cloudinaryApiSecret: String = "",
    val removeBgEnabled: Boolean = true,
    val saved: Boolean = false,
    val authUrl: String? = null,
    val loginStatus: String = "",
    val serverUrl: String = "",
    val logisticsDirect: Boolean = true,
    val logisticsShopeeExpress: Boolean = true,
    val logisticsPickup: Boolean = true
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val configStore: ConfigStore,
    private val shopeeRepository: com.shopeelister.domain.repository.ShopeeRepository,
    private val scraperApiService: ScraperApiService,
    private val cloudinaryService: CloudinaryService
) : ViewModel() {

    private val _state = MutableStateFlow(SettingsUiState())
    val state = _state.asStateFlow()

    init {
        viewModelScope.launch {
            combine(
                configStore.partnerId,
                configStore.partnerKey,
                configStore.shopId,
                configStore.accessToken,
                configStore.groqKey,
                configStore.removeBgEnabled
            ) { values ->
                SettingsUiState(
                    partnerId = values[0] as String,
                    partnerKey = values[1] as String,
                    shopId = (values[2] as Long).toString(),
                    accessToken = values[3] as String,
                    groqKey = values[4] as String,
                    removeBgEnabled = values[5] as Boolean
                )
            }.collect { _state.update { s -> s.copy(partnerId = it.partnerId, partnerKey = it.partnerKey, shopId = it.shopId, accessToken = it.accessToken, groqKey = it.groqKey, removeBgEnabled = it.removeBgEnabled) } }
        }
        viewModelScope.launch {
            combine(
                configStore.cloudinaryCloudName,
                configStore.cloudinaryApiKey,
                configStore.cloudinaryApiSecret
            ) { name, key, secret ->
                Triple(name, key, secret)
            }.collect { (name, key, secret) ->
                _state.value = _state.value.copy(
                    cloudinaryCloudName = name,
                    cloudinaryApiKey = key,
                    cloudinaryApiSecret = secret
                )
                if (name.isNotBlank()) {
                    cloudinaryService.init(name, key, secret)
                }
            }
        }
        viewModelScope.launch {
            configStore.serverUrl.collect { url -> _state.value = _state.value.copy(serverUrl = url) }
        }
        viewModelScope.launch {
            combine(
                configStore.logisticsDirect,
                configStore.logisticsShopeeExpress,
                configStore.logisticsPickup
            ) { direct, express, pickup ->
                Triple(direct, express, pickup)
            }.collect { (direct, express, pickup) ->
                _state.update { it.copy(logisticsDirect = direct, logisticsShopeeExpress = express, logisticsPickup = pickup) }
            }
        }
    }

    fun updatePartnerId(v: String) { _state.value = _state.value.copy(partnerId = v) }
    fun updatePartnerKey(v: String) { _state.value = _state.value.copy(partnerKey = v) }
    fun updateShopId(v: String) { _state.value = _state.value.copy(shopId = v) }
    fun updateAccessToken(v: String) { _state.value = _state.value.copy(accessToken = v) }
    fun updateGroqKey(v: String) { _state.value = _state.value.copy(groqKey = v) }
    fun updateCloudinaryCloudName(v: String) { _state.value = _state.value.copy(cloudinaryCloudName = v) }
    fun updateCloudinaryApiKey(v: String) { _state.value = _state.value.copy(cloudinaryApiKey = v) }
    fun updateCloudinaryApiSecret(v: String) { _state.value = _state.value.copy(cloudinaryApiSecret = v) }
    fun updateRemoveBgEnabled(v: Boolean) { _state.value = _state.value.copy(removeBgEnabled = v) }
    fun updateServerUrl(v: String) { _state.value = _state.value.copy(serverUrl = v) }
    fun updateLogisticsDirect(v: Boolean) { _state.value = _state.value.copy(logisticsDirect = v) }
    fun updateLogisticsShopeeExpress(v: Boolean) { _state.value = _state.value.copy(logisticsShopeeExpress = v) }
    fun updateLogisticsPickup(v: Boolean) { _state.value = _state.value.copy(logisticsPickup = v) }

    fun save() {
        viewModelScope.launch {
            val s = _state.value
            configStore.saveShopeeCredentials(s.partnerId, s.partnerKey)
            configStore.saveShopId(s.shopId.toLongOrNull() ?: 0L)
            configStore.saveAccessToken(s.accessToken)
            configStore.saveGroqKey(s.groqKey)
            configStore.saveCloudinaryCredentials(s.cloudinaryCloudName, s.cloudinaryApiKey, s.cloudinaryApiSecret)
            configStore.saveRemoveBgEnabled(s.removeBgEnabled)
            configStore.saveServerUrl(s.serverUrl)
            configStore.saveLogisticsDirect(s.logisticsDirect)
            configStore.saveLogisticsShopeeExpress(s.logisticsShopeeExpress)
            configStore.saveLogisticsPickup(s.logisticsPickup)

            // Re-init services
            cloudinaryService.init(s.cloudinaryCloudName, s.cloudinaryApiKey, s.cloudinaryApiSecret)

            _state.value = _state.value.copy(saved = true)
        }
    }

    fun fillDefaults() {
        _state.value = _state.value.copy(
            partnerId = com.shopeelister.BuildConfig.SHOPEE_PARTNER_ID,
            partnerKey = com.shopeelister.BuildConfig.SHOPEE_PARTNER_KEY,
            shopId = "263124677",
            serverUrl = com.shopeelister.BuildConfig.SERVER_BASE_URL,
            groqKey = com.shopeelister.BuildConfig.GROQ_API_KEY,
            cloudinaryCloudName = com.shopeelister.BuildConfig.CLOUDINARY_CLOUD_NAME,
            cloudinaryApiKey = com.shopeelister.BuildConfig.CLOUDINARY_API_KEY,
            cloudinaryApiSecret = com.shopeelister.BuildConfig.CLOUDINARY_API_SECRET
        )
    }

    fun generateAuthUrl() {
        val partnerId = _state.value.partnerId.toIntOrNull() ?: return
        val partnerKey = _state.value.partnerKey
        if (partnerKey.isBlank()) return
        viewModelScope.launch {
            val url = shopeeRepository.getAuthUrl("https://www.google.com")
            _state.value = _state.value.copy(authUrl = url)
        }
    }

    private fun calculateHmacSha256(data: String, key: String): String {
        val sha256Hmac = javax.crypto.Mac.getInstance("HmacSHA256")
        val secretKey = javax.crypto.spec.SecretKeySpec(key.toByteArray(), "HmacSHA256")
        sha256Hmac.init(secretKey)
        val bytes = sha256Hmac.doFinal(data.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }

    fun loginShopee(code: String, shopId: String) {
        if (code.isBlank() || shopId.isBlank()) return
        viewModelScope.launch {
            _state.value = _state.value.copy(loginStatus = "Autenticando...")
            val success = shopeeRepository.getAccessToken(code, shopId.toLongOrNull() ?: 0L)
            if (success) {
                _state.value = _state.value.copy(loginStatus = "Sucesso! Token obtido.")
            } else {
                _state.value = _state.value.copy(loginStatus = "Erro ao obter token. Verifique as chaves.")
            }
        }
    }

    fun importFromRayShopee() {
        val url = _state.value.serverUrl
        if (url.isBlank()) {
            _state.value = _state.value.copy(loginStatus = "Erro: URL do Servidor vazia. Digite a URL primeiro.")
            return
        }

        viewModelScope.launch {
            _state.value = _state.value.copy(loginStatus = "Conectando a $url...")
            try {
                val config = scraperApiService.getConfig()
                if (config.isEmpty()) {
                    _state.value = _state.value.copy(loginStatus = "Servidor respondeu vazio.")
                    return@launch
                }
                
                config["partner_id"]?.let { updatePartnerId(it) }
                config["partner_key"]?.let { updatePartnerKey(it) }
                config["shop_id"]?.let { updateShopId(it) }
                config["access_token"]?.let { updateAccessToken(it) }
                config["groq_key"]?.let { updateGroqKey(it) }
                config["cloudinary_cloud_name"]?.let { updateCloudinaryCloudName(it) }
                config["cloudinary_api_key"]?.let { updateCloudinaryApiKey(it) }
                config["cloudinary_api_secret"]?.let { updateCloudinaryApiSecret(it) }
                
                _state.value = _state.value.copy(loginStatus = "Dados importados! Clique em SALVAR para aplicar.")
            } catch (e: Exception) {
                _state.value = _state.value.copy(loginStatus = "Falha na conexão: Verifique a URL e se o servidor está rodando.")
            }
        }
    }
}
