package com.rayshopee.app.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen() {
    val context = LocalContext.current
    val sharedPrefs = remember { context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE) }
    
    var baseUrl by remember { 
        mutableStateOf(sharedPrefs.getString("base_url", "https://unpaining-transcriptionally-patrick.ngrok-free.dev") ?: "https://unpaining-transcriptionally-patrick.ngrok-free.dev") 
    }
    
    val scope = rememberCoroutineScope()
    var orders by remember { mutableStateOf<List<ParsedOrder>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var isSyncing by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    var detailedError by remember { mutableStateOf<String?>(null) }
    var showSettings by remember { mutableStateOf(false) }
    var tempUrl by remember { mutableStateOf(baseUrl) }

    // State for Editing
    var editingItem by remember { mutableStateOf<ParsedOrderItem?>(null) }

    fun refreshOrders() {
        isLoading = true
        errorText = null
        scope.launch {
            try {
                val result = fetchOrdersToShip(baseUrl)
                orders = result
            } catch (e: Exception) {
                errorText = e.message
                detailedError = "Falha ao buscar pedidos:\n${e.message}\n\n${e.toString()}"
            } finally {
                isLoading = false
            }
        }
    }

    fun syncShopeeData() {
        isSyncing = true
        scope.launch {
            try {
                updateProductValue(baseUrl, "/api/products/sync-full", JSONObject())
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Sincronização completa concluída!", Toast.LENGTH_LONG).show()
                    refreshOrders()
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    errorText = "Falha na sincronização"
                    detailedError = e.message
                    isSyncing = false
                }
            } finally {
                isSyncing = false
            }
        }
    }

    fun syncSingleItem(itemId: String) {
        scope.launch {
            try {
                updateProductValue(baseUrl, "/api/products/sync-item/$itemId", JSONObject())
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Produto sincronizado!", Toast.LENGTH_SHORT).show()
                    refreshOrders()
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    detailedError = "Falha ao sincronizar item $itemId:\n${e.message}"
                }
            }
        }
    }

    LaunchedEffect(baseUrl) {
        refreshOrders()
    }

    if (showSettings) {
        AlertDialog(
            onDismissRequest = { showSettings = false },
            title = { Text("Configurar Servidor") },
            text = {
                Column {
                    Text("Digite a URL base do seu servidor (Render ou Ngrok):", fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = tempUrl,
                        onValueChange = { tempUrl = it },
                        label = { Text("Base URL") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    baseUrl = tempUrl.trim().removeSuffix("/")
                    sharedPrefs.edit().putString("base_url", baseUrl).apply()
                    showSettings = false
                }) {
                    Text("Salvar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showSettings = false }) {
                    Text("Cancelar")
                }
            }
        )
    }

    if (detailedError != null) {
        val isHtml = detailedError!!.contains("<!DOCTYPE", ignoreCase = true) || detailedError!!.contains("<html", ignoreCase = true)
        AlertDialog(
            onDismissRequest = { detailedError = null },
            title = { Text(if (isHtml) "Aviso do Servidor (HTML)" else "Erro Detalhado") },
            text = { 
                Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                    if (isHtml) {
                        Text(
                            "O servidor retornou uma página HTML em vez de dados. Isso geralmente acontece quando o Ngrok pede para clicar em 'Visit Site' ou o servidor não foi reiniciado.",
                            color = MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    SelectionContainer {
                        Text(detailedError!!, fontSize = 10.sp, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                    }
                }
            },
            confirmButton = {
                Row {
                    TextButton(onClick = {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        val clip = ClipData.newPlainText("Erro RayShopee", detailedError)
                        clipboard.setPrimaryClip(clip)
                        Toast.makeText(context, "Copiado!", Toast.LENGTH_SHORT).show()
                    }) {
                        Text("Copiar")
                    }
                    Button(onClick = { detailedError = null }) { Text("Fechar") }
                }
            }
        )
    }

    // Edit Product Dialog
    editingItem?.let { item ->
        EditProductDialog(
            item = item,
            baseUrl = baseUrl,
            onDismiss = { editingItem = null },
            onSuccess = {
                editingItem = null
                refreshOrders()
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("PedidosEditProduto", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { showSettings = true }) {
                        Icon(Icons.Default.Settings, contentDescription = "Configurações")
                    }
                    IconButton(onClick = { syncShopeeData() }, enabled = !isSyncing && !isLoading) {
                        if (isSyncing) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                        } else {
                            Icon(Icons.Default.Sync, contentDescription = "Sincronizar Shopee")
                        }
                    }
                    IconButton(onClick = { refreshOrders() }, enabled = !isLoading && !isSyncing) {
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
            if (isLoading && orders.isEmpty()) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else if (errorText != null && orders.isEmpty()) {
                Column(
                    modifier = Modifier.align(Alignment.Center).padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Erro ao carregar pedidos", color = MaterialTheme.colorScheme.error)
                    Text(errorText!!, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 4.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { refreshOrders() }) {
                        Text("Tentar Novamente")
                    }
                }
            } else if (orders.isEmpty() && !isLoading) {
                Text("Nenhum pedido encontrado", modifier = Modifier.align(Alignment.Center))
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(orders) { order ->
                        OrderCard(order, baseUrl, onEditItem = { editingItem = it }, onRefresh = { refreshOrders() })
                    }
                }
            }
        }
    }
}

@Composable
fun OrderCard(order: ParsedOrder, baseUrl: String, onEditItem: (ParsedOrderItem) -> Unit, onRefresh: () -> Unit) {
    val dateFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
    val dateStr = dateFormat.format(Date(order.createTime))

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "Pedido: ${order.orderSn}", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                Surface(
                    color = when(order.status) {
                        "READY_TO_SHIP" -> Color(0xFFFF9800)
                        "SHIPPED", "PROCESSED" -> Color(0xFF2196F3)
                        "COMPLETED" -> Color(0xFF4CAF50)
                        else -> Color.Gray
                    },
                    shape = MaterialTheme.shapes.extraSmall
                ) {
                    Text(
                        text = order.status,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White
                    )
                }
            }
            
            Text(text = dateStr, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            
            if (order.shippingCarrier.isNotBlank()) {
                Text(text = "Transportadora: ${order.shippingCarrier}", style = MaterialTheme.typography.labelSmall)
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), thickness = 0.5.dp)

            order.items.forEach { item ->
                OrderItemRow(item, baseUrl, onRefresh = onRefresh, onClick = { onEditItem(item) })
                Spacer(modifier = Modifier.height(4.dp))
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), thickness = 0.5.dp)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Valor Venda", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text("R$ ${String.format("%.2f", order.totalAmount)}", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Lucro Previsto", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    val profitColor = if (order.predictedProfit > 0) Color(0xFF2E7D32) else Color.Red
                    Text(
                        "R$ ${String.format("%.2f", order.predictedProfit)}", 
                        fontWeight = FontWeight.Bold,
                        color = profitColor,
                        fontSize = 16.sp
                    )
                }
            }
        }
    }
}

@Composable
fun OrderItemRow(item: ParsedOrderItem, baseUrl: String, onRefresh: () -> Unit, onClick: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            Icons.Default.ShoppingBag, 
            contentDescription = null, 
            modifier = Modifier.size(32.dp),
            tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
        )
        Column(modifier = Modifier.weight(1f).padding(start = 8.dp)) {
            Text(item.name, fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 1)
            
            // Barcode Row
            if (item.barcode.isNotBlank()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable { 
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        val clip = ClipData.newPlainText("EAN", item.barcode)
                        clipboard.setPrimaryClip(clip)
                        Toast.makeText(context, "Código copiado!", Toast.LENGTH_SHORT).show()
                    }
                ) {
                    Text(
                        text = "EAN: ${item.barcode}", 
                        fontSize = 11.sp, 
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        Icons.Default.ContentCopy, 
                        contentDescription = "Copiar", 
                        modifier = Modifier.size(12.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }

            Text("${item.variation} | Qtd: ${item.quantity}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Venda: R$ ${String.format("%.2f", item.price)}", fontSize = 11.sp)
                Text("Custo: R$ ${String.format("%.2f", item.cost)}", fontSize = 11.sp, color = Color.Blue)
                Text("Estoque: ${item.stock}", fontSize = 11.sp, color = if(item.stock < 5) Color.Red else Color.Unspecified)
            }
        }
        IconButton(onClick = {
            // Sincronizar apenas este item
            scope.launch {
                try {
                    updateProductValue(baseUrl, "/api/products/sync-item/${item.itemId}", JSONObject())
                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "Item sincronizado!", Toast.LENGTH_SHORT).show()
                        onRefresh()
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "Erro: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }, modifier = Modifier.size(24.dp)) {
            Icon(Icons.Default.Sync, contentDescription = "Sincronizar Item", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
        }
        IconButton(onClick = { onClick() }, modifier = Modifier.size(24.dp)) {
            Icon(Icons.Default.Edit, contentDescription = "Editar", modifier = Modifier.size(16.dp), tint = Color.Gray)
        }
    }
}

@Composable
fun EditProductDialog(
    item: ParsedOrderItem,
    baseUrl: String,
    onDismiss: () -> Unit,
    onSuccess: () -> Unit
) {
    var cost by remember { mutableStateOf(item.cost.toString()) }
    var stock by remember { mutableStateOf(item.stock.toString()) }
    var price by remember { mutableStateOf(item.price.toString()) }
    var isSaving by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    AlertDialog(
        onDismissRequest = { if (!isSaving) onDismiss() },
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Editar Produto", fontWeight = FontWeight.Bold)
                IconButton(onClick = {
                    scope.launch {
                        try {
                            updateProductValue(baseUrl, "/api/products/sync-item/${item.itemId}", JSONObject())
                            withContext(Dispatchers.Main) {
                                Toast.makeText(context, "Dados da Shopee sincronizados!", Toast.LENGTH_SHORT).show()
                                onSuccess()
                            }
                        } catch (e: Exception) {
                            withContext(Dispatchers.Main) {
                                Toast.makeText(context, "Erro: ${e.message}", Toast.LENGTH_LONG).show()
                            }
                        }
                    }
                }) {
                    Icon(Icons.Default.Sync, contentDescription = "Sincronizar com Shopee", tint = MaterialTheme.colorScheme.primary)
                }
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(item.name, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 2)
                Text("Variação: ${item.variation}", fontSize = 11.sp, color = Color.Gray)
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = cost,
                    onValueChange = { cost = it },
                    label = { Text("Preço de Custo (R$)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = stock,
                    onValueChange = { stock = it },
                    label = { Text("Estoque Shopee") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it },
                    label = { Text("Preço de Venda (R$)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(
                enabled = !isSaving,
                onClick = {
                    isSaving = true
                    scope.launch {
                        try {
                            // 1. Update Cost
                            updateProductValue(baseUrl, "/api/products/update-cost", JSONObject().apply {
                                put("item_id", item.itemId)
                                put("model_id", item.modelId)
                                put("cost", cost.toDoubleOrNull() ?: 0.0)
                            })
                            
                            // 2. Update Stock
                            updateProductValue(baseUrl, "/api/products/update-stock", JSONObject().apply {
                                put("itemId", item.itemId)
                                put("variationId", item.modelId)
                                put("stock", stock.toIntOrNull() ?: 0)
                            })

                            // 3. Update Price
                            updateProductValue(baseUrl, "/api/products/update-price", JSONObject().apply {
                                put("itemId", item.itemId)
                                put("variationId", item.modelId)
                                put("price", price.toDoubleOrNull() ?: 0.0)
                            })

                            withContext(Dispatchers.Main) {
                                Toast.makeText(context, "Produto atualizado!", Toast.LENGTH_SHORT).show()
                                onSuccess()
                            }
                        } catch (e: Exception) {
                            withContext(Dispatchers.Main) {
                                Toast.makeText(context, "Erro: ${e.message}", Toast.LENGTH_LONG).show()
                                isSaving = false
                            }
                        }
                    }
                }
            ) {
                if (isSaving) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                else Text("Salvar Tudo")
            }
        },
        dismissButton = {
            TextButton(enabled = !isSaving, onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

suspend fun updateProductValue(baseUrl: String, endpoint: String, body: JSONObject) = withContext(Dispatchers.IO) {
    val url = "$baseUrl$endpoint"
    val conn = java.net.URL(url).openConnection() as java.net.HttpURLConnection
    conn.requestMethod = "POST"
    conn.doOutput = true
    conn.connectTimeout = 60000 // 60 segundos
    conn.readTimeout = 60000
    conn.setRequestProperty("Content-Type", "application/json")
    conn.setRequestProperty("bypass-tunnel-reminder", "true")
    
    conn.outputStream.use { it.write(body.toString().toByteArray()) }
    
    val code = conn.responseCode
    if (code !in 200..299) {
        val err = conn.errorStream?.bufferedReader()?.readText() ?: "Erro $code"
        throw Exception(err)
    }
}

suspend fun fetchOrdersToShip(baseUrl: String): List<ParsedOrder> = withContext(Dispatchers.IO) {
    try {
        val url = "$baseUrl/api/orders/to-ship"
        val conn = java.net.URL(url).openConnection() as java.net.HttpURLConnection
        conn.connectTimeout = 15000
        conn.setRequestProperty("bypass-tunnel-reminder", "true")
        conn.setRequestProperty("User-Agent", "PedidosEditProduto/1.0")
        
        val code = conn.responseCode
        if (code != 200) {
            val errorBody = conn.errorStream?.bufferedReader()?.readText() ?: "Erro $code"
            throw Exception("HTTP $code - $errorBody")
        }
        
        val response = conn.inputStream.bufferedReader().readText()
        val obj = JSONObject(response)
        val ordersArray = obj.getJSONArray("orders")
        
        val list = mutableListOf<ParsedOrder>()
        for (i in 0 until ordersArray.length()) {
            val o = ordersArray.getJSONObject(i)
            val itemsArray = o.optJSONArray("items") ?: org.json.JSONArray()
            val items = mutableListOf<ParsedOrderItem>()
            for (j in 0 until itemsArray.length()) {
                val it = itemsArray.getJSONObject(j)
                items.add(ParsedOrderItem(
                    itemId = it.optString("itemId", ""),
                    modelId = it.optString("modelId", ""),
                    name = it.optString("name", "Produto"),
                    variation = it.optString("variation", ""),
                    price = it.optDouble("price", 0.0),
                    cost = it.optDouble("cost", 0.0),
                    quantity = it.optInt("quantity", 0),
                    predictedProfit = it.optDouble("predictedProfit", 0.0),
                    stock = it.optInt("stock", 0),
                    barcode = it.optString("barcode", "")
                ))
            }
            
            list.add(ParsedOrder(
                orderSn = o.optString("orderSn", "N/A"),
                status = o.optString("status", "UNKNOWN"),
                createTime = o.optLong("createTime", 0L),
                totalAmount = o.optDouble("totalAmount", 0.0),
                shippingCarrier = o.optString("shippingCarrier", ""),
                items = items,
                orderCost = o.optDouble("orderCost", 0.0),
                predictedProfit = o.optDouble("predictedProfit", 0.0)
            ))
        }
        list
    } catch (e: Exception) {
        throw Exception("${e.message}")
    }
}

data class ParsedOrder(
    val orderSn: String,
    val status: String,
    val createTime: Long,
    val totalAmount: Double,
    val shippingCarrier: String,
    val items: List<ParsedOrderItem>,
    val orderCost: Double,
    val predictedProfit: Double
)

data class ParsedOrderItem(
    val itemId: String,
    val modelId: String,
    val name: String,
    val variation: String,
    val price: Double,
    val cost: Double,
    val quantity: Int,
    val predictedProfit: Double,
    val stock: Int,
    val barcode: String
)
