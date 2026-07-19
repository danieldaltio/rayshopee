package com.rayshopee.app.ui.screens

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rayshopee.app.data.model.Product
import com.rayshopee.app.data.model.ProductSearchResult
import com.rayshopee.app.data.model.ProductVariation
import com.rayshopee.app.data.prefs.SsidMapping
import com.rayshopee.core.network.NsdDiscovery
import com.rayshopee.core.network.NetworkConfig
import com.rayshopee.core.network.NetworkMonitor
import com.rayshopee.core.network.SsidResolver
import com.rayshopee.app.data.repository.OfflineQueuedException
import com.rayshopee.app.data.repository.ProductRepository
import com.rayshopee.app.util.BeepPlayer
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import javax.inject.Inject

sealed interface ScannerIntent {
    data class BarcodeScanned(val barcode: String) : ScannerIntent
    data class ItemIdSearch(val itemId: String) : ScannerIntent
    data class NameSearch(val query: String) : ScannerIntent
    data class OpenFromSearchResult(val itemId: String) : ScannerIntent
    data object ClearSearchResults : ScannerIntent
    data class UpdatePrice(val variationId: String, val price: Double) : ScannerIntent
    data class UpdateStock(val variationId: String, val stock: Int) : ScannerIntent
    data class UpdateCost(val variationId: String, val cost: Double) : ScannerIntent
    data object ClearError : ScannerIntent
    data object ClearProduct : ScannerIntent
    /** Persiste a lista de URLs configuradas pelo usuário (Settings). */
    data class SetUserUrls(val urls: List<String>) : ScannerIntent
    /** 🆕 2026-07-18: força re-descoberta de LAN + mDNS + health-check. */
    data object RefreshNetwork : ScannerIntent
    /** 🆕 2026-07-18: apaga mapping SSID → URL (user pediu pra esquecer). */
    data class ForgetSsidMapping(val ssid: String) : ScannerIntent
    /** 🆕 2026-07-18: apaga TODAS as SSID mappings. */
    data object ClearAllSsidMappings : ScannerIntent
    /** 🆕 2026-07-18: seta a URL atual como mapping do SSID atual (aprendizado manual). */
    data object SaveCurrentAsSsidMapping : ScannerIntent
    /** 🆕 2026-07-18: pediu permissão de localização. */
    data class LocationPermissionResult(val granted: Boolean) : ScannerIntent
}

data class ScannerUiState(
    val isLoading: Boolean = false,
    val isSearching: Boolean = false,
    val product: Product? = null,
    val error: ScannerErrorKind? = null,
    val warning: String? = null,
    val lastScannedBarcode: String? = null,
    val isUpdating: Boolean = false,
    val isOnline: Boolean? = null,
    val searchResults: List<ProductSearchResult> = emptyList(),
    val lastSearchQuery: String? = null,
    val userUrls: List<String> = emptyList(),
    val candidates: List<String> = listOf(NetworkConfig.DEFAULT_CLOUDFLARE_URL),
    // 🆕 2026-07-18 (Sprint 1.5) — Settings dialog enhancements
    /** SSID do Wi-Fi atual (null se sem Wi-Fi / 4G / sem permissão). */
    val currentSsid: String? = null,
    /** Mapeamentos SSID → URL salvos (read-only). */
    val ssidMappings: Map<String, String> = emptyMap(),
    /** Se tem permissão de localização (necessária pra ler SSID). */
    val hasLocationPermission: Boolean = false,
    /** Status do refresh manual (true durante scan). */
    val isRefreshing: Boolean = false,
    /** Mensagem de feedback do último refresh ("✅ Achou X" / "❌ Não achou"). */
    val refreshFeedback: String? = null
)

