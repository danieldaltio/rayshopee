package com.shopeelister.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shopeelister.domain.model.Product
import com.shopeelister.domain.repository.ProductRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    productRepository: ProductRepository
) : ViewModel() {

    val history = productRepository.getHistory()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())
}
