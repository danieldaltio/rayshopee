package com.rayshopee.app.data.repository

import com.rayshopee.app.data.model.Product
import com.rayshopee.app.data.model.ProductVariation
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.serialization.Serializable
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.serialization.json.Json

interface ShopeeApi {
    @GET("/api/products/barcode")
    suspend fun searchByBarcode(@Query("barcode") barcode: String): ProductResponse
    
    @GET("/api/products/item/{itemId}")
    suspend fun searchByItemId(@retrofit2.http.Path("itemId") itemId: String): ProductResponse
    
    @POST("/api/products/update-price")
    suspend fun updatePrice(@retrofit2.http.Body request: UpdatePriceRequest): UpdateResponse
    
    @POST("/api/products/update-stock")
    suspend fun updateStock(@retrofit2.http.Body request: UpdateStockRequest): UpdateResponse
}

@Serializable
data class ProductResponse(
    val itemId: String = "",
    val itemName: String = "",
    val variations: List<VariationResponse> = emptyList()
)

@Serializable
data class VariationResponse(
    val variationId: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val stock: Int = 0
)

@Serializable
data class UpdateResponse(val success: Boolean, val message: String = "")

@Serializable
data class UpdatePriceRequest(
    val itemId: String,
    val variationId: String,
    val price: Double
)

@Serializable
data class UpdateStockRequest(
    val itemId: String,
    val variationId: String,
    val stock: Int
)

@Singleton
class ProductRepositoryImpl @Inject constructor() : ProductRepository {
    
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }
    
    private val api: ShopeeApi = Retrofit.Builder()
        .baseUrl("http://192.168.15.7:3003")
        .client(OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .build())
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()
        .create(ShopeeApi::class.java)

    override suspend fun searchByBarcode(barcode: String): Result<Product> {
        return try {
            val response = api.searchByBarcode(barcode)
            val product = Product(
                itemId = response.itemId,
                itemName = response.itemName,
                variations = response.variations.map { v ->
                    ProductVariation(
                        variationId = v.variationId,
                        name = v.name,
                        price = v.price,
                        stock = v.stock
                    )
                }
            )
            Result.success(product)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun searchByItemId(itemId: String): Result<Product> {
        return try {
            val response = api.searchByItemId(itemId)
            val product = Product(
                itemId = response.itemId,
                itemName = response.itemName,
                variations = response.variations.map { v ->
                    ProductVariation(
                        variationId = v.variationId,
                        name = v.name,
                        price = v.price,
                        stock = v.stock
                    )
                }
            )
            Result.success(product)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updatePrice(itemId: String, variationId: String, price: Double): Result<Unit> {
        return try {
            val response = api.updatePrice(UpdatePriceRequest(itemId, variationId, price))
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateStock(itemId: String, variationId: String, stock: Int): Result<Unit> {
        return try {
            val response = api.updateStock(UpdateStockRequest(itemId, variationId, stock))
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}