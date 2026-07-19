package com.rayshopee.app.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle


/**
 * Tela principal de pedidos.
 *
 * Consome [OrdersViewModel] via Hilt (`hiltViewModel()`); o estado de rede vem
 * do `StateFlow<OrdersUiState>` (reativo). A lógica de chamadas HTTP vive no
 * [com.rayshopee.app.data.repository.OrdersRepository].
 *
 * Composta por: [OrdersScreenRefactored] (Scaffold + roteamento de estado),
 * [OrderCardRefactored] (card de pedido), [OrderItemRowRefactored] (linha de
 * item) e [EditProductDialogRefactored] (dialog de edição).
 */

/** Lista de status disponíveis para filtro, na ordem de exibição. */
private val STATUS_FILTER_OPTIONS = listOf(
    null to "Todos",
    "READY_TO_SHIP" to "Pronto p/ Enviar",
    "PROCESSED" to "Processado",
    "SHIPPED" to "Enviado",
    "TO_CONFIRM_RECEIVE" to "Aguardando Confirmação",
    "COMPLETED" to "Concluído",
    "CANCELLED" to "Cancelado"
)

/** Lista de períodos disponíveis para filtro. */
private val TIME_FILTER_OPTIONS = listOf(
    null to "Todos os Períodos",
    TimeFilterOption.CURRENT_WEEK to "Semana Atual",
    TimeFilterOption.CURRENT_MONTH to "Mês Atual",
    TimeFilterOption.LAST_MONTH to "Mês Anterior",
    TimeFilterOption.LAST_30_DAYS to "Últimos 30 Dias",
    TimeFilterOption.LAST_90_DAYS to "Últimos 90 Dias"
)

