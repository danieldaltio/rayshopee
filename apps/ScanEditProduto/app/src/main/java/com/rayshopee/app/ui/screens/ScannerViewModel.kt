package com.rayshopee.app.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rayshopee.app.data.model.Product
import com.rayshopee.app.data.repository.ProductRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface ScannerIntent {
    data class BarcodeScanned(val barcode: String) : ScannerIntent
    data class ItemIdSearch(val itemId: String) : ScannerIntent
    data class UpdatePrice(val variationId: String, val price: Double) : ScannerIntent
    data class UpdateStock(val variationId: String, val stock: Int) : ScannerIntent
    data class UpdateCost(val variationId: String, val cost: Double) : ScannerIntent
    data object ClearError : ScannerIntent
    data object ClearProduct : ScannerIntent
}

data class ScannerUiState(
    val isLoading: Boolean = false,
    val product: Product? = null,
    val error: String? = null,
    val lastScannedBarcode: String? = null,
    val isUpdating: Boolean = false
)

@HiltViewModel
class ScannerViewModel @Inject constructor(
    private val productRepository: ProductRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ScannerUiState())
    val uiState: StateFlow<ScannerUiState> = _uiState.asStateFlow()

    private var lastScannedTime = 0L
    private val scanCooldown = 2000L

    fun processIntent(intent: ScannerIntent) {
        when (intent) {
            is ScannerIntent.BarcodeScanned -> handleBarcodeScanned(intent.barcode)
            is ScannerIntent.ItemIdSearch -> handleItemIdSearch(intent.itemId)
            is ScannerIntent.UpdatePrice -> handleUpdatePrice(intent.variationId, intent.price)
            is ScannerIntent.UpdateStock -> handleUpdateStock(intent.variationId, intent.stock)
            is ScannerIntent.UpdateCost -> handleUpdateCost(intent.variationId, intent.cost)
            is ScannerIntent.ClearError -> clearError()
            is ScannerIntent.ClearProduct -> clearProduct()
        }
    }

    private fun handleBarcodeScanned(barcode: String) {
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastScannedTime < scanCooldown) return
        if (barcode == _uiState.value.lastScannedBarcode) return

        lastScannedTime = currentTime
        _uiState.value = _uiState.value.copy(isLoading = true, error = null, lastScannedBarcode = barcode, product = null)

        viewModelScope.launch {
            try {
                val result = productRepository.searchByBarcode(barcode)
                result.fold(
                    onSuccess = { p -> _uiState.value = _uiState.value.copy(isLoading = false, product = p, error = null) },
                    onFailure = { e -> _uiState.value = _uiState.value.copy(isLoading = false, error = "Erro: ${e.message}", product = null) }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Erro de conexão", product = null)
            }
        }
    }

    private fun handleItemIdSearch(itemId: String) {
        lastScannedTime = System.currentTimeMillis()
        _uiState.value = _uiState.value.copy(isLoading = true, error = null, lastScannedBarcode = "item:$itemId")

        viewModelScope.launch {
            try {
                val result = productRepository.searchByItemId(itemId)
                result.fold(
                    onSuccess = { p -> _uiState.value = _uiState.value.copy(isLoading = false, product = p, error = null) },
                    onFailure = { e -> _uiState.value = _uiState.value.copy(isLoading = false, error = "Erro: ${e.message}", product = null) }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = "Erro de conexão", product = null)
            }
        }
    }

    private fun handleUpdatePrice(variationId: String, price: Double) {
        val itemId = _uiState.value.product?.itemId ?: return
        _uiState.value = _uiState.value.copy(isUpdating = true)
        
        viewModelScope.launch {
            try {
                val result = productRepository.updatePrice(itemId, variationId, price)
                result.fold(
                    onSuccess = {
                        val current = _uiState.value.product
                        if (current != null) {
                            val updated = current.variations.map { v -> if (v.variationId == variationId) v.copy(price = price) else v }
                            _uiState.value = _uiState.value.copy(isUpdating = false, product = current.copy(variations = updated))
                        }
                    },
                    onFailure = { e -> _uiState.value = _uiState.value.copy(isUpdating = false, error = "Erro: ${e.message}") }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isUpdating = false, error = "Erro de conexão")
            }
        }
    }

    private fun handleUpdateStock(variationId: String, stock: Int) {
        val itemId = _uiState.value.product?.itemId ?: return
        _uiState.value = _uiState.value.copy(isUpdating = true)
        
        viewModelScope.launch {
            try {
                val result = productRepository.updateStock(itemId, variationId, stock)
                result.fold(
                    onSuccess = {
                        val current = _uiState.value.product
                        if (current != null) {
                            val updated = current.variations.map { v -> if (v.variationId == variationId) v.copy(stock = stock) else v }
                            _uiState.value = _uiState.value.copy(isUpdating = false, product = current.copy(variations = updated))
                        }
                    },
                    onFailure = { e -> _uiState.value = _uiState.value.copy(isUpdating = false, error = "Erro: ${e.message}") }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isUpdating = false, error = "Erro de conexão")
            }
        }
    }

    private fun handleUpdateCost(variationId: String, cost: Double) {
        val itemId = _uiState.value.product?.itemId ?: return
        _uiState.value = _uiState.value.copy(isUpdating = true)
        
        viewModelScope.launch {
            try {
                val result = productRepository.updateCost(itemId, variationId, cost)
                result.fold(
                    onSuccess = {
                        val current = _uiState.value.product
                        if (current != null) {
                            val updated = current.variations.map { v -> if (v.variationId == variationId) v.copy(cost = cost) else v }
                            _uiState.value = _uiState.value.copy(isUpdating = false, product = current.copy(variations = updated))
                        }
                    },
                    onFailure = { e -> _uiState.value = _uiState.value.copy(isUpdating = false, error = "Erro: ${e.message}") }
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isUpdating = false, error = "Erro de conexão")
            }
        }
    }

    private fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    private fun clearProduct() {
        _uiState.value = ScannerUiState()
    }
}