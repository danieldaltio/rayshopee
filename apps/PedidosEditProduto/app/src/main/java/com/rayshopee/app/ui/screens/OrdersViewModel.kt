package com.rayshopee.app.ui.screens

import android.content.Context
import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rayshopee.app.data.repository.OrdersRepository
import com.rayshopee.app.orders.OrdersResponse
import com.rayshopee.app.orders.OrdersResponseItem
import com.rayshopee.core.network.NetworkConfig
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject
import java.util.Calendar
import javax.inject.Inject

/**
 * Estado de UI da tela de pedidos.
 *
 * Tudo que é compartilhado entre composables vive aqui (carregamento, lista,
 * erros, item em edição). Coisas efêmeras como o rascunho do campo de URL
 * ficam como `remember { mutableStateOf(...) }` no composable.
 *
 * **Mudança 2026-07-04 (Sessão 7):** `userUrls` (plural) substitui `baseUrl` único.
 * `currentBaseUrl` continua existindo como derivado de `candidates[0]`, pra
 * passar pro [OrdersRepository] na hora da request.
 */
data class OrdersUiState(
    /** URLs configuradas pelo usuário (em ordem de prioridade). Editáveis em Settings. */
    val userUrls: List<String> = emptyList(),
    /** URL atualmente ativa pro request (1º de `candidates` resolvido pelo NetworkConfig). */
    val currentBaseUrl: String = NetworkConfig.DEFAULT_CLOUDFLARE_URL,
    /** Lista de URLs candidatas resolvida — UI mostra "tentando X, Y...". */
    val candidates: List<String> = listOf(NetworkConfig.DEFAULT_CLOUDFLARE_URL),
    val isLoading: Boolean = false,
    val isSyncing: Boolean = false,
    val isSavingItem: Boolean = false,
    val orders: List<OrdersResponse> = emptyList(),
    val errorMessage: String? = null,
    val detailedError: String? = null,
    val editingItem: EditingTarget? = null,
    /** Mapa de preços alterados nesta sessão: chave "itemId:modelId" → novo preço */
    val updatedPrices: Map<String, Double> = emptyMap(),
    /** Filtro de status selecionado. null = Todos */
    val selectedStatusFilter: String? = null,
    /** Filtro de período selecionado. null = Todos os períodos */
    val selectedTimeFilter: TimeFilterOption? = null,
    /** Se true, dados de escrow estão sendo carregados em background */
    val isLoadingEscrow: Boolean = false,
    /** Porcentagem de imposto sobre faturamento (configurável em Settings) */
    val taxPercentage: Double = 7.0
)

/**
 * Opções de filtro por período.
 * Cada opção calcula um par (startTimeMillis, endTimeMillis) relativo à data atual.
 */
enum class TimeFilterOption(val label: String) {
    CURRENT_WEEK("Semana Atual"),
    CURRENT_MONTH("Mês Atual"),
    LAST_MONTH("Mês Anterior"),
    LAST_30_DAYS("Últimos 30 Dias"),
    LAST_90_DAYS("Últimos 90 Dias");

    /** Calcula o intervalo de tempo (startMillis, endMillis) para este filtro. */
    fun getDateRange(): Pair<Long, Long> {
        val cal = Calendar.getInstance()
        val now = cal.timeInMillis

        return when (this) {
            CURRENT_WEEK -> {
                // Segunda-feira da semana atual até domingo
                cal.set(Calendar.DAY_OF_WEEK, cal.firstDayOfWeek)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                val start = cal.timeInMillis
                cal.add(Calendar.DAY_OF_WEEK, 7)
                val end = cal.timeInMillis
                start to end
            }
            CURRENT_MONTH -> {
                cal.set(Calendar.DAY_OF_MONTH, 1)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                val start = cal.timeInMillis
                cal.add(Calendar.MONTH, 1)
                val end = cal.timeInMillis
                start to end
            }
            LAST_MONTH -> {
                cal.add(Calendar.MONTH, -1)
                cal.set(Calendar.DAY_OF_MONTH, 1)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                val start = cal.timeInMillis
                cal.add(Calendar.MONTH, 1)
                val end = cal.timeInMillis
                start to end
            }
            LAST_30_DAYS -> {
                cal.add(Calendar.DAY_OF_YEAR, -30)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                val start = cal.timeInMillis
                start to now
            }
            LAST_90_DAYS -> {
                cal.add(Calendar.DAY_OF_YEAR, -90)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                val start = cal.timeInMillis
                start to now
            }
        }
    }
}

/**
 * Item selecionado para edição (dialog aberto).
 */
data class EditingTarget(val item: OrdersResponseItem, val orderSn: String)

/**
 * Intents (ações) que a UI dispara no ViewModel.
 * Padrão MVI simplificado: um único ponto de entrada `processIntent`.
 */
sealed interface OrdersIntent {
    data object Refresh : OrdersIntent
    data object SyncAll : OrdersIntent
    data class SyncItem(val itemId: String) : OrdersIntent
    data class UpdateItem(
        val itemId: String,
        val modelId: String,
        val cost: Double,
        val stock: Int,
        val price: Double
    ) : OrdersIntent
    data class OpenEdit(val item: OrdersResponseItem, val orderSn: String) : OrdersIntent
    data object DismissEdit : OrdersIntent
    /** Persiste a lista de URLs configuradas pelo usuário (Settings). */
    data class SetUserUrls(val urls: List<String>) : OrdersIntent
    data object DismissError : OrdersIntent
    data class FilterByStatus(val status: String?) : OrdersIntent
    data class FilterByTime(val timeFilter: TimeFilterOption?) : OrdersIntent
    data class SetTaxPercentage(val percentage: Double) : OrdersIntent
}

/**
 * ViewModel da tela de pedidos.
 *
 * Centraliza a lógica de estado e orquestra as chamadas ao
 * [com.rayshopee.app.data.repository.OrdersRepository] (Hilt). Substituiu toda a
 * lógica de rede que vivia inline na antiga `OrdersScreen.kt` (versão
 * pré-refatoração, hoje removida).
 *
 * **Migração 2026-07-02 (rayshopee-core):** a leitura/escrita de URL que vivia aqui
 * (via `@ApplicationContext SharedPrefs("app_prefs").getString("base_url", ...)`)
 * foi substituída por [NetworkConfig] (do `:rayshopee-core`). O `NetworkConfig`
 * cuida de:
 *  - Carregar `userUrls` (lista) de `SharedPrefs("app_prefs")` via `SharedPrefsNetworkPreferences`
 *  - Descobrir `lanUrl` automaticamente (LAN scan via `NetworkDiscovery`)
 *  - Manter fallback `cloudflareUrl` constante
 *  - Expor `candidates` ordenado como `StateFlow<List<String>>`
 *
 * Este ViewModel injeta `NetworkConfig` e usa `networkConfig.userUrls` (prioridade
 * 1) → `networkConfig.lanUrl` (prioridade 2) → `candidates[0]` (primeiro da lista
 * resolvida, que já inclui `cloudflareUrl` como último) pra decidir a URL de request.
 *
 * **Comportamento herdado do original:**
 * - Timeouts: 15s connect, 30s read em GET, 60s read em POST (no Repository)
 * - Headers: `Connection: close`, `Accept-Encoding: identity`, `bypass-tunnel-reminder: true`
 * - Mesma sequência de chamadas no `UpdateItem` (cost → stock → price), com
 *   early-exit no primeiro erro
 * - Mesma estrutura de erros (message curta vs HTML detalhado)
 * - Dialog de Configurações persiste `SetUserUrls(urls)` via `NetworkConfig.setUserUrls()`
 *   — aceita lista de 0..N URLs (1..5 normalizado).
 */
@HiltViewModel
class OrdersViewModel @Inject constructor(
    private val ordersRepository: OrdersRepository,
    private val networkConfig: NetworkConfig,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

    private val _uiState = MutableStateFlow(OrdersUiState(
        taxPercentage = prefs.getFloat("tax_percentage", 7.0f).toDouble()
    ))
    val uiState: StateFlow<OrdersUiState> = _uiState.asStateFlow()

    init {
        // Observa candidates/userUrls do NetworkConfig em background pra manter UI sincronizada.
        viewModelScope.launch {
            networkConfig.userUrls.collect { urls ->
                _uiState.update { it.copy(userUrls = urls) }
            }
        }
        viewModelScope.launch {
            networkConfig.candidates.collect { candidates ->
                _uiState.update {
                    it.copy(
                        candidates = candidates,
                        currentBaseUrl = candidates.firstOrNull()
                            ?: NetworkConfig.DEFAULT_CLOUDFLARE_URL
                    )
                }
            }
        }
        viewModelScope.launch {
            val initialUrls = awaitInitialUserUrls()
            _uiState.update { it.copy(userUrls = initialUrls) }
            // Carga inicial: roda refresh com a URL resolvida
            refresh()
        }
    }

    fun processIntent(intent: OrdersIntent) {
        when (intent) {
            is OrdersIntent.Refresh -> refresh()
            is OrdersIntent.SyncAll -> syncAll()
            is OrdersIntent.SyncItem -> syncItem(intent.itemId)
            is OrdersIntent.UpdateItem -> updateItem(
                intent.itemId, intent.modelId, intent.cost, intent.stock, intent.price
            )
            is OrdersIntent.OpenEdit -> _uiState.update {
                it.copy(editingItem = EditingTarget(intent.item, intent.orderSn))
            }
            is OrdersIntent.DismissEdit -> _uiState.update { it.copy(editingItem = null) }
            is OrdersIntent.SetUserUrls -> setUserUrls(intent.urls)
            is OrdersIntent.DismissError -> _uiState.update {
                it.copy(errorMessage = null, detailedError = null)
            }
            is OrdersIntent.FilterByStatus -> _uiState.update {
                it.copy(selectedStatusFilter = intent.status)
            }
            is OrdersIntent.FilterByTime -> {
                _uiState.update { it.copy(selectedTimeFilter = intent.timeFilter) }
                refresh()
            }
            is OrdersIntent.SetTaxPercentage -> {
                prefs.edit().putFloat("tax_percentage", intent.percentage.toFloat()).apply()
                _uiState.update { it.copy(taxPercentage = intent.percentage) }
            }
        }
    }

    /** Pedidos filtrados pelo status E período selecionados. */
    val filteredOrders: StateFlow<List<OrdersResponse>> = _uiState
        .map { ui ->
            val statusFilter = ui.selectedStatusFilter
            val timeFilter = ui.selectedTimeFilter

            ui.orders.filter { order ->
                // Filtro por status
                val matchesStatus = statusFilter == null || order.status == statusFilter
                // Filtro por período
                val matchesTime = if (timeFilter == null) true
                else {
                    val (start, end) = timeFilter.getDateRange()
                    order.createTime in start until end
                }
                matchesStatus && matchesTime
            }
        }
        .stateIn(viewModelScope, kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5000), emptyList())

    private fun refresh() {
        val url = _uiState.value.currentBaseUrl
        val timeFilter = _uiState.value.selectedTimeFilter

        val timeFrom: Long? = timeFilter?.getDateRange()?.let { it.first / 1000 }
        val timeTo: Long? = timeFilter?.getDateRange()?.let { it.second / 1000 }

        _uiState.update { it.copy(isLoading = true, errorMessage = null, detailedError = null) }
        viewModelScope.launch {
            // FASE 1: Carregamento rápido SEM escrow — dados aparecem na hora
            ordersRepository.fetchOrdersToShip(url, timeFrom, timeTo, skipEscrow = true)
                .onSuccess { orders ->
                    _uiState.update { it.copy(isLoading = false, orders = orders) }

                    // FASE 2: Carregamento em background COM escrow — atualiza cards concluídos
                    launch {
                        _uiState.update { it.copy(isLoadingEscrow = true) }
                        ordersRepository.fetchOrdersToShip(url, timeFrom, timeTo, skipEscrow = false)
                            .onSuccess { ordersWithEscrow ->
                                _uiState.update { it.copy(isLoadingEscrow = false, orders = ordersWithEscrow) }
                            }
                            .onFailure {
                                _uiState.update { it.copy(isLoadingEscrow = false) }
                            }
                    }
                }
                .onFailure { e ->
                    val isHtml = e.message?.contains("<!DOCTYPE", ignoreCase = true) == true ||
                                 e.message?.contains("<html", ignoreCase = true) == true
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "Falha ao buscar pedidos",
                            detailedError = "Falha ao buscar pedidos:\n${e.message}\n\n${e.toString()}"
                                .let { msg -> if (isHtml) HTML_NGrok_HINT + "\n\n" + msg else msg }
                        )
                    }
                }
        }
    }

    private fun syncAll() {
        val url = _uiState.value.currentBaseUrl
        _uiState.update { it.copy(isSyncing = true, errorMessage = null) }
        viewModelScope.launch {
            val body = JSONObject()
            ordersRepository.updateProductValue(url, "/api/products/sync-full", body)
                .onSuccess {
                    _uiState.update { it.copy(isSyncing = false) }
                    refresh()
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(
                            isSyncing = false,
                            errorMessage = "Falha na sincronização",
                            detailedError = e.message
                        )
                    }
                }
        }
    }

    private fun syncItem(itemId: String) {
        val url = _uiState.value.currentBaseUrl
        viewModelScope.launch {
            ordersRepository.updateProductValue(url, "/api/products/sync-item/$itemId", JSONObject())
                .onSuccess {
                    // Sincronização bem-sucedida do item: refetch para atualizar dados
                    refresh()
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(detailedError = "Falha ao sincronizar item $itemId:\n${e.message}")
                    }
                }
        }
    }

    private fun updateItem(
        itemId: String,
        modelId: String,
        cost: Double,
        stock: Int,
        price: Double
    ) {
        val url = _uiState.value.currentBaseUrl
        _uiState.update { it.copy(isSavingItem = true) }
        viewModelScope.launch {
            // Sequência com early-exit no primeiro erro (mesmo comportamento do
            // código original, que envolvia as 3 chamadas num try/catch e
            // lançava exceção em caso de falha).
            //
            // `getOrElse { return@launch ... }` interrompe a corrotina ao primeiro
            // erro: se cost falhar, stock e price não rodam. Isso evita atualização
            // parcial (cost velho + stock/price novos) e mantém o dialog aberto
            // para o usuário ver o erro.
            //
            // BUG CORRIGIDO (2026-07-01): antes usávamos `.onFailure { return@onFailure ... }`,
            // mas `return@onFailure` só sai da lambda inline (que retorna `this`), NÃO
            // da corrotion — então as 3 chamadas sempre rodavam e o dialog fechava
            // mesmo em caso de erro.

            // 1. Update Cost
            ordersRepository.updateProductValue(url, "/api/products/update-cost", JSONObject().apply {
                put("item_id", itemId)
                put("model_id", modelId)
                put("cost", cost)
            }).getOrElse { return@launch handleUpdateError("cost", it) }

            // 2. Update Stock
            ordersRepository.updateProductValue(url, "/api/products/update-stock", JSONObject().apply {
                put("itemId", itemId)
                put("variationId", modelId)
                put("stock", stock)
            }).getOrElse { return@launch handleUpdateError("stock", it) }

            // 3. Update Price
            ordersRepository.updateProductValue(url, "/api/products/update-price", JSONObject().apply {
                put("itemId", itemId)
                put("variationId", modelId)
                put("price", price)
            }).getOrElse { return@launch handleUpdateError("price", it) }

            // Só chegamos aqui se os 3 updates foram bem-sucedidos.
            _uiState.update {
                it.copy(
                    editingItem = null,
                    isSavingItem = false,
                    updatedPrices = it.updatedPrices + ("$itemId:$modelId" to price)
                )
            }
            refresh()
        }
    }

    private fun handleUpdateError(field: String, e: Throwable) {
        _uiState.update {
            it.copy(
                isSavingItem = false,
                detailedError = "Falha ao atualizar $field: ${e.message}"
            )
        }
    }

    /**
     * Persiste a lista de URLs via [NetworkConfig] (que delega pro
     * [com.rayshopee.app.data.prefs.SharedPrefsNetworkPreferences]).
     * Lista vazia → apaga a preferência (volta pro cloudflare fallback).
     * Aceita lista de N URLs (1..5 normalizado).
     */
    private fun setUserUrls(urls: List<String>) {
        // Filtra vazios e trim na camada UI — NetworkConfig também normaliza.
        val toPersist = urls
            .map { it.trim().removeSuffix("/") }
            .filter { it.isNotBlank() }
        viewModelScope.launch {
            networkConfig.setUserUrls(toPersist)
            // O `candidates` flow já atualiza o uiState sozinho (observer em init).
            refresh()
        }
    }

    /**
     * Resolve a lista inicial de URLs do usuário pra popular
     * [OrdersUiState.userUrls] antes do primeiro refresh.
     *
     * **Por que essa lógica?** O `NetworkConfig.init` é assíncrono (lê SharedPrefs +
     * escaneia LAN em background no `scope` interno). Pode levar até ~1.5s se tiver
     * Wi-Fi. Pra evitar mostrar uma lista vazia quando na verdade tem `userUrls`
     * salvas, esperamos até 2s pelo primeiro valor não-vazio do flow.
     *
     * Se timeout: devolve lista vazia (que será atualizada depois pelo observer).
     */
    private suspend fun awaitInitialUserUrls(): List<String> {
        val initial = withTimeoutOrNull(2000) {
            // Pega o primeiro valor do flow, mesmo que seja vazio.
            networkConfig.userUrls.first()
        }
        return initial ?: emptyList()
    }

    companion object {
        // Mensagem exibida quando o backend retorna HTML (ngrok pedindo "Visit Site")
        private const val HTML_NGrok_HINT =
            "O servidor retornou uma página HTML em vez de dados. Isso geralmente acontece " +
            "quando o Ngrok pede para clicar em 'Visit Site' ou o servidor não foi reiniciado."
    }
}
