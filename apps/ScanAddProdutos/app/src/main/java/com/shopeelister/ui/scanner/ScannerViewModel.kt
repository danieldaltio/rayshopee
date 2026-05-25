package com.shopeelister.ui.scanner

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

@HiltViewModel
class ScannerViewModel @Inject constructor() : ViewModel() {
    private val _scannedBarcode = MutableStateFlow<String?>(null)
    val scannedBarcode = _scannedBarcode.asStateFlow()

    fun onBarcodeDetected(barcode: String) {
        if (_scannedBarcode.value == null) {
            _scannedBarcode.value = barcode
        }
    }

    fun reset() {
        _scannedBarcode.value = null
    }
}
