package com.shopeelister.ui.editor

import com.shopeelister.domain.model.Variation
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.shopeelister.ui.components.LoadingOverlay
import com.shopeelister.ui.components.OutlinedDropdown
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditorScreen(
    ean: String,
    imagePath: String,
    query: String = "",
    onPublish: () -> Unit,
    onBack: () -> Unit,
    viewModel: EditorViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val product = state.product

    // Local UI states for image transformations
    var scale by remember(state.imageBitmap) { mutableFloatStateOf(1f) }
    var rotation by remember(state.imageBitmap) { mutableFloatStateOf(0f) }
    var offsetX by remember(state.imageBitmap) { mutableFloatStateOf(0f) }
    var offsetY by remember(state.imageBitmap) { mutableFloatStateOf(0f) }

    var brightness by remember(state.imageBitmap) { mutableFloatStateOf(0f) } // -255 to 255
    var contrast by remember(state.imageBitmap) { mutableFloatStateOf(1f) }   // 0 to 2
    var saturation by remember(state.imageBitmap) { mutableFloatStateOf(1f) } // 0 to 2

    val hasChanges = scale != 1f || rotation != 0f || offsetX != 0f || offsetY != 0f ||
                     brightness != 0f || contrast != 1f || saturation != 1f

    LaunchedEffect(ean, imagePath, query) {
        viewModel.init(ean, imagePath, query)
    }

    LaunchedEffect(state.publishResult) {
        if (state.publishResult == "success") onPublish()
    }

    Box(Modifier.fillMaxSize()) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Editar Produto") },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.Default.ArrowBack, "Voltar")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background
                    )
                )
            },
            bottomBar = {
                Surface(tonalElevation = 3.dp) {
                    Button(
                        onClick = { viewModel.publish(scale, rotation, offsetX, offsetY, brightness, contrast, saturation) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .height(52.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Icon(Icons.Default.Publish, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Publicar na Shopee", style = MaterialTheme.typography.labelLarge)
                    }
                }
            }
        ) { padding ->
            val product = state.product

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Image preview
                state.imageBitmap?.let { bmp ->
                    var showTuning by remember { mutableStateOf(false) }

                    val colorMatrix = remember(brightness, contrast, saturation) {
                        ColorMatrix().apply {
                            setToSaturation(saturation)
                            
                            val contrastMatrix = ColorMatrix(floatArrayOf(
                                contrast, 0f, 0f, 0f, brightness,
                                0f, contrast, 0f, 0f, brightness,
                                0f, 0f, contrast, 0f, brightness,
                                0f, 0f, 0f, 1f, 0f
                            ))
                            // Can't easily use postConcat in Compose ColorMatrix directly, we can do it via android.graphics if needed,
                            // or just use setToScale for RGB. Actually, Compose ColorMatrix doesn't have postConcat. 
                            // Let's use android.graphics.ColorMatrix!
                        }
                    }

                    // Android graphics matrix for precise filtering
                    val androidMatrix = remember(brightness, contrast, saturation) {
                        val cm = android.graphics.ColorMatrix()
                        cm.setSaturation(saturation)
                        val cMat = android.graphics.ColorMatrix(floatArrayOf(
                            contrast, 0f, 0f, 0f, brightness,
                            0f, contrast, 0f, 0f, brightness,
                            0f, 0f, contrast, 0f, brightness,
                            0f, 0f, 0f, 1f, 0f
                        ))
                        cm.postConcat(cMat)
                        androidx.compose.ui.graphics.ColorMatrix(cm.array)
                    }

                    Column {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(1f) // Square 1:1 preview (Shopee format)
                                .clip(RoundedCornerShape(12.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                                .pointerInput(Unit) {
                                    detectTransformGestures { _, pan, zoom, rotationChange ->
                                        scale = (scale * zoom).coerceIn(0.5f, 5f)
                                        rotation += rotationChange
                                        offsetX += pan.x
                                        offsetY += pan.y
                                    }
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Image(
                                bitmap = bmp.asImageBitmap(),
                                contentDescription = "Foto do produto",
                                modifier = Modifier
                                    .fillMaxSize()
                                    .graphicsLayer(
                                        scaleX = scale,
                                        scaleY = scale,
                                        rotationZ = rotation,
                                        translationX = offsetX,
                                        translationY = offsetY
                                    ),
                                contentScale = ContentScale.Fit,
                                colorFilter = ColorFilter.colorMatrix(androidMatrix)
                            )
                            
                            if (state.isRemovingBg) {
                                Box(
                                    Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface.copy(alpha = 0.7f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator()
                                }
                            }
                        }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(onClick = { rotation -= 90f }) {
                                Icon(Icons.Default.RotateLeft, "Girar -90°")
                            }
                            
                            IconButton(onClick = { rotation += 90f }) {
                                Icon(Icons.Default.RotateRight, "Girar +90°")
                            }
                            
                            IconButton(onClick = { 
                                scale = 1f; rotation = 0f; offsetX = 0f; offsetY = 0f
                                brightness = 0f; contrast = 1f; saturation = 1f
                            }) {
                                Icon(Icons.Default.Refresh, "Resetar")
                            }
                            
                            IconButton(onClick = { showTuning = true }) {
                                Icon(Icons.Default.Tune, "Refinar Imagem")
                            }
                            
                            IconButton(
                                onClick = { viewModel.removeBackground() },
                                enabled = !state.isRemovingBg
                            ) {
                                Icon(Icons.Default.CleaningServices, "Remover Fundo")
                            }
                        }
                        
                        Text(
                            text = "Arraste para posicionar | Pinça para zoom | Girar com dois dedos",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        
                        Button(
                            onClick = { 
                                viewModel.applyImageTransform(
                                    scale, rotation, offsetX, offsetY,
                                    brightness, contrast, saturation
                                ) 
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = hasChanges,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Icon(Icons.Default.Check, null, Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(if (hasChanges) "Aplicar Modificações (Corte 1:1)" else "Imagem OK (1:1)")
                        }

                        if (showTuning) {
                            ModalBottomSheet(onDismissRequest = { showTuning = false }) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(start = 16.dp, end = 16.dp, bottom = 48.dp, top = 8.dp),
                                    verticalArrangement = Arrangement.spacedBy(16.dp)
                                ) {
                                    Text("Refinar Imagem (Tratamento)", style = MaterialTheme.typography.titleMedium)
                                    
                                    Column {
                                        Text("Brilho (${brightness.toInt()})", style = MaterialTheme.typography.labelMedium)
                                        Slider(
                                            value = brightness,
                                            onValueChange = { brightness = it },
                                            valueRange = -255f..255f
                                        )
                                    }
                                    
                                    Column {
                                        Text("Contraste (${"%.2f".format(contrast)})", style = MaterialTheme.typography.labelMedium)
                                        Slider(
                                            value = contrast,
                                            onValueChange = { contrast = it },
                                            valueRange = 0f..2f
                                        )
                                    }
                                    
                                    Column {
                                        Text("Saturação (${"%.2f".format(saturation)})", style = MaterialTheme.typography.labelMedium)
                                        Slider(
                                            value = saturation,
                                            onValueChange = { saturation = it },
                                            valueRange = 0f..2f
                                        )
                                    }
                                    
                                    Button(
                                        onClick = { showTuning = false },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("Concluir")
                                    }
                                }
                            }
                        }
                    }
                }

                // Title
                OutlinedTextField(
                    value = product.title,
                    onValueChange = { viewModel.updateTitle(it) },
                    label = { Text("Título") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 2,
                    trailingIcon = {
                        if (state.isImprovingTitle) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp).padding(end = 8.dp), strokeWidth = 2.dp)
                        } else {
                            IconButton(onClick = { viewModel.improveTitle() }) {
                                Icon(Icons.Default.AutoAwesome, "Melhorar título com IA", tint = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
                )

                // EAN + SKU row
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = product.ean,
                        onValueChange = { viewModel.updateEan(it) },
                        label = { Text("EAN") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                    OutlinedTextField(
                        value = product.sku,
                        onValueChange = { viewModel.updateSku(it) },
                        label = { Text("SKU") },
                        modifier = Modifier.weight(1f)
                    )
                }

                // Description
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Descrição",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    TextButton(
                        onClick = { viewModel.generateDescription() },
                        enabled = !state.isGenerating && product.title.isNotBlank()
                    ) {
                        if (state.isGenerating) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                            Spacer(Modifier.width(8.dp))
                        }
                        Icon(Icons.Default.AutoAwesome, null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Gerar com IA")
                    }
                }
                OutlinedTextField(
                    value = product.description,
                    onValueChange = { viewModel.updateDescription(it) },
                    label = { Text("Texto da Descrição") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 10
                )

                // Brand + Price
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    val hasVars = product.variations.isNotEmpty()
                    OutlinedTextField(
                        value = product.brand,
                        onValueChange = { viewModel.updateBrand(it) },
                        label = { Text("Marca") },
                        modifier = Modifier.weight(1f)
                    )
                    
                    var priceText by remember { mutableStateOf(if (product.priceCents > 0) "%.2f".format(product.priceCents / 100.0).replace(".", ",") else "") }
                    
                    OutlinedTextField(
                        value = priceText,
                        onValueChange = { 
                            if (it.length <= 10) {
                                priceText = it
                                viewModel.updatePrice(it) 
                            }
                        },
                        label = { Text(if (hasVars) "Preço (Variações)" else "Preço (R$)") },
                        modifier = Modifier.weight(1f),
                        enabled = !hasVars,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        prefix = { Text("R$ ") }
                    )
                }

                // Category selection with helper
                Text(
                    "Categoria (Exigido: Nível Final)",
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.padding(top = 8.dp)
                )
                
                if (state.categories.isNotEmpty()) {
                    OutlinedDropdown(
                        label = "Categorias Principais",
                        value = product.categoryName.ifBlank { "Selecione" },
                        options = state.categories.map { it.second },
                        onValueChange = { name ->
                            val cat = state.categories.firstOrNull { it.second == name }
                            if (cat != null) viewModel.updateCategory(cat.first, cat.second)
                        }
                    )
                }

                // AI/Manual Search Helper for Categories
                var catSearch by remember { mutableStateOf("") }
                OutlinedTextField(
                    value = catSearch,
                    onValueChange = { catSearch = it },
                    label = { Text("Procurar categoria específica (ex: Camiseta)") },
                    modifier = Modifier.fillMaxWidth(),
                    trailingIcon = {
                        Row {
                            IconButton(onClick = { viewModel.suggestCategoryWithAi() }) {
                                Icon(Icons.Default.AutoAwesome, "Sugerir com IA", tint = MaterialTheme.colorScheme.primary)
                            }
                            IconButton(onClick = {
                                val match = com.shopeelister.util.CategoryData.findCategory(catSearch)
                                if (match != null) {
                                    viewModel.updateCategory(match.first, match.second)
                                    catSearch = ""
                                }
                            }) {
                                Icon(Icons.Default.Search, "Buscar")
                            }
                        }
                    },
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = {
                        val match = com.shopeelister.util.CategoryData.findCategory(catSearch)
                        if (match != null) {
                            viewModel.updateCategory(match.first, match.second)
                            catSearch = ""
                        }
                    }),
                    supportingText = {
                        if (product.categoryName.isNotBlank()) {
                            Text("Selecionado: ${product.categoryName} (${product.categoryId})")
                        }
                    }
                )

                // Weight + Stock
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    val hasVars = product.variations.isNotEmpty()
                    OutlinedTextField(
                        value = product.weightGrams.toString(),
                        onValueChange = { viewModel.updateWeight(it) },
                        label = { Text("Peso (g)") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                    OutlinedTextField(
                        value = product.stock.toString(),
                        onValueChange = { viewModel.updateStock(it) },
                        label = { Text(if (hasVars) "Estoque (Ignorado)" else "Estoque") },
                        modifier = Modifier.weight(1f),
                        enabled = !hasVars,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                }

                // Dimensions
                Text(
                    "Dimensões (cm)",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = product.widthCm.toString(),
                        onValueChange = { viewModel.updateWidth(it) },
                        label = { Text("Larg") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                    OutlinedTextField(
                        value = product.heightCm.toString(),
                        onValueChange = { viewModel.updateHeight(it) },
                        label = { Text("Alt") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                    OutlinedTextField(
                        value = product.lengthCm.toString(),
                        onValueChange = { viewModel.updateLength(it) },
                        label = { Text("Comp") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                }

                // Variations Section
                HorizontalDivider(Modifier.padding(vertical = 8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Variações (${product.variations.size})",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    TextButton(onClick = { viewModel.addVariation() }) {
                        Icon(Icons.Default.Add, null)
                        Text("Adicionar")
                    }
                }

                if (product.variations.isEmpty()) {
                    Text(
                        "Produto sem variações (Simples)",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    product.variations.forEachIndexed { index, variation ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                        ) {
                            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    OutlinedTextField(
                                        value = variation.name,
                                        onValueChange = { viewModel.updateVariation(index, variation.copy(name = it)) },
                                        label = { Text("Nome (ex: Azul, P)") },
                                        modifier = Modifier.weight(1f)
                                    )
                                    IconButton(onClick = { viewModel.removeVariation(index) }) {
                                        Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error)
                                    }
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    var localVarPrice by remember(variation.priceCents) {
                                        mutableStateOf(if (variation.priceCents > 0) "%.2f".format(variation.priceCents / 100.0).replace(".", ",") else "")
                                    }
                                    OutlinedTextField(
                                        value = localVarPrice,
                                        onValueChange = { priceStr ->
                                            localVarPrice = priceStr
                                            val clean = priceStr.replace(",", ".")
                                            val cents = kotlin.math.round((clean.toDoubleOrNull() ?: 0.0) * 100).toLong()
                                            viewModel.updateVariation(index, variation.copy(priceCents = cents))
                                        },
                                        label = { Text("Preço") },
                                        modifier = Modifier.weight(1f),
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                        prefix = { Text("R$ ") }
                                    )
                                    OutlinedTextField(
                                        value = variation.stock.toString(),
                                        onValueChange = { stockStr ->
                                            val stock = stockStr.toIntOrNull() ?: 0
                                            viewModel.updateVariation(index, variation.copy(stock = stock))
                                        },
                                        label = { Text("Estoque") },
                                        modifier = Modifier.weight(1f),
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                                    )
                                }
                            }
                        }
                    }
                }

                // Publish result error
                state.publishResult?.let { result ->
                    if (result != "success") {
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.errorContainer
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "Erro na Publicação",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    text = result,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                                if (result.contains("canal")) {
                                    Spacer(Modifier.height(8.dp))
                                    Text(
                                        text = "💡 Vá em Configurações > Métodos de Envio e marque pelo menos uma opção.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.8f)
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(Modifier.height(80.dp))
            }
        }

        LoadingOverlay(
            visible = state.isLoading,
            message = "Buscando dados do produto..."
        )

        if (state.isPublishing) {
            LoadingOverlay(visible = true, message = "Publicando na Shopee...")
        }
    }
}
