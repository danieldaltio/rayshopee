package com.rayshopee.app.ui.screens

import android.Manifest
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.rayshopee.app.R
import com.rayshopee.app.data.model.Product
import com.rayshopee.app.data.model.ProductSearchResult
import com.rayshopee.app.data.model.ProductVariation
import com.rayshopee.app.util.BeepPlayer
import java.util.concurrent.Executors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScannerScreen(
    viewModel: ScannerViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val isMuted by viewModel.isMuted.collectAsState()

    var hasCameraPermission by remember {
        mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
    }
    
    var manualInput by remember { mutableStateOf("") }
    var nameQuery by remember { mutableStateOf("") }
    var panelExpanded by remember { mutableStateOf(false) }

    // Settings dialog (URLs do usuário) — adicionado em 2026-07-04 (Sessão 7).
    var showSettings by remember { mutableStateOf(false) }
    var tempUrls by remember { mutableStateOf<List<String>>(emptyList()) }
    LaunchedEffect(showSettings) {
        if (showSettings) tempUrls = uiState.userUrls.ifEmpty { listOf("", "") }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { hasCameraPermission = it }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) permissionLauncher.launch(Manifest.permission.CAMERA)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.app_name), fontWeight = FontWeight.Bold, color = Color.White) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.primary),
                actions = {
                    val statusText = when (uiState.isOnline) {
                        true -> "🟢 Online"
                        false -> "🔴 Offline"
                        null -> "🟡..."
                    }
                    val statusColor = when (uiState.isOnline) {
                        true -> Color(0xFF4CAF50)
                        false -> Color(0xFFF44336)
                        null -> Color(0xFFFFEB3B)
                    }
                    Surface(
                        color = statusColor.copy(alpha = 0.15f),
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Text(
                            text = statusText,
                            color = statusColor,
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.labelMedium,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                    // Settings dialog (URLs do usuário) — adicionado em 2026-07-04 (Sessão 7).
                    IconButton(onClick = { showSettings = true }) {
                        Icon(Icons.Default.Settings, contentDescription = "Configurações", tint = Color.White)
                    }
                    // Toggle de som dos bips (scan / edit / error). Persistido em
                    // SharedPreferences pelo BeepPlayer — sobrevive ao restart.
                    IconButton(
                        onClick = { viewModel.toggleMuted() },
                        modifier = Modifier.padding(end = 4.dp)
                    ) {
                        Text(
                            text = if (isMuted) "🔇" else "🔊",
                            style = MaterialTheme.typography.titleLarge
                        )
                    }
                }
            )
        }
    ) { padding ->
        // Mostra o SettingsDialog (URLs) — adicionado em 2026-07-04 (Sessão 7),
        // expandido em 2026-07-18 (Sprint 1.5) com SSID mapping + mDNS + Refresh.
        if (showSettings) {
            val locationPermissionLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.RequestPermission()
            ) { granted ->
                viewModel.processIntent(ScannerIntent.LocationPermissionResult(granted))
            }
            UrlSettingsDialog(
                tempUrls = tempUrls,
                candidates = uiState.candidates,
                currentSsid = uiState.currentSsid,
                ssidMappings = uiState.ssidMappings,
                hasLocationPermission = uiState.hasLocationPermission,
                isRefreshing = uiState.isRefreshing,
                refreshFeedback = uiState.refreshFeedback,
                onTempUrlsChange = { tempUrls = it },
                onDismiss = { showSettings = false },
                onSave = {
                    viewModel.processIntent(ScannerIntent.SetUserUrls(tempUrls))
                    showSettings = false
                },
                onRefreshNetwork = { viewModel.processIntent(ScannerIntent.RefreshNetwork) },
                onForgetSsid = { ssid -> viewModel.processIntent(ScannerIntent.ForgetSsidMapping(ssid)) },
                onClearAllSsid = { viewModel.processIntent(ScannerIntent.ClearAllSsidMappings) },
                onSaveCurrentAsSsid = { viewModel.processIntent(ScannerIntent.SaveCurrentAsSsidMapping) },
                onRequestLocationPermission = {
                    locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
                }
            )
        }
        // remainder
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (hasCameraPermission) {
                SimpleCameraContent { barcode -> 
                    viewModel.processIntent(ScannerIntent.BarcodeScanned(barcode))
                    panelExpanded = true
                }
            }
            
            val panelHeight = if (panelExpanded) 1f else if (uiState.product != null) 0.6f else 0.4f
            
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .fillMaxHeight(panelHeight)
                    .background(MaterialTheme.colorScheme.surface)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Painel de Edição", fontWeight = FontWeight.Bold)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (uiState.product != null || uiState.error != null) {
                            TextButton(onClick = { 
                                viewModel.processIntent(ScannerIntent.ClearProduct)
                                manualInput = ""
                                panelExpanded = false
                            }) { Text("Limpar") }
                        }
                        IconButton(onClick = { panelExpanded = !panelExpanded }) {
                            Icon(if (panelExpanded) Icons.Default.ExpandMore else Icons.Default.ExpandLess, "Expandir")
                        }
                    }
                }
                
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    OutlinedTextField(
                        value = manualInput,
                        onValueChange = { manualInput = it },
                        label = { Text("Código de Barras / Item ID") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = {
                            if (manualInput.isNotBlank()) {
                                val input = manualInput.trim()
                                val isBarcode = input.all { it.isDigit() } && input.length >= 8
                                if (isBarcode) {
                                    viewModel.processIntent(ScannerIntent.BarcodeScanned(input))
                                } else {
                                    viewModel.processIntent(ScannerIntent.ItemIdSearch(input))
                                }
                                panelExpanded = true
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !uiState.isLoading && manualInput.isNotBlank()
                    ) {
                        if (uiState.isLoading) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                        else Text("Buscar Produto")
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(8.dp))

                    // ----- Busca por nome -----
                    OutlinedTextField(
                        value = nameQuery,
                        onValueChange = { nameQuery = it },
                        label = { Text("Nome do produto (ou SKU/EAN)") },
                        placeholder = { Text("Ex: camiseta, 7891234...") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        enabled = !uiState.isSearching
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = {
                            if (nameQuery.isNotBlank()) {
                                viewModel.processIntent(ScannerIntent.NameSearch(nameQuery))
                                panelExpanded = true
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !uiState.isSearching && nameQuery.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.secondary
                        )
                    ) {
                        if (uiState.isSearching) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                        else Text("Buscar por Nome")
                    }

                    // ----- Resultados da busca por nome -----
                    if (uiState.searchResults.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "${uiState.searchResults.size} resultado(s) para \"${uiState.lastSearchQuery}\"",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                            TextButton(onClick = { viewModel.processIntent(ScannerIntent.ClearSearchResults) }) {
                                Text("Limpar")
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        uiState.searchResults.forEach { result ->
                            SearchResultCard(
                                result = result,
                                onClick = {
                                    nameQuery = ""
                                    viewModel.processIntent(ScannerIntent.OpenFromSearchResult(result.itemId))
                                    panelExpanded = true
                                }
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    uiState.warning?.let { warning ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3E0))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    warning,
                                    modifier = Modifier.weight(1f),
                                    color = Color(0xFFE65100),
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    
                    uiState.error?.let { errorKind ->
                        val errorMsg = stringResource(
                            when (errorKind) {
                                ScannerErrorKind.NOT_FOUND -> R.string.error_not_found
                                ScannerErrorKind.NO_CONNECTION -> R.string.error_no_connection
                                ScannerErrorKind.TIMEOUT -> R.string.error_timeout
                                ScannerErrorKind.SERVER -> R.string.error_server
                                ScannerErrorKind.UPDATE_FAILED -> R.string.error_update_failed
                                ScannerErrorKind.UNKNOWN -> R.string.error_unknown
                            }
                        )
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    errorMsg,
                                    modifier = Modifier.weight(1f),
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                                Button(
                                    onClick = {
                                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                        val clip = ClipData.newPlainText("Error", errorMsg)
                                        clipboard.setPrimaryClip(clip)
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = MaterialTheme.colorScheme.error
                                    ),
                                    modifier = Modifier.padding(start = 8.dp)
                                ) {
                                    Text("Copiar")
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    
                    uiState.product?.let { product ->
                        ProductEditor(
                            product = product,
                            onUpdatePrice = { vId, price -> viewModel.processIntent(ScannerIntent.UpdatePrice(vId, price)) },
                            onUpdateStock = { vId, stock -> viewModel.processIntent(ScannerIntent.UpdateStock(vId, stock)) },
                            onUpdateCost = { vId, cost -> viewModel.processIntent(ScannerIntent.UpdateCost(vId, cost)) }
                        )
                    }
                }
            }
        }
    }
}

/**
 * Card de resultado da busca por nome. Tap → abre o produto completo
 * (via [ScannerIntent.OpenFromSearchResult] que reaproveita [searchByItemId]).
 *
 * Mostra só o resumo (nome + variação + preço + estoque + ID). Sem custo
 * nem lucro aqui — isso é só um "qual desses você quer abrir?", não a
 * tela de edição.
 */
@Composable
fun SearchResultCard(
    result: ProductSearchResult,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = result.name.ifBlank { "(sem nome)" },
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.bodyLarge,
                maxLines = 2
            )
            if (result.variation.isNotBlank() && result.variation != "—") {
                Text(
                    text = "Variação: ${result.variation}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "R$ ${String.format("%.2f", result.price)}",
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Estoque: ${result.stock}",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (result.stock == 0) Color(0xFFF44336) else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "ID ${result.itemId}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun ProductEditor(
    product: Product,
    onUpdatePrice: (String, Double) -> Unit,
    onUpdateStock: (String, Int) -> Unit,
    onUpdateCost: (String, Double) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Produto: ${product.itemName}", fontWeight = FontWeight.Bold)
            Text("ID: ${product.itemId}", style = MaterialTheme.typography.bodySmall)
            
            Spacer(modifier = Modifier.height(16.dp))
            Text("Variações", fontWeight = FontWeight.Bold)
            
            product.variations.forEach { variation ->
                VariationEditor(
                    variation = variation,
                    onSave = { newPrice, newStock, newCost ->
                        if (newPrice != variation.price) onUpdatePrice(variation.variationId, newPrice)
                        if (newStock != variation.stock) onUpdateStock(variation.variationId, newStock)
                        if (newCost != variation.cost) onUpdateCost(variation.variationId, newCost)
                    }
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
fun VariationEditor(
    variation: ProductVariation,
    onSave: (Double, Int, Double) -> Unit
) {
    var priceText by remember(variation.price) { mutableStateOf(variation.price.toString()) }
    var stockText by remember(variation.stock) { mutableStateOf(variation.stock.toString()) }
    var costText by remember(variation.cost) { mutableStateOf(if (variation.cost > 0) variation.cost.toString() else "") }
    var isEditing by remember { mutableStateOf(false) }
    
    val (profit, margin) = calculateProfit(
        priceText.replace(",", ".").toDoubleOrNull() ?: variation.price,
        costText.replace(",", ".").toDoubleOrNull() ?: variation.cost
    )
    
    val context = LocalContext.current
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(variation.name, fontWeight = FontWeight.Bold)
            if (variation.barcode.isNotBlank()) {
                Text(
                    text = "📋 ${variation.barcode}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.clickable {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        val clip = ClipData.newPlainText("Barcode", variation.barcode)
                        clipboard.setPrimaryClip(clip)
                    }.padding(top = 4.dp, bottom = 4.dp)
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Preço:", style = MaterialTheme.typography.labelMedium)
                    if (isEditing) {
                        OutlinedTextField(
                            value = priceText,
                            onValueChange = { priceText = it },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                    } else {
                        Text("R$ ${String.format("%.2f", variation.price)}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    }
                }
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Column(modifier = Modifier.weight(1f)) {
                    Text("Estoque:", style = MaterialTheme.typography.labelMedium)
                    if (isEditing) {
                        OutlinedTextField(
                            value = stockText,
                            onValueChange = { stockText = it },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true
                        )
                    } else {
                        Text(
                            variation.stock.toString(), 
                            fontWeight = FontWeight.Bold, 
                            color = if (variation.stock == 0) Color(0xFFF44336) else if (variation.stock < 5) Color(0xFFF48FB1) else MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Custo:", style = MaterialTheme.typography.labelMedium)
                    if (isEditing) {
                        OutlinedTextField(
                            value = costText,
                            onValueChange = { costText = it },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            placeholder = { Text("R$") }
                        )
                    } else {
                        Text(
                            if (variation.cost > 0) "R$ ${String.format("%.2f", variation.cost)}" else "Não definido",
                            fontWeight = FontWeight.Bold,
                            color = if (variation.cost <= 0) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.primary
                        )
                    }
                }
                
                Column(modifier = Modifier.weight(1f)) {
                    Text("Lucro:", style = MaterialTheme.typography.labelMedium)
                    Text(
                        if (variation.cost <= 0) "Defina custo" 
                        else "R$ ${String.format("%.2f", profit)} (${String.format("%.1f", margin)}%)",
                        fontWeight = FontWeight.Bold,
                        color = if (profit > 0) Color(0xFF4CAF50) else Color(0xFFF44336)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                if (isEditing) {
                    OutlinedButton(onClick = { isEditing = false }) { Text("Cancelar") }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(onClick = {
                        val newPrice = priceText.replace(",", ".").toDoubleOrNull() ?: variation.price
                        val newStock = stockText.toIntOrNull() ?: variation.stock
                        val newCost = costText.replace(",", ".").toDoubleOrNull() ?: variation.cost
                        onSave(newPrice, newStock, newCost)
                        isEditing = false
                    }) { Text("Salvar") }
                } else {
                    Button(onClick = { isEditing = true }) { Text("Editar") }
                }
            }
        }
    }
}

// Taxas fixas e cálculos (movidos de ScannerScreen para utilitário ou mantidos aqui se for simples)
const val TAXA_TRANSACAO = 0.02

/**
 * Dialog de Configurações — gerencia a lista de URLs do usuário (Sessão 7, 2026-07-04).
 *
 * Equivalente à [com.rayshopee.app.ui.screens.SettingsDialog] do PedidosEditProduto.
 * Duplicado aqui intencionalmente (em vez de mover pro `:rayshopee-core`) porque
 * o core hoje não tem Compose como dep — manter nos apps preserva zero-impact.
 *
 * Cada URL pode ser editada individualmente (campo de texto com botão "✕" pra
 * remover) e o usuário pode adicionar mais via botão "Adicionar URL". Limite
 * de 5 URLs pra evitar UI poluída e config inválida.
 *
 * 🆕 2026-07-18 (Sprint 1.5) — Adicionadas seções:
 *  - Refresh button (LAN + mDNS + health-check em paralelo)
 *  - SSID atual + permission de localização
 *  - Lista de SSID mappings (auto-aprendidos) com forget
 *  - Botão "salvar mapping manual" do candidato atual
 *  - mDNS status (funcionando ou não no server)
 */
@Composable
fun UrlSettingsDialog(
    tempUrls: List<String>,
    candidates: List<String>,
    currentSsid: String?,
    ssidMappings: Map<String, String>,
    hasLocationPermission: Boolean,
    isRefreshing: Boolean,
    refreshFeedback: String?,
    onTempUrlsChange: (List<String>) -> Unit,
    onDismiss: () -> Unit,
    onSave: () -> Unit,
    onRefreshNetwork: () -> Unit,
    onForgetSsid: (String) -> Unit,
    onClearAllSsid: () -> Unit,
    onSaveCurrentAsSsid: () -> Unit,
    onRequestLocationPermission: () -> Unit
) {
    val scrollState = rememberScrollState()
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Configurar Servidor") },
        text = {
            Column(modifier = Modifier.verticalScroll(scrollState)) {
                // ----- Refresh button + feedback -----
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Button(
                        onClick = onRefreshNetwork,
                        enabled = !isRefreshing,
                        modifier = Modifier.weight(1f)
                    ) {
                        if (isRefreshing) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                        } else {
                            Text("🔄")
                            Spacer(modifier = Modifier.width(4.dp))
                        }
                        Text(if (isRefreshing) "Procurando..." else "Refresh (LAN + mDNS)")
                    }
                }
                if (refreshFeedback != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        refreshFeedback,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(8.dp))

                // ----- SSID atual + permissão de localização -----
                Text(
                    "📶  Wi-Fi atual:",
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
                if (hasLocationPermission) {
                    Text(
                        currentSsid ?: "(sem Wi-Fi / 4G)",
                        fontSize = 13.sp,
                        color = if (currentSsid != null) MaterialTheme.colorScheme.primary else Color.Gray
                    )
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "⚠️  Sem permissão de localização (Android 8+ exige pra ler SSID)",
                            fontSize = 11.sp,
                            color = Color(0xFFE65100),
                            modifier = Modifier.weight(1f)
                        )
                        TextButton(onClick = onRequestLocationPermission) {
                            Text("Permitir", fontSize = 11.sp)
                        }
                    }
                }
                if (currentSsid != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    OutlinedButton(
                        onClick = onSaveCurrentAsSsid,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("💾 Salvar mapping deste SSID → URL atual")
                    }
                }

                // ----- SSID mappings salvos -----
                if (ssidMappings.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "🗂  Mappings SSID salvos (${ssidMappings.size}):",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            modifier = Modifier.weight(1f)
                        )
                        TextButton(onClick = onClearAllSsid) {
                            Text("Apagar todos", fontSize = 11.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    ssidMappings.forEach { (ssid, url) ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(ssid, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                                Text(url, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            IconButton(onClick = { onForgetSsid(ssid) }) {
                                Icon(Icons.Default.Close, "Forget $ssid", modifier = Modifier.size(18.dp))
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(8.dp))

                // ----- URLs manuais (já existia) -----
                Text(
                    "Adicione uma ou mais URLs base na ordem que devem ser " +
                    "tentadas. A primeira é a mais rápida; deixe vazio para " +
                    "usar só descoberta automática (LAN + mDNS) + Cloudflare.",
                    fontSize = 12.sp
                )
                Spacer(modifier = Modifier.height(12.dp))

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
                                        0 -> "http://192.168.15.8:3003"
                                        else -> "https://xxx.ngrok-free.dev"
                                    },
                                    fontSize = 12.sp
                                )
                            },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
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

                if (tempUrls.size < 5) {
                    OutlinedButton(
                        onClick = { onTempUrlsChange(tempUrls + "") },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Add, null)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Adicionar URL")
                    }
                }

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
        confirmButton = { Button(onClick = onSave) { Text("Salvar") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } }
    )
}
const val IMPOSTO_GOVERNO = 0.06

data class FeeTier(val minPrice: Double, val commission: Double, val fixedFee: Double, val pixSubsidy: Double)
val FEE_TIERS = listOf(
    FeeTier(0.0, 0.25, 4.00, 0.00),
    FeeTier(12.0, 0.20, 4.00, 0.00),
    FeeTier(80.0, 0.14, 16.00, 0.01),
    FeeTier(100.0, 0.14, 16.00, 0.01),
    FeeTier(150.0, 0.12, 22.00, 0.01),
    FeeTier(300.0, 0.10, 36.00, 0.02),
    FeeTier(500.0, 0.08, 46.00, 0.02),
)

fun calculateProfit(price: Double, cost: Double): Pair<Double, Double> {
    if (price <= 0 || cost <= 0) return Pair(0.0, 0.0)
    var tier = FEE_TIERS[0]
    for (t in FEE_TIERS.reversed()) { if (price >= t.minPrice) { tier = t; break } }
    val taxaShopee = (price * tier.commission) + tier.fixedFee + (price * TAXA_TRANSACAO) - (price * tier.pixSubsidy)
    val imposto = price * IMPOSTO_GOVERNO
    val profit = price - cost - (taxaShopee + imposto)
    val margin = (profit / price) * 100
    return Pair(profit, margin)
}

@Composable
fun SimpleCameraContent(onBarcodeScanned: (String) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val executor = remember { Executors.newSingleThreadExecutor() }
    val options = remember {
        com.google.mlkit.vision.barcode.BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_EAN_13,
                Barcode.FORMAT_EAN_8,
                Barcode.FORMAT_UPC_A,
                Barcode.FORMAT_UPC_E,
                Barcode.FORMAT_CODE_128,
                Barcode.FORMAT_CODE_39
            )
            .build()
    }
    val scanner = remember { BarcodeScanning.getClient(options) }
    var lastBarcode by remember { mutableStateOf("") }
    
    Box(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surfaceVariant)) {
        AndroidView(factory = { PreviewView(it).also { pv ->
            val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
            cameraProviderFuture.addListener({
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also { it.setSurfaceProvider(pv.surfaceProvider) }
                val imageAnalysis = ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
                imageAnalysis.setAnalyzer(executor) { imageProxy ->
                    val mediaImage = imageProxy.image
                    if (mediaImage != null) {
                        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                        scanner.process(image).addOnSuccessListener { barcodes ->
                            barcodes.firstOrNull()?.rawValue?.let { bc ->
                                if (bc.isNotBlank() && bc != lastBarcode) { lastBarcode = bc; onBarcodeScanned(bc) }
                            }
                        }.addOnCompleteListener { imageProxy.close() }
                    } else { imageProxy.close() }
                }
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageAnalysis)
            }, ContextCompat.getMainExecutor(context))
        }}, modifier = Modifier.fillMaxSize())
    }
}