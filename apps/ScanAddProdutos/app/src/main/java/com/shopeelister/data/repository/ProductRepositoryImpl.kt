package com.shopeelister.data.repository

import com.shopeelister.data.local.ProductDao
import com.shopeelister.data.local.toDomain
import com.shopeelister.data.local.toEntity
import com.shopeelister.domain.model.Product
import com.shopeelister.domain.repository.ProductRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProductRepositoryImpl @Inject constructor(
    private val dao: ProductDao
) : ProductRepository {

    override fun getHistory(): Flow<List<Product>> =
        dao.getAll().map { list -> list.map { it.toDomain() } }

    override suspend fun save(product: Product) {
        dao.insert(product.toEntity())
    }

    override suspend fun delete(product: Product) {
        dao.delete(product.toEntity())
    }
}
