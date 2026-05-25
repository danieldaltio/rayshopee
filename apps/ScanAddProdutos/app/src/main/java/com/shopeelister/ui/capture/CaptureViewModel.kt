package com.shopeelister.ui.capture

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shopeelister.domain.model.Product
import com.shopeelister.domain.usecase.SearchProductUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

data class CaptureUiState(
    val isLoading: Boolean = false,
    val photoBitmap: Bitmap? = null,
    val photoPath: String = "",
    val error: String? = null
)

@HiltViewModel
class CaptureViewModel @Inject constructor(
    private val searchProductUseCase: SearchProductUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(CaptureUiState())
    val state = _state.asStateFlow()

    private val _product = MutableStateFlow<Product?>(null)
    val product = _product.asStateFlow()

    fun onPhotoTaken(bitmap: Bitmap, file: File) {
        _state.value = _state.value.copy(
            photoBitmap = bitmap,
            photoPath = file.absolutePath
        )
    }

    fun searchProduct(name: String, ean: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val result = searchProductUseCase(name = name, ean = ean, image = _state.value.photoBitmap)
                _product.value = result
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = e.message)
            } finally {
                _state.value = _state.value.copy(isLoading = false)
            }
        }
    }
}