@HiltViewModel
class ScannerViewModel @Inject constructor(
    private val productRepository: ProductRepository,
    private val networkMonitor: NetworkMonitor,
    private val beepPlayer: BeepPlayer,
    private val networkConfig: NetworkConfig,
    private val ssidResolver: SsidResolver,
    private val ssidMapping: SsidMapping,
    private val nsdDiscovery: NsdDiscovery
) : ViewModel() {

    private val _uiState = MutableStateFlow(ScannerUiState())
    val uiState: StateFlow<ScannerUiState> = _uiState.asStateFlow()

    /** Re-exposes BeepPlayer.isMuted pra UI bindar o toggle da TopBar. */
    val isMuted: StateFlow<Boolean> = beepPlayer.isMuted

    /** Liga/desliga o som dos bips. Persistido em SharedPreferences via BeepPlayer. */
    fun toggleMuted() = beepPlayer.toggleMuted()

    private var lastScannedTime = 0L
    private val scanCooldown = 2000L

    init {
        observeNetworkState()
        checkHealthPeriodically()
        observeNetworkConfig()
        observeSsidAndMappings()  // 🆕 Sprint 1.5
    }

    /**
     * Observa [NetworkConfig.userUrls] e [NetworkConfig.candidates] em background
     * e mantém [ScannerUiState.userUrls]/[ScannerUiState.candidates] sincronizados.
     *
     * Adicionado em 2026-07-04 pra dar feedback à UI do Settings (preview da
     * ordem final de tentativa, com LAN + cloudflare inclusos).
     */
    private fun observeNetworkConfig() {
        viewModelScope.launch {
            networkConfig.userUrls.collect { urls ->
                _uiState.value = _uiState.value.copy(userUrls = urls)
            }
        }
        viewModelScope.launch {
            networkConfig.candidates.collect { candidates ->
                _uiState.value = _uiState.value.copy(candidates = candidates)
            }
        }
    }

    /**
     * Persiste a lista de URLs no [NetworkConfig] (que delega pro
     * [com.rayshopee.app.data.prefs.SharedPrefsNetworkPreferences]).
     * Lista vazia → apaga (volta pra LAN auto + cloudflare fallback).
     */
    private fun setUserUrls(urls: List<String>) {
        val toPersist = urls
            .map { it.trim().removeSuffix("/") }
            .filter { it.isNotBlank() }
        viewModelScope.launch {
            networkConfig.setUserUrls(toPersist)
        }
    }

    /**
     * UX-02.1: reage instantaneamente a mudanças de rede do device.
     *
     * Antes: pill só atualizava a cada 30s (polling). Se o wifi caísse e
     * voltasse em 3s, o usuário via 🔴 por mais 27s.
     *
     * Agora:
     *  - device ganha rede → assume online + dispara checkHealth pra confirmar
     *  - device perde rede → marca offline IMEDIATO (não espera checkHealth)
     */
    private fun observeNetworkState() {
        viewModelScope.launch {
            networkMonitor.isOnline.collect { deviceOnline ->
                if (deviceOnline) {
                    // Device voltou/ganhou rede — dispara checkHealth imediato
                    // pra confirmar que o servidor responde (não é captive portal).
                    val serverOnline = productRepository.checkHealth()
                    _uiState.value = _uiState.value.copy(isOnline = serverOnline)
                } else {
                    // Device offline — reage AGORA, não espera o próximo poll.
                    _uiState.value = _uiState.value.copy(isOnline = false)
                }
            }
        }
    }

    /**
     * Backup: checkHealth roda a cada 2min pra detectar servidor fora
     * (cenário ngrok/Render caiu mas wifi do device tá ok).
     *
     * Antes era 30s — agora 2min é suficiente porque:
     *  - perda de rede do device já é detectada instantaneamente pelo NetworkCallback
     *  - o que sobra é "servidor caiu sem rede cair", que é raro e não exige
     *    detecção sub-segundo (vendedor aceita esperar 2min pra ver o pill mudar)
     */
    private fun checkHealthPeriodically() {
        viewModelScope.launch {
            while (true) {
                kotlinx.coroutines.delay(120_000L) // 2min
                // Só checa se o device ainda tem rede (senão é desperdício)
                if (networkMonitor.isOnline.value) {
                    val online = productRepository.checkHealth()
                    _uiState.value = _uiState.value.copy(isOnline = online)
                }
            }
        }
    }

    fun processIntent(intent: ScannerIntent) {
        when (intent) {
            is ScannerIntent.BarcodeScanned -> handleBarcodeScanned(intent.barcode)
            is ScannerIntent.ItemIdSearch -> handleItemIdSearch(intent.itemId)
            is ScannerIntent.NameSearch -> handleNameSearch(intent.query)
            is ScannerIntent.OpenFromSearchResult -> handleOpenFromSearchResult(intent.itemId)
            is ScannerIntent.ClearSearchResults -> clearSearchResults()
            is ScannerIntent.UpdatePrice -> handleUpdatePrice(intent.variationId, intent.price)
            is ScannerIntent.UpdateStock -> handleUpdateStock(intent.variationId, intent.stock)
            is ScannerIntent.UpdateCost -> handleUpdateCost(intent.variationId, intent.cost)
            is ScannerIntent.ClearError -> clearError()
            is ScannerIntent.ClearProduct -> clearProduct()
            is ScannerIntent.SetUserUrls -> setUserUrls(intent.urls)
            is ScannerIntent.RefreshNetwork -> handleRefreshNetwork()
            is ScannerIntent.ForgetSsidMapping -> ssidMapping.forget(intent.ssid)
            is ScannerIntent.ClearAllSsidMappings -> ssidMapping.clearAll()
            is ScannerIntent.SaveCurrentAsSsidMapping -> handleSaveCurrentAsSsidMapping()
            is ScannerIntent.LocationPermissionResult -> handleLocationPermissionResult(intent.granted)
        }
    }

    // =========================================================================
    // Sprint 1.5 — Network management handlers
    // =========================================================================

    /**
     * Força re-descoberta de LAN + mDNS + health-check. Chamado pelo botão
     * "🔄 Refresh" no Settings dialog.
     *
     * Faz em paralelo:
     *  - NetworkConfig.refreshLan() — escaneia /24
     *  - NsdDiscovery.discover() — procura _rayshopee._tcp.local
     *  - productRepository.checkHealth() — valida server responde
     * Auto-salva o SSID → URL mapping se achou server novo.
     */
    private fun handleRefreshNetwork() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRefreshing = true, refreshFeedback = "🔄 Procurando servidor...")
            try {
                // 1. Re-scan LAN (invalida cache do NetworkDiscovery)
                networkConfig.refreshLan()
                val lanUrl = networkConfig.lanUrl.value

                // 2. Tenta mDNS em paralelo (rápido se server anuncia)
                val nsdUrl = nsdDiscovery.discover(timeoutMs = 2000L)

                // 3. Health check em cada candidato
                val online = productRepository.checkHealth()

                // 4. Auto-save SSID → URL mapping se achou
                val ssid = ssidResolver.currentSsid()
                val foundUrl = nsdUrl ?: lanUrl
                if (foundUrl != null && ssid != null) {
                    ssidMapping.autoSave(ssid, foundUrl)
                }

                val feedback = buildString {
                    append(if (online) "✅ " else "🟡 ")
                    append("Servidor: ")
                    append(when {
                        nsdUrl != null -> "mDNS achou $nsdUrl"
                        lanUrl != null -> "LAN achou $lanUrl"
                        else -> "não achou automaticamente (${_uiState.value.candidates.size} candidatos configurados)"
                    })
                    if (ssid != null && foundUrl != null) {
                        append(" · mapping SSID '$ssid' salvo")
                    }
                }
                Log.i(TAG, feedback)
                _uiState.value = _uiState.value.copy(
                    isRefreshing = false,
                    refreshFeedback = feedback,
                    isOnline = online
                )
                if (online) beepPlayer.playScan() else beepPlayer.playError()
            } catch (e: Exception) {
                Log.e(TAG, "Refresh falhou", e)
                _uiState.value = _uiState.value.copy(
                    isRefreshing = false,
                    refreshFeedback = "❌ Erro: ${e.message}"
                )
                beepPlayer.playError()
            }
        }
    }

    private fun handleSaveCurrentAsSsidMapping() {
        val ssid = ssidResolver.currentSsid() ?: run {
            _uiState.value = _uiState.value.copy(refreshFeedback = "⚠️ Sem SSID (4G ou sem permissão)")
            return
        }
        // Pega a primeira URL que está em candidates (que está funcionando)
        val currentUrl = _uiState.value.candidates.firstOrNull() ?: run {
            _uiState.value = _uiState.value.copy(refreshFeedback = "⚠️ Nenhuma URL configurada")
            return
        }
        ssidMapping.save(ssid, currentUrl)
        _uiState.value = _uiState.value.copy(refreshFeedback = "✅ Salvo: $ssid → $currentUrl")
        beepPlayer.playEdit()
    }

    private fun handleLocationPermissionResult(granted: Boolean) {
        _uiState.value = _uiState.value.copy(
            hasLocationPermission = granted,
            currentSsid = if (granted) ssidResolver.currentSsid() else null
        )
    }

    /**
     * Observa mudanças no SSID atual + mappings + permission.
     * Chamado no init.
     */
    private fun observeSsidAndMappings() {
        _uiState.value = _uiState.value.copy(
            hasLocationPermission = ssidResolver.hasLocationPermission(),
            currentSsid = ssidResolver.currentSsid(),
            ssidMappings = ssidMapping.mappings.value
        )
        viewModelScope.launch {
            ssidMapping.mappings.collect { m ->
                _uiState.value = _uiState.value.copy(ssidMappings = m)
            }
        }
    }

    private fun handleBarcodeScanned(barcode: String) {
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastScannedTime < scanCooldown) return
        if (barcode == _uiState.value.lastScannedBarcode) return

        lastScannedTime = currentTime
        _uiState.value = _uiState.value.copy(isLoading = true, error = null, warning = null, lastScannedBarcode = barcode, product = null)

        viewModelScope.launch {
            try {
                val result = productRepository.searchByBarcode(barcode)
                result.fold(
                    onSuccess = { p ->
                        if (p.itemId.isBlank() && p.variations.isEmpty()) {
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                error = ScannerErrorKind.NOT_FOUND,
                                product = null,
                                warning = null,
                                isOnline = true,
                                lastScannedBarcode = null
                            )
                        } else if (p.isFromCache) {
                            // Mostra cache imediato, refresh em background atualiza a UI
                            val timeAgo = formatTimeAgo(p.lastSyncedAt)
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                product = p,
                                error = null,
                                warning = "🔄 Atualizando...",
                                isOnline = networkMonitor.isOnline.value
                            )
                            beepPlayer.playScan()
                            // Background refresh — busca dados frescos e atualiza a UI
                            viewModelScope.launch {
                                try {
                                    val freshResult = productRepository.fetchFreshByBarcode(barcode)
                                    freshResult.fold(
                                        onSuccess = { fresh ->
                                            _uiState.value = _uiState.value.copy(
                                                product = fresh,
                                                warning = null
                                            )
                                        },
                                        onFailure = { /* mantém cache com warning */ }
                                    )
                                } catch (_: Exception) {}
                            }
                        } else {
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                product = p,
                                error = null,
                                warning = null,
                                isOnline = networkMonitor.isOnline.value
                            )
                            beepPlayer.playScan()
                        }
                    },
                    onFailure = { e ->
                        val deviceOnline = networkMonitor.isOnline.value
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = e.toScannerErrorKind(),
                            product = null,
                            warning = null,
                            isOnline = deviceOnline,
                            lastScannedBarcode = null
                        )
                        beepPlayer.playError()
                    }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.toScannerErrorKind(),
                    product = null,
                    warning = null,
                    lastScannedBarcode = null
                )
                beepPlayer.playError()
            }
        }
    }

    private fun handleItemIdSearch(itemId: String) {
        lastScannedTime = System.currentTimeMillis()
        _uiState.value = _uiState.value.copy(isLoading = true, error = null, warning = null, lastScannedBarcode = "item:$itemId")

        viewModelScope.launch {
            try {
                val result = productRepository.searchByItemId(itemId)
                result.fold(
                    onSuccess = { p ->
                        if (p.itemId.isBlank() && p.variations.isEmpty()) {
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                error = ScannerErrorKind.NOT_FOUND,
                                product = null,
                                warning = null,
                                isOnline = true
                            )
                        } else if (p.isFromCache) {
                            val timeAgo = formatTimeAgo(p.lastSyncedAt)
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                product = p,
                                error = null,
                                warning = "🔄 Atualizando...",
                                isOnline = networkMonitor.isOnline.value
                            )
                            beepPlayer.playScan()
                            // Background refresh
                            viewModelScope.launch {
                                try {
                                    val freshResult = productRepository.fetchFreshByItemId(itemId)
                                    freshResult.fold(
                                        onSuccess = { fresh ->
                                            _uiState.value = _uiState.value.copy(
                                                product = fresh,
                                                warning = null
                                            )
                                        },
                                        onFailure = { /* mantém cache com warning */ }
                                    )
                                } catch (_: Exception) {}
                            }
                        } else {
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                product = p,
                                error = null,
                                warning = null,
                                isOnline = networkMonitor.isOnline.value
                            )
                            beepPlayer.playScan()
                        }
                    },
                    onFailure = { e ->
                        val deviceOnline = networkMonitor.isOnline.value
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = e.toScannerErrorKind(),
                            product = null,
                            warning = null,
                            isOnline = deviceOnline
                        )
                        beepPlayer.playError()
                    }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.toScannerErrorKind(),
                    product = null,
                    warning = null
                )
                beepPlayer.playError()
            }
        }
    }

    /**
     * Busca ampla por nome (ou SKU/EAN).
     *
     * Não seleciona um produto — devolve uma lista. O usuário toca num card
     * da lista, e aí disparamos [handleOpenFromSearchResult] que abre os
     * detalhes via [searchByItemId] (que aí carrega todas as variações).
     *
     * Falha → toast visual via state.error (mesmo padrão do scan por itemId).
     */
    private fun handleNameSearch(query: String) {
        val trimmed = query.trim()
        if (trimmed.length < 2) {
            // Backend faz ILIKE — query de 1 caractere retorna catálogo inteiro,
            // mata a UX. Bloqueia no client.
            _uiState.value = _uiState.value.copy(
                searchResults = emptyList(),
                lastSearchQuery = trimmed,
                isSearching = false,
                warning = "Digite pelo menos 2 caracteres"
            )
            return
        }
        _uiState.value = _uiState.value.copy(
            isSearching = true,
            error = null,
            warning = null,
            lastSearchQuery = trimmed,
            searchResults = emptyList()
        )
        viewModelScope.launch {
            val result = productRepository.searchByName(trimmed)
            result.fold(
                onSuccess = { list ->
                    if (list.isEmpty()) {
                        _uiState.value = _uiState.value.copy(
                            isSearching = false,
                            searchResults = emptyList(),
                            error = ScannerErrorKind.NOT_FOUND,
                            warning = null
                        )
                        beepPlayer.playError()
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isSearching = false,
                            searchResults = list,
                            error = null,
                            warning = null
                        )
                    }
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isSearching = false,
                        searchResults = emptyList(),
                        error = e.toScannerErrorKind(),
                        warning = null
                    )
                    beepPlayer.playError()
                }
            )
        }
    }

    /**
     * Usuário tocou num card de resultado de busca por nome.
     * Reaproveita [handleItemIdSearch] pra carregar o produto completo.
     */
    private fun handleOpenFromSearchResult(itemId: String) {
        // Limpa a lista imediatamente pra evitar reabrir UI duplicada.
        _uiState.value = _uiState.value.copy(
            searchResults = emptyList(),
            lastSearchQuery = null
        )
        handleItemIdSearch(itemId)
    }

    private fun clearSearchResults() {
        _uiState.value = _uiState.value.copy(
            searchResults = emptyList(),
            lastSearchQuery = null
        )
    }

    private fun handleUpdatePrice(variationId: String, price: Double) {
        val itemId = _uiState.value.product?.itemId ?: return
        handleUpdate(variationId, priceValue = price) {
            productRepository.updatePrice(itemId, variationId, price)
        }
    }

    private fun handleUpdateStock(variationId: String, stock: Int) {
        val itemId = _uiState.value.product?.itemId ?: return
        handleUpdate(variationId, stockValue = stock) {
            productRepository.updateStock(itemId, variationId, stock)
        }
    }

    private fun handleUpdateCost(variationId: String, cost: Double) {
        val itemId = _uiState.value.product?.itemId ?: return
        handleUpdate(variationId, costValue = cost) {
            productRepository.updateCost(itemId, variationId, cost)
        }
    }

    /**
     * Helper DRY para os 3 fluxos de update (price/stock/cost).
     *
     * Semântica UX-09 ("não mentir sobre update"):
     *  - Sucesso (200 do servidor) → aplica na UI, limpa warning
     *  - [OfflineQueuedException] (fila local absorveu) → aplica na UI + warning amarelo
     *  - Outros erros (5xx, 4xx, crash) → NÃO aplica na UI + erro vermelho
     *
     * A UI é a fonte de verdade do que o vendedor VÊ. Se ele vê o número novo,
     * é porque a alteração existe (em servidor ou em fila local). Se vê o
     * número antigo, é porque nada foi persistido em lugar nenhum.
     */
    private fun handleUpdate(
        variationId: String,
        priceValue: Double? = null,
        stockValue: Int? = null,
        costValue: Double? = null,
        apiCall: suspend () -> Result<Unit>
    ) {
        _uiState.value = _uiState.value.copy(isUpdating = true)

        viewModelScope.launch {
            try {
                val result = apiCall()
                result.fold(
                    onSuccess = {
                        applyOptimisticUpdate(variationId) {
                            it.copy(
                                price = priceValue ?: it.price,
                                stock = stockValue ?: it.stock,
                                cost = costValue ?: it.cost
                            )
                        }
                        _uiState.value = _uiState.value.copy(warning = null, error = null)
                        beepPlayer.playEdit()
                    },
                    onFailure = { e -> handleUpdateFailure(e, variationId, priceValue, stockValue, costValue) }
                )
            } catch (e: Exception) {
                handleUpdateFailure(e, variationId, priceValue, stockValue, costValue)
            }
        }
    }

    /**
     * Aplica a alteração na UI imediatamente (otimistic update).
     * Chamado em sucesso real e em OfflineQueuedException (fila local absorveu).
     */
    private fun applyOptimisticUpdate(variationId: String, transform: (ProductVariation) -> ProductVariation) {
        val current = _uiState.value.product ?: return
        val updated = current.variations.map { v ->
            if (v.variationId == variationId) transform(v) else v
        }
        _uiState.value = _uiState.value.copy(
            isUpdating = false,
            product = current.copy(variations = updated)
        )
    }

    /**
     * UX-09: reação a falha de update. Distingue 2 casos:
     *
     *  - [OfflineQueuedException] → alteração foi salva na fila local
     *    (PendingActionEntity) e será sincronizada quando a rede voltar.
     *    Mostra o número novo na UI (otimistic) + warning amarelo.
     *
     *  - qualquer outra falha → servidor respondeu 5xx/4xx ou crash local;
     *    nada foi persistido. NÃO aplica na UI (vendedor vê número antigo
     *    voltar) + erro vermelho.
     */
    private fun handleUpdateFailure(
        e: Throwable,
        variationId: String,
        priceValue: Double?,
        stockValue: Int?,
        costValue: Double?
    ) {
        if (e is OfflineQueuedException) {
            applyOptimisticUpdate(variationId) {
                it.copy(
                    price = priceValue ?: it.price,
                    stock = stockValue ?: it.stock,
                    cost = costValue ?: it.cost
                )
            }
            _uiState.value = _uiState.value.copy(
                isUpdating = false,
                error = null,
                warning = "💾 Salvo no dispositivo — sincroniza quando voltar online"
            )
        } else {
            _uiState.value = _uiState.value.copy(
                isUpdating = false,
                error = ScannerErrorKind.UPDATE_FAILED
            )
            beepPlayer.playError()
        }
    }

    private fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    private fun clearProduct() {
        _uiState.value = ScannerUiState(isOnline = _uiState.value.isOnline)
    }

    private fun formatTimeAgo(timestamp: Long): String {
        if (timestamp <= 0L) return "tempo desconhecido"
        val diffMs = System.currentTimeMillis() - timestamp
        val diffSec = diffMs / 1000
        val diffMin = diffSec / 60
        val diffHour = diffMin / 60
        val diffDay = diffHour / 24

        return when {
            diffMin < 1 -> "há menos de um minuto"
            diffMin == 1L -> "há 1 minuto"
            diffMin < 60 -> "há $diffMin minutos"
            diffHour == 1L -> "há 1 hora"
            diffHour < 24 -> "há $diffHour horas"
            diffDay == 1L -> "há 1 dia"
            else -> "há $diffDay dias"
        }
    }
}

/**
 * Categorias de erro user-facing. O texto exibido é resolvido no Composable
 * (stringResource), não aqui — mantém o VM desacoplado de Context.
 */
enum class ScannerErrorKind {
    NOT_FOUND,        // HTTP 404 - produto não existe na base
    NO_CONNECTION,    // Sem DNS / sem internet / fallback esgotado
    TIMEOUT,          // Servidor demorou demais para responder
    SERVER,           // 5xx - problema do nosso lado
    UNKNOWN,          // outros 4xx, 401/403, ou exception genérica
    UPDATE_FAILED     // servidor respondeu success=false numa escrita
}

/**
 * Traduz uma exceção técnica em um [ScannerErrorKind]. Única fonte de verdade
 * para a UX — Composables não inspecionam exceções diretamente.
 */
private fun Throwable.toScannerErrorKind(): ScannerErrorKind = when {
    this is java.net.UnknownHostException -> ScannerErrorKind.NO_CONNECTION
    this is java.net.SocketTimeoutException -> ScannerErrorKind.TIMEOUT
    this is HttpException -> when (code()) {
        404 -> ScannerErrorKind.NOT_FOUND
        in 500..599 -> ScannerErrorKind.SERVER
        else -> ScannerErrorKind.UNKNOWN
    }
    else -> ScannerErrorKind.UNKNOWN
}

private const val TAG = "ScannerViewModel"