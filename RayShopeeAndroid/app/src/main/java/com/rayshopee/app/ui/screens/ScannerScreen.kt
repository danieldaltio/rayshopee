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
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors
import androidx.compose.material3.ExperimentalMaterial3Api

// Cloudflare Quick Tunnel URL - Update this when creating new tunnel
private const val TUNNEL_BASE_URL = "http://64.181.161.232:3003"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScannerScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    var hasCameraPermission by remember {
        mutableStateOf(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
    }
    
    var scannedBarcode by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var resultJson by remember { mutableStateOf<String?>(null) }
    var errorText by remember { mutableStateOf<String?>(null) }
    var panelExpanded by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { hasCameraPermission = it }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) permissionLauncher.launch(Manifest.permission.CAMERA)
    }
    
    // Function to update variation in JSON
    val onVariationUpdate: (String, Double, Int, Double) -> Unit = { variationId, newPrice, newStock, newCost ->
        resultJson?.let { json ->
            try {
                val obj = JSONObject(json)
                val variations = obj.getJSONArray("variations")
                for (i in 0 until variations.length()) {
                    val v = variations.getJSONObject(i)
                    if (v.getString("variationId") == variationId) {
                        v.put("price", newPrice)
                        v.put("stock", newStock)
                        v.put("cost", newCost)
                        resultJson = obj.toString()
                        break
                    }
                }
            } catch (e: Exception) { }
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("RayShopee Scanner", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimary) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.primary)
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (hasCameraPermission) {
                SimpleCameraContent { barcode -> scannedBarcode = barcode }
            }
            
            val panelHeight = if (panelExpanded) 1f else if (resultJson != null) 0.6f else 0.4f
            
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
                        if (resultJson != null) {
                            TextButton(onClick = { 
                                resultJson = null
                                scannedBarcode = null 
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
                        value = scannedBarcode ?: "",
                        onValueChange = { scannedBarcode = it },
                        label = { Text("Código de Barras / Item ID") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { 
                            val input = scannedBarcode ?: return@Button
                            if (input.isNotBlank()) {
                                isLoading = true
                                errorText = null
                                resultJson = null
                                panelExpanded = true
                                scope.launch {
                                    try {
                                        val result = searchItemById(input)
                                        resultJson = result
                                    } catch (e: Exception) {
                                        errorText = e.message
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isLoading && (scannedBarcode?.isNotBlank() == true)
                    ) {
                        if (isLoading) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MaterialTheme.colorScheme.onPrimary) 
                        else Text("Buscar Produto")
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    errorText?.let { error ->
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
                                    error,
                                    modifier = Modifier.weight(1f),
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                                Button(
                                    onClick = {
                                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                        val clip = ClipData.newPlainText("Error", error)
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
                    
                    resultJson?.let { json ->
                        ProductEditor(json = json, onVariationUpdate = onVariationUpdate)
                    }
                }
            }
        }
    }
}

@Composable
fun ProductEditor(json: String, onVariationUpdate: (String, Double, Int, Double) -> Unit) {
    val product = remember(json) { parseProduct(json) }
    
    if (product == null) {
        Text("Erro ao parsear produto")
        return
    }
    
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
                    itemId = product.itemId,
                    variationId = variation.variationId,
                    name = variation.name,
                    currentPrice = variation.price,
                    currentStock = variation.stock,
                    currentCost = variation.cost,
                    onSave = { newPrice, newStock, newCost ->
                        onVariationUpdate(variation.variationId, newPrice, newStock, newCost)
                    }
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
fun VariationEditor(
    itemId: String,
    variationId: String, 
    name: String, 
    currentPrice: Double, 
    currentStock: Int,
    currentCost: Double = 0.0,
    onSave: (Double, Int, Double) -> Unit
) {
    var priceText by remember(currentPrice) { mutableStateOf(currentPrice.toString()) }
    var stockText by remember(currentStock) { mutableStateOf(currentStock.toString()) }
    var costText by remember(currentCost) { mutableStateOf(if (currentCost > 0) currentCost.toString() else "") }
    var isEditing by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    var saveMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    
    val (profit, margin) = calculateProfit(
        priceText.toDoubleOrNull() ?: currentPrice,
        costText.toDoubleOrNull() ?: currentCost
    )
    
    // Update text when currentPrice/currentStock change (after save)
    LaunchedEffect(currentPrice, currentStock) {
        if (!isEditing && !isSaving) {
            priceText = currentPrice.toString()
            stockText = currentStock.toString()
            costText = if (currentCost > 0) currentCost.toString() else ""
        }
    }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(name, fontWeight = FontWeight.Bold)
            
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
                        Text("R$ ${String.format("%.2f", currentPrice)}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
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
                        Text(currentStock.toString(), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Cost input
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
                            if (currentCost > 0) "R$ ${String.format("%.2f", currentCost)}" else "Não definido",
                            fontWeight = FontWeight.Bold,
                            color = if (currentCost <= 0) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.primary
                        )
                    }
                }
                
                Spacer(modifier = Modifier.width(8.dp))
                
                // Profit display
                Column(modifier = Modifier.weight(1f)) {
                    Text("Lucro (taxas Shopee):", style = MaterialTheme.typography.labelMedium)
                    val isProfitable = profit > 0
                    Text(
                        if (currentCost <= 0 || costText.isBlank()) "Defina custo" 
                        else "R$ ${String.format("%.2f", profit)} (${String.format("%.1f", margin)}%)",
                        fontWeight = FontWeight.Bold,
                        color = when {
                            currentCost <= 0 || costText.isBlank() -> MaterialTheme.colorScheme.onSurfaceVariant
                            profit > 0 -> MaterialTheme.colorScheme.primary
                            else -> MaterialTheme.colorScheme.error
                        }
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                if (isEditing) {
                    OutlinedButton(onClick = { 
                        isEditing = false
                        priceText = currentPrice.toString()
                        stockText = currentStock.toString()
                        costText = if (currentCost > 0) currentCost.toString() else ""
                    }) { Text("Cancelar") }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val newPrice = priceText.toDoubleOrNull()
                            val newStock = stockText.toIntOrNull()
                            val newCost = costText.toDoubleOrNull() ?: 0.0
                            if (newPrice != null && newStock != null) {
                                isSaving = true
                                scope.launch {
                                    try {
                                        updatePriceStockCost(itemId, variationId, newPrice, newStock, newCost)
                                        onSave(newPrice, newStock, newCost)
                                        saveMessage = "Salvo!"
                                        isEditing = false
                                    } catch (e: Exception) {
                                        saveMessage = "Erro: ${e.message}"
                                    } finally {
                                        isSaving = false
                                    }
                                }
                            }
                        },
                        enabled = !isSaving
                    ) {
                        if (isSaving) CircularProgressIndicator(modifier = Modifier.size(16.dp))
                        else Text("Salvar")
                    }
                } else {
                    Button(onClick = { isEditing = true }) { Text("Editar") }
                }
            }
            
            saveMessage?.let { msg ->
                Text(msg, color = if (msg.startsWith("Erro")) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary)
                LaunchedEffect(msg) { kotlinx.coroutines.delay(2000); saveMessage = null }
            }
        }
    }
}

suspend fun updatePriceStockCost(itemId: String, variationId: String, price: Double, stock: Int, cost: Double) = withContext(Dispatchers.IO) {
    try {
        // Update stock
        val stockUrl = "$TUNNEL_BASE_URL/api/products/update-stock"
        val stockJson = """{"itemId":"$itemId","variationId":"$variationId","stock":$stock}"""
        val stockConn = java.net.URL(stockUrl).openConnection() as java.net.HttpURLConnection
        stockConn.requestMethod = "POST"
        stockConn.setRequestProperty("Content-Type", "application/json")
        stockConn.connectTimeout = 10000
        stockConn.doOutput = true
        stockConn.outputStream.write(stockJson.toByteArray())
        val stockResponse = stockConn.responseCode
        val stockBody = stockConn.errorStream?.bufferedReader()?.readText() ?: ""
        if (stockResponse != 200 && stockResponse != 201) {
            throw Exception("Stock HTTP $stockResponse: $stockBody")
        }
        
        // Update cost if provided
        if (cost > 0) {
            val modelId = variationId.toIntOrNull() ?: 0
            val costUrl = "$TUNNEL_BASE_URL/api/products/update-cost"
            val costJson = """{"item_id":"$itemId","model_id":$modelId,"cost":$cost}"""
            val costConn = java.net.URL(costUrl).openConnection() as java.net.HttpURLConnection
            costConn.requestMethod = "POST"
            costConn.setRequestProperty("Content-Type", "application/json")
            costConn.connectTimeout = 10000
            costConn.doOutput = true
            costConn.outputStream.write(costJson.toByteArray())
            val costResponse = costConn.responseCode
            val costBody = costConn.errorStream?.bufferedReader()?.readText() ?: ""
            if (costResponse != 200 && costResponse != 201) {
                throw Exception("Cost HTTP $costResponse: $costBody")
            }
        }
    } catch (e: Exception) {
        throw Exception("Erro atualizar: ${e.message}")
    }
}

suspend fun searchItemById(itemId: String): String = withContext(Dispatchers.IO) {
    try {
        val barcodeUrl = "$TUNNEL_BASE_URL/api/products/barcode?barcode=$itemId"
        val barcodeConn = java.net.URL(barcodeUrl).openConnection() as java.net.HttpURLConnection
        barcodeConn.connectTimeout = 10000
        barcodeConn.setRequestProperty("bypass-tunnel-reminder", "true")
        barcodeConn.setRequestProperty("User-Agent", "RayShopeeApp/1.0")
        val barcodeCode = barcodeConn.responseCode
        if (barcodeCode == 200) {
            return@withContext barcodeConn.inputStream.bufferedReader().readText()
        }
        
        val url = "$TUNNEL_BASE_URL/api/products/item/$itemId"
        val conn = java.net.URL(url).openConnection() as java.net.HttpURLConnection
        conn.connectTimeout = 10000
        conn.setRequestProperty("bypass-tunnel-reminder", "true")
        conn.setRequestProperty("User-Agent", "RayShopeeApp/1.0")
        val code = conn.responseCode
        if (code != 200) {
            val errorBody = conn.errorStream?.bufferedReader()?.readText() ?: "No response"
            throw Exception("HTTP $code - $errorBody")
        }
        conn.inputStream.bufferedReader().readText()
    } catch (e: Exception) {
        throw Exception("Erro API: ${e.message}")
    }
}

data class ParsedProduct(val itemId: String, val itemName: String, val variations: List<ParsedVariation>)
data class ParsedVariation(val variationId: String, val name: String, val price: Double, val stock: Int, val cost: Double = 0.0)

// Taxa de transação (2%)
const val TAXA_TRANSACAO = 0.02
// Imposto do governo (6%)
const val IMPOSTO_GOVERNO = 0.06

// Tabela de comissão Shopee por faixa de preço
data class FeeTier(val minPrice: Double, val commission: Double, val fixedFee: Double, val pixSubsidy: Double)
val FEE_TIERS = listOf(
    FeeTier(0.0, 0.25, 4.00, 0.00),      // R$ 0-12: 25% + R$4
    FeeTier(12.0, 0.20, 4.00, 0.00),     // R$ 12-80: 20% + R$4
    FeeTier(80.0, 0.14, 16.00, 0.01),   // R$ 80-100: 14% + R$16 + 1% pix
    FeeTier(100.0, 0.14, 16.00, 0.01),  // R$ 100-150: 14% + R$16 + 1% pix
    FeeTier(150.0, 0.12, 22.00, 0.01),  // R$ 150-300: 12% + R$22 + 1% pix
    FeeTier(300.0, 0.10, 36.00, 0.02), // R$ 300-500: 10% + R$36 + 2% pix
    FeeTier(500.0, 0.08, 46.00, 0.02), // R$ 500+: 8% + R$46 + 2% pix
)

fun calculateProfit(price: Double, cost: Double): Pair<Double, Double> {
    if (price <= 0 || cost <= 0) return Pair(0.0, 0.0)
    
    // Find applicable tier
    var tier = FEE_TIERS[0]
    for (t in FEE_TIERS.reversed()) {
        if (price >= t.minPrice) {
            tier = t
            break
        }
    }
    
    val commission = price * tier.commission
    val fixedFee = tier.fixedFee
    val pixSubsidy = price * tier.pixSubsidy
    val transacao = price * TAXA_TRANSACAO
    val taxaShopee = commission + fixedFee + transacao - pixSubsidy
    val imposto = price * IMPOSTO_GOVERNO
    val totalTaxas = taxaShopee + imposto
    
    val profit = price - cost - totalTaxas
    val margin = if (price > 0) (profit / price) * 100 else 0.0
    
    return Pair(profit, margin)
}

fun parseProduct(json: String): ParsedProduct? {
    return try {
        val product = JSONObject(json)
        val itemId = product.getString("itemId")
        val itemName = product.getString("itemName")
        val variationsArray = product.getJSONArray("variations")
        val variations = (0 until variationsArray.length()).map { i ->
            val v = variationsArray.getJSONObject(i)
            val cost = if (v.has("cost")) v.getDouble("cost") else 0.0
            ParsedVariation(
                variationId = v.getString("variationId"),
                name = v.getString("name"),
                price = v.getDouble("price"),
                stock = v.getInt("stock"),
                cost = cost
            )
        }
        ParsedProduct(itemId, itemName, variations)
    } catch (e: Exception) {
        null
    }
}

@Composable
fun SimpleCameraContent(onBarcodeScanned: (String) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val executor = remember { Executors.newSingleThreadExecutor() }
    val scanner = remember { BarcodeScanning.getClient() }
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