package com.shopeelister.ui.editor

import android.content.Context
import android.graphics.BitmapFactory
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shopeelister.domain.model.Product
import com.shopeelister.domain.model.Variation
import com.shopeelister.domain.repository.AiRepository
import com.shopeelister.domain.repository.ProductRepository
import com.shopeelister.domain.repository.ShopeeRepository
import com.shopeelister.domain.usecase.SearchProductUseCase
import com.shopeelister.domain.usecase.RemoveBackgroundUseCase
import com.shopeelister.util.Constants
import com.shopeelister.util.SkuGenerator
import com.shopeelister.util.ImageUtils
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

data class EditorUiState(
    val product: Product = Product(),
    val imageBitmap: android.graphics.Bitmap? = null,
    val categories: List<Pair<Long, String>> = emptyList(),
    val isLoading: Boolean = false,
    val isPublishing: Boolean = false,
    val isGenerating: Boolean = false,
    val isRemovingBg: Boolean = false,
    val isImprovingTitle: Boolean = false,
    val publishResult: String? = null
)

@HiltViewModel
class EditorViewModel @Inject constructor(
    private val searchProductUseCase: SearchProductUseCase,
    private val shopeeRepository: ShopeeRepository,
    private val productRepository: ProductRepository,
    private val aiRepository: AiRepository,
    private val removeBackgroundUseCase: RemoveBackgroundUseCase,
    @ApplicationContext private val appContext: Context
) : ViewModel() {

    private val context: Context = appContext

    private val _state = MutableStateFlow(EditorUiState())
    val state = _state.asStateFlow()

    fun init(ean: String, imagePath: String, query: String = "") {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            val image = if (imagePath.isNotBlank()) {
                ImageUtils.loadScaledBitmap(imagePath)
            } else null

            _state.value = _state.value.copy(imageBitmap = image)

            try {
                val product = searchProductUseCase(name = query, ean = ean, image = image)
                android.util.Log.d("EditorViewModel", "Search finished. Title: ${product.title}, Desc: ${product.description.take(30)}...")
                _state.value = _state.value.copy(
                    product = product.copy(imageFile = if (imagePath.isNotBlank()) File(imagePath) else null)
                )
            } catch (_: Exception) {
                _state.value = _state.value.copy(
                    product = Product(ean = ean, sku = SkuGenerator.generate("Produto $ean"))
                )
            }

            // Check title for Churrasco/Grelha early
            val title = _state.value.product.title
            if (title.contains("churrasco", ignoreCase = true) || title.contains("grelha", ignoreCase = true)) {
                update { it.copy(categoryId = 101223L, categoryName = "Casa e Decoração/Artigos de Cozinha/Utensílios para Churrasco") }
            }

            // Load categories and attempt to match suggested category
            try {
                val cats = shopeeRepository.getCategories()
                val mappedCats = cats.map { it.categoryId to it.categoryName }
                _state.value = _state.value.copy(categories = mappedCats)
                
                val currentProduct = _state.value.product
                if (currentProduct.categoryId == 0L && currentProduct.categoryName.isNotBlank()) {
                    // Try exact match first
                    val exactMatch = mappedCats.firstOrNull { 
                        it.second.equals(currentProduct.categoryName, ignoreCase = true) 
                    }
                    if (exactMatch != null) {
                        update { it.copy(categoryId = exactMatch.first, categoryName = exactMatch.second) }
                    } else {
                        // Try partial match
                        val partialMatch = mappedCats.firstOrNull { 
                            it.second.contains(currentProduct.categoryName, ignoreCase = true) ||
                            currentProduct.categoryName.contains(it.second, ignoreCase = true)
                        }
                        if (partialMatch != null) {
                            update { it.copy(categoryId = partialMatch.first, categoryName = partialMatch.second) }
                        }
                    }
                }
            } catch (_: Exception) {}

            _state.value = _state.value.copy(isLoading = false)
        }
    }

    fun updateTitle(v: String) { 
        update { it.copy(title = v.take(Constants.MAX_TITLE_LENGTH)) }
        // Auto-categorize if title mentions churrasco/grelha
        if (v.contains("churrasco", ignoreCase = true) || v.contains("grelha", ignoreCase = true)) {
            update { it.copy(categoryId = 101223L, categoryName = "Casa e Decoração/Artigos de Cozinha/Utensílios para Churrasco") }
        }
    }
    fun updateEan(v: String) { update { it.copy(ean = v) } }
    fun updateDescription(v: String) { update { it.copy(description = v) } }
    fun updateBrand(v: String) { update { it.copy(brand = v) } }
    fun updatePrice(v: String) {
        // Remove currency symbols and non-numeric chars except comma/dot
        val clean = v.replace(Regex("[^0-9,.]"), "").replace(",", ".")
        val doubleValue = clean.toDoubleOrNull() ?: 0.0
        val cents = kotlin.math.round(doubleValue * 100).toLong()
        
        // Only update if cents actually changed to avoid cursor jumps
        if (cents != _state.value.product.priceCents) {
            update { it.copy(priceCents = cents) }
        }
    }
    fun updateCost(v: String) {
        if (v.isBlank()) {
            if (_state.value.product.costCents != null) {
                update { it.copy(costCents = null) }
            }
            return
        }
        val clean = v.replace(Regex("[^0-9,.]"), "").replace(",", ".")
        val doubleValue = clean.toDoubleOrNull()
        if (doubleValue == null) {
            if (_state.value.product.costCents != null) {
                update { it.copy(costCents = null) }
            }
        } else {
            val cents = kotlin.math.round(doubleValue * 100).toLong()
            if (cents != _state.value.product.costCents) {
                update { it.copy(costCents = cents) }
            }
        }
    }
    fun updateWeight(v: String) { update { it.copy(weightGrams = v.toIntOrNull() ?: Constants.DEFAULT_WEIGHT_GRAMS) } }
    fun updateWidth(v: String) { update { it.copy(widthCm = v.toIntOrNull() ?: Constants.DEFAULT_WIDTH_CM) } }
    fun updateHeight(v: String) { update { it.copy(heightCm = v.toIntOrNull() ?: Constants.DEFAULT_HEIGHT_CM) } }
    fun updateLength(v: String) { update { it.copy(lengthCm = v.toIntOrNull() ?: Constants.DEFAULT_LENGTH_CM) } }
    fun updateSku(v: String) { update { it.copy(sku = v.uppercase().take(Constants.MAX_SKU_LENGTH)) } }
    fun updateStock(v: String) { update { it.copy(stock = v.toIntOrNull() ?: Constants.DEFAULT_STOCK) } }
    fun updateCategory(id: Long, name: String) { update { it.copy(categoryId = id, categoryName = name) } }
    
    fun generateDescription() {
        viewModelScope.launch {
            val currentProduct = _state.value.product
            if (currentProduct.title.isBlank()) return@launch
            
            _state.value = _state.value.copy(isGenerating = true)
            try {
                val info = com.shopeelister.domain.model.SearchResult(
                    title = currentProduct.title,
                    brand = currentProduct.brand,
                    category = currentProduct.categoryName
                )
                val newDesc = aiRepository.generateDescription(info)
                if (newDesc.isNotBlank()) {
                    update { it.copy(description = newDesc) }
                }
            } catch (e: Exception) {
                android.util.Log.e("EditorViewModel", "Error generating description", e)
            } finally {
                _state.value = _state.value.copy(isGenerating = false)
            }
        }
    }

    fun improveTitle() {
        viewModelScope.launch {
            val currentProduct = _state.value.product
            if (currentProduct.title.isBlank()) return@launch
            
            _state.value = _state.value.copy(isImprovingTitle = true)
            try {
                val newTitle = aiRepository.improveTitle(currentProduct.title, currentProduct.categoryName)
                if (newTitle.isNotBlank()) {
                    update { it.copy(title = newTitle) }
                }
            } catch (e: Exception) {
                android.util.Log.e("EditorViewModel", "Error improving title", e)
            } finally {
                _state.value = _state.value.copy(isImprovingTitle = false)
            }
        }
    }

    fun suggestCategoryWithAi() {
        viewModelScope.launch {
            val currentProduct = _state.value.product
            if (currentProduct.title.isBlank()) return@launch
            
            _state.value = _state.value.copy(isGenerating = true)
            try {
                val info = com.shopeelister.domain.model.SearchResult(title = currentProduct.title)
                val aiSuggestedName = aiRepository.suggestCategory(info)
                
                // Try to find a match in our leaf category list
                val match = com.shopeelister.util.CategoryData.findCategory(aiSuggestedName)
                if (match != null) {
                    update { it.copy(categoryId = match.first, categoryName = match.second) }
                } else {
                    update { it.copy(categoryName = "Sugerido: $aiSuggestedName") }
                }
            } catch (e: Exception) {
                android.util.Log.e("EditorViewModel", "Error suggesting category", e)
            } finally {
                _state.value = _state.value.copy(isGenerating = false)
            }
        }
    }
    
    fun addVariation() {
        val newVar = Variation(
            name = "Nova Variação",
            priceCents = _state.value.product.priceCents,
            stock = _state.value.product.stock
        )
        update { it.copy(variations = it.variations + newVar) }
    }

    fun removeVariation(index: Int) {
        update { it.copy(variations = it.variations.filterIndexed { i, _ -> i != index }) }
    }

    fun updateVariation(index: Int, v: Variation) {
        update { it.copy(variations = it.variations.toMutableList().apply { set(index, v) }) }
    }

    fun removeBackground() {
        viewModelScope.launch {
            val bitmap = _state.value.imageBitmap ?: return@launch
            _state.value = _state.value.copy(isRemovingBg = true)
            try {
                val newBitmap = removeBackgroundUseCase(bitmap)
                if (newBitmap != null) {
                    _state.value = _state.value.copy(
                        imageBitmap = newBitmap
                    )
                    val path = _state.value.product.imageFile?.absolutePath
                    if (path != null) {
                        val out = java.io.FileOutputStream(path)
                        newBitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, out)
                        out.flush()
                        out.close()
                    }
                }
            } catch (_: Exception) {
            } finally {
                _state.value = _state.value.copy(isRemovingBg = false)
            }
        }
    }

    fun applyImageTransform(
        scale: Float,
        rotation: Float,
        offsetX: Float,
        offsetY: Float,
        brightness: Float,
        contrast: Float,
        saturation: Float
    ) {
        viewModelScope.launch {
            processImageTransform(scale, rotation, offsetX, offsetY, brightness, contrast, saturation)
        }
    }

    private suspend fun processImageTransform(
        scale: Float,
        rotation: Float,
        offsetX: Float,
        offsetY: Float,
        brightness: Float,
        contrast: Float,
        saturation: Float
    ) {
        val bitmap = _state.value.imageBitmap ?: return

        try {
            val originalWidth = bitmap.width
            val originalHeight = bitmap.height
            
            val squareSize = maxOf(originalWidth, originalHeight)
            
            val transformedBitmap = android.graphics.Bitmap.createBitmap(
                squareSize,
                squareSize,
                android.graphics.Bitmap.Config.ARGB_8888
            )
            
            val canvas = android.graphics.Canvas(transformedBitmap)
            canvas.drawColor(android.graphics.Color.WHITE)
            
            val paint = android.graphics.Paint().apply {
                isAntiAlias = true
                isFilterBitmap = true
            }

            if (brightness != 0f || contrast != 1f || saturation != 1f) {
                val colorMatrix = android.graphics.ColorMatrix()
                colorMatrix.setSaturation(saturation)
                
                val contrastMatrix = android.graphics.ColorMatrix(floatArrayOf(
                    contrast, 0f, 0f, 0f, brightness,
                    0f, contrast, 0f, 0f, brightness,
                    0f, 0f, contrast, 0f, brightness,
                    0f, 0f, 0f, 1f, 0f
                ))
                colorMatrix.postConcat(contrastMatrix)
                paint.colorFilter = android.graphics.ColorMatrixColorFilter(colorMatrix)
            }
            
            canvas.save()
            canvas.translate(squareSize / 2f, squareSize / 2f)
            
            val ratio = squareSize / 1000f
            canvas.translate(offsetX * ratio, offsetY * ratio)
            
            if (rotation != 0f) {
                canvas.rotate(rotation)
            }
            
            val fitScale = minOf(squareSize.toFloat() / originalWidth, squareSize.toFloat() / originalHeight)
            val finalScale = fitScale * scale
            canvas.scale(finalScale, finalScale)
            
            canvas.translate(-originalWidth / 2f, -originalHeight / 2f)
            canvas.drawBitmap(bitmap, 0f, 0f, paint)
            canvas.restore()
            
            _state.value = _state.value.copy(
                imageBitmap = transformedBitmap
            )
            
            val imageFile = _state.value.product.imageFile
            val path = imageFile?.absolutePath ?: run {
                val newFile = File(context.filesDir, "photo_${System.currentTimeMillis()}_edited.jpg")
                update { it.copy(imageFile = newFile) }
                newFile.absolutePath
            }
            
            val out = java.io.FileOutputStream(path)
            transformedBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 95, out)
            out.flush()
            out.close()
            android.util.Log.d("EditorVM", "Image saved successfully with tuning")
        } catch (e: Exception) {
            android.util.Log.e("EditorVM", "Transform error: ${e.message}")
            e.printStackTrace()
        }
    }

    fun publish(
        scale: Float = 1f,
        rotation: Float = 0f,
        offsetX: Float = 0f,
        offsetY: Float = 0f,
        brightness: Float = 0f,
        contrast: Float = 1f,
        saturation: Float = 1f
    ) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isPublishing = true, publishResult = null)
            try {
                if (scale != 1f || rotation != 0f || offsetX != 0f || offsetY != 0f ||
                    brightness != 0f || contrast != 1f || saturation != 1f) {
                    processImageTransform(scale, rotation, offsetX, offsetY, brightness, contrast, saturation)
                }

                val p = _state.value.product
                val bitmap = _state.value.imageBitmap

                // Upload image
                val imageUrl = if (bitmap != null) {
                    shopeeRepository.uploadImage(bitmap)
                } else ""

                // Add item
                val success = shopeeRepository.addItem(p, imageUrl)

                if (success) {
                    productRepository.save(p)
                    _state.value = _state.value.copy(publishResult = "success")
                } else {
                    _state.value = _state.value.copy(publishResult = "Erro Crítico V3: Falha silenciosa no Repository")
                }
            } catch (e: Exception) {
                _state.value = _state.value.copy(publishResult = "Erro: ${e.message}")
            } finally {
                _state.value = _state.value.copy(isPublishing = false)
            }
        }
    }

    private fun update(transform: (Product) -> Product) {
        _state.value = _state.value.copy(product = transform(_state.value.product))
    }
}