/** Traduz o nome interno do status para exibição em português. */
fun translateStatus(status: String): String = when (status) {
    "READY_TO_SHIP" -> "Pronto p/ Enviar"
    "PROCESSED" -> "Processado"
    "SHIPPED" -> "Enviado"
    "TO_CONFIRM_RECEIVE" -> "Aguardando Confirmação"
    "COMPLETED" -> "Concluído"
    "CANCELLED" -> "Cancelado"
    else -> status
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreenRefactored(
    viewModel: OrdersViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val filteredOrders by viewModel.filteredOrders.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    // Estado puramente UI (não persistido, não compartilhado entre telas).
    var showSettings by remember { mutableStateOf(false) }
    var tempUrls by remember { mutableStateOf<List<String>>(emptyList()) }
    var tempTaxPercentage by remember { mutableStateOf(state.taxPercentage) }

    LaunchedEffect(showSettings) {
        if (showSettings) {
            tempUrls = state.userUrls.ifEmpty { listOf("", "") }
            tempTaxPercentage = state.taxPercentage
        }
    }

    // Snackbar messages em vez de Toast (alinhado com Material 3)
    LaunchedEffect(state.errorMessage) {
        state.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.processIntent(OrdersIntent.DismissError)
        }
    }

    if (showSettings) {
        SettingsDialog(
            tempUrls = tempUrls,
            candidates = state.candidates,
            tempTaxPercentage = tempTaxPercentage,
            onTempUrlsChange = { tempUrls = it },
            onTempTaxPercentageChange = { tempTaxPercentage = it },
            onDismiss = { showSettings = false },
            onSave = {
                viewModel.processIntent(OrdersIntent.SetUserUrls(tempUrls))
                viewModel.processIntent(OrdersIntent.SetTaxPercentage(tempTaxPercentage))
                showSettings = false
            }
        )
    }

    state.detailedError?.let { detailed ->
        val isHtml = detailed.contains("<!DOCTYPE", ignoreCase = true) ||
                     detailed.contains("<html", ignoreCase = true)
        AlertDialog(
            onDismissRequest = { viewModel.processIntent(OrdersIntent.DismissError) },
            title = { Text(if (isHtml) "Aviso do Servidor (HTML)" else "Erro Detalhado") },
            text = {
                Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                    if (isHtml) {
                        Text(
                            "O servidor retornou uma página HTML em vez de dados. " +
                            "Isso geralmente acontece quando o Ngrok pede para clicar " +
                            "em 'Visit Site' ou o servidor não foi reiniciado.",
                            color = MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    SelectionContainer {
                        Text(detailed, fontSize = 10.sp, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                    }
                }
            },
            confirmButton = {
                Row {
                    TextButton(onClick = {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        clipboard.setPrimaryClip(ClipData.newPlainText("Erro RayShopee", detailed))
                        Toast.makeText(context, "Copiado!", Toast.LENGTH_SHORT).show()
                    }) { Text("Copiar") }
                    Button(onClick = { viewModel.processIntent(OrdersIntent.DismissError) }) { Text("Fechar") }
                }
            }
        )
    }

    state.editingItem?.let { target ->
        EditProductDialogRefactored(
            target = target,
            isSaving = state.isSavingItem,
            onDismiss = { viewModel.processIntent(OrdersIntent.DismissEdit) },
            onConfirm = { cost, stock, price ->
                viewModel.processIntent(
                    OrdersIntent.UpdateItem(
                        itemId = target.item.itemId,
                        modelId = target.item.modelId,
                        cost = cost,
                        stock = stock,
                        price = price
                    )
                )
            },
            onSync = {
                viewModel.processIntent(OrdersIntent.SyncItem(target.item.itemId))
            }
        )
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("PedidosEditProduto", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { showSettings = true }) {
                        Icon(Icons.Default.Settings, contentDescription = "Configurações")
                    }
                    IconButton(
                        onClick = { viewModel.processIntent(OrdersIntent.SyncAll) },
                        enabled = !state.isSyncing && !state.isLoading
                    ) {
                        if (state.isSyncing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Icon(Icons.Default.Sync, contentDescription = "Sincronizar Shopee")
                        }
                    }
                    IconButton(
                        onClick = { viewModel.processIntent(OrdersIntent.Refresh) },
                        enabled = !state.isLoading && !state.isSyncing
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "Atualizar Pedidos")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (state.isLoading && state.orders.isEmpty()) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else if (state.errorMessage != null && state.orders.isEmpty()) {
                Column(
                    modifier = Modifier.align(Alignment.Center).padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Erro ao carregar pedidos", color = MaterialTheme.colorScheme.error)
                    Text(
                        state.errorMessage!!,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { viewModel.processIntent(OrdersIntent.Refresh) }) {
                        Text("Tentar Novamente")
                    }
                }
            } else if (state.orders.isEmpty() && !state.isLoading) {
                Text("Nenhum pedido encontrado", modifier = Modifier.align(Alignment.Center))
            } else {
                Column(modifier = Modifier.fillMaxSize()) {
                    // Filtro de período
                    LazyRow(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(TIME_FILTER_OPTIONS) { (timeValue, label) ->
                            val isSelected = state.selectedTimeFilter == timeValue
                            FilterChip(
                                selected = isSelected,
                                onClick = {
                                    if (!state.isLoading) {
                                        viewModel.processIntent(OrdersIntent.FilterByTime(timeValue))
                                    }
                                },
                                enabled = !state.isLoading,
                                label = {
                                    Text(
                                        label,
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MaterialTheme.colorScheme.tertiary,
                                    selectedLabelColor = MaterialTheme.colorScheme.onTertiary
                                )
                            )
                        }
                    }

                    // Barra de filtros por status
                    LazyRow(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(STATUS_FILTER_OPTIONS) { (statusValue, label) ->
                            val isSelected = state.selectedStatusFilter == statusValue
                            FilterChip(
                                selected = isSelected,
                                onClick = {
                                    if (!state.isLoading) {
                                        viewModel.processIntent(OrdersIntent.FilterByStatus(statusValue))
                                    }
                                },
                                enabled = !state.isLoading,
                                label = {
                                    Text(
                                        label,
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                                    selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                                )
                            )
                        }
                    }

                    // Resumo financeiro dos pedidos filtrados
                    val totalFaturamento = filteredOrders.sumOf { it.totalAmount }
                    val totalLucro = filteredOrders.sumOf { it.predictedProfit }
                    val totalRecebido = filteredOrders.mapNotNull { it.escrowAmount }.sum()
                    val totalCusto = filteredOrders.sumOf { o -> o.items.sumOf { it.cost * it.quantity } }
                    val totalImposto = totalFaturamento * (state.taxPercentage / 100.0)
                    val totalLucroReal = if (totalRecebido > 0) totalRecebido - totalImposto - totalCusto else 0.0
                    val lucroColor = if (totalLucro > 0) Color(0xFF2E7D32) else Color.Red
                    val lucroRealColor = if (totalLucroReal > 0) Color(0xFF2E7D32) else Color.Red

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        )
                    ) {
                        Column {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text("Faturamento", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                                    Text(
                                        "R$ ${String.format("%.2f", totalFaturamento)}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Lucro Real", style = MaterialTheme.typography.labelSmall, color = Color(0xFF2E7D32))
                                Text(
                                    if (totalRecebido > 0) "R$ ${String.format("%.2f", totalLucroReal)}" else "R$ ${String.format("%.2f", totalLucro)}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = if (totalRecebido > 0) lucroRealColor else lucroColor
                                )
                            }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("Recebido", style = MaterialTheme.typography.labelSmall, color = Color(0xFF2E7D32))
                                    Text(
                                        if (totalRecebido > 0) "R$ ${String.format("%.2f", totalRecebido)}" else "---",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = Color(0xFF2E7D32)
                                    )
                                }
                            }
                            // Indicador de carregamento de escrow em background
                            if (state.isLoadingEscrow) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 2.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(10.dp),
                                        strokeWidth = 1.5.dp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        "Carregando dados financeiros...",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }

                    // Contador de pedidos filtrados
                    val hasActiveFilter = state.selectedStatusFilter != null || state.selectedTimeFilter != null
                    if (state.isLoading && hasActiveFilter) {
                        Row(
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(14.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "Atualizando pedidos...",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else if (hasActiveFilter) {
                        Text(
                            "Mostrando ${filteredOrders.size} de ${state.orders.size} pedidos",
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 2.dp),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(filteredOrders, key = { it.orderSn }) { order ->
                            OrderCardRefactored(
                                order = order,
                                updatedPrices = state.updatedPrices,
                                taxPercentage = state.taxPercentage,
                                onEditItem = { item ->
                                    viewModel.processIntent(OrdersIntent.OpenEdit(item, order.orderSn))
                                },
                                onSyncItem = { itemId ->
                                    viewModel.processIntent(OrdersIntent.SyncItem(itemId))
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Dialog de Configurações — gerencia a lista de URLs do usuário.
 *
 * Cada URL pode ser editada individualmente (campo de texto com botão "✕"
 * pra remover) e o usuário pode adicionar mais via botão "Adicionar URL"
 * no rodapé. Limite de 5 URLs pra evitar UI poluída e config inválida.
 *
 * **Ordem dos campos = prioridade:** a primeira URL é tentada primeiro, a
 * segunda é o fallback, etc. cloudflare é fallback final sempre (automático).
 *
 * @param tempUrls Rascunho local enquanto o dialog tá aberto.
 * @param candidates Lista resolvida pelo NetworkConfig (userUrls + lan + cloudflare).
 *                   Mostrada como preview embaixo, pra feedback imediato da ordem.
 * @param onTempUrlsChange Callback pra cada keystroke.
 */
@Composable
fun SettingsDialog(
    tempUrls: List<String>,
    candidates: List<String>,
    tempTaxPercentage: Double,
    onTempUrlsChange: (List<String>) -> Unit,
    onTempTaxPercentageChange: (Double) -> Unit,
    onDismiss: () -> Unit,
    onSave: () -> Unit
) {
    var taxText by remember { mutableStateOf(String.format("%.1f", tempTaxPercentage)) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Configurações") },
        text = {
            Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                // Seção: Impostos
                Text(
                    "💰 Impostos",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Porcentagem aplicada sobre o faturamento para calcular lucro real.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = taxText,
                    onValueChange = { newValue ->
                        taxText = newValue
                        newValue.toDoubleOrNull()?.let { onTempTaxPercentageChange(it) }
                    },
                    label = { Text("Imposto sobre faturamento (%)") },
                    placeholder = { Text("7.0") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    suffix = { Text("%") }
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                // Seção: URLs do Servidor
                Text(
                    "🌐 Servidor",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Adicione URLs base na ordem que devem ser " +
                    "tentadas. A primeira é a mais rápida; deixe vazio para " +
                    "usar só descoberta automática (LAN) + Cloudflare.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Lista de OutlinedTextField — 1 por URL.
                tempUrls.forEachIndexed { index, url ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "${index + 1}.",
                            modifier = Modifier.padding(end = 8.dp),
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        OutlinedTextField(
                            value = url,
                            onValueChange = { newValue ->
                                val updated = tempUrls.toMutableList()
                                while (updated.size <= index) updated.add("")
                                updated[index] = newValue
                                onTempUrlsChange(updated)
                            },
                            label = {
                                Text(
                                    when (index) {
                                        0 -> "URL 1 (principal)"
                                        1 -> "URL 2 (fallback)"
                                        else -> "URL $index (fallback)"
                                    }
                                )
                            },
                            placeholder = {
                                Text(
                                    when (index) {
                                        0 -> "http://192.168.15.2:3003"
                                        else -> "https://xxx.ngrok-free.dev"
                                    },
                                    fontSize = 12.sp
                                )
                            },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        // Botão remover só aparece a partir do 2º campo — o primeiro
                        // nunca pode ser totalmente vazio sem confirmação.
                        if (tempUrls.size > 1) {
                            IconButton(onClick = {
                                val updated = tempUrls.toMutableList()
                                updated.removeAt(index)
                                onTempUrlsChange(updated)
                            }) {
                                Icon(Icons.Default.Close, "Remover URL ${index + 1}")
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Botão "Adicionar" — desabilitado no limite de 5 URLs.
                if (tempUrls.size < 5) {
                    OutlinedButton(
                        onClick = {
                            onTempUrlsChange(tempUrls + "")
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Add, null)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Adicionar URL")
                    }
                }

                // Preview da ordem final resolvida (com LAN + Cloudflare).
                if (candidates.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "Ordem final de tentativa (após salvar):",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    candidates.forEachIndexed { i, c ->
                        Text(
                            "${i + 1}. $c",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onSave) { Text("Salvar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}
