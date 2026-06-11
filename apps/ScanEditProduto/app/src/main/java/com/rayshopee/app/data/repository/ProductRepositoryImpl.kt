package com.rayshopee.app.data.repository

import com.rayshopee.app.data.model.Product
import com.rayshopee.app.data.model.ProductVariation
import com.rayshopee.app.data.model.UpdateCostRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.serialization.Serializable
import okhttp3.Interceptor
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

import android.content.Context
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.rayshopee.app.data.local.AppDatabase
import com.rayshopee.app.data.local.PendingActionEntity
import com.rayshopee.app.data.local.ProductEntity
import com.rayshopee.app.data.worker.SyncWorker
import dagger.hilt.android.qualifiers.ApplicationContext

// Backup URLs para fallback
private val FALLBACK_URLS = listOf(
    "https://rayshopee.vercel.app",
    "https://rayshopee.loca.lt"
)

interface ShopeeApi {
    @GET("/api/wakeup")
    suspend fun wakeUp()
    
    @GET("/api/products/barcode")
    suspend fun searchByBarcode(@Query("barcode") barcode: String): ProductResponse
    
    @GET("/api/products/item/{itemId}")
    suspend fun searchByItemId(@retrofit2.http.Path("itemId") itemId: String): ProductResponse
    
    @POST("/api/products/update-price")
    suspend fun updatePrice(@retrofit2.http.Body request: UpdatePriceRequest): UpdateResponse
    
    @POST("/api/products/update-stock")
    suspend fun updateStock(@retrofit2.http.Body request: UpdateStockRequest): UpdateResponse

    @POST("/api/products/update-cost")
    suspend fun updateCost(@retrofit2.http.Body request: UpdateCostRequest): UpdateResponse
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
    val stock: Int = 0,
    val cost: Double = 0.0,
    val barcode: String = ""
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
class ProductRepositoryImpl @Inject constructor(
    private val db: AppDatabase,
    @ApplicationContext private val context: Context
) : ProductRepository {

    suspend fun syncPendingActions(): Boolean {
        // Feature disabled temporarily
        return true
    }
    
    companion object {
        // Vercel deployment URL
        private const val BASE_URL = "https://rayshopee.vercel.app"
    }
    
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }
    
    private val bypassHeaders = { chain: okhttp3.Interceptor.Chain ->
        val request = chain.request().newBuilder()
            .build()
        chain.proceed(request)
    }
    private val fallbackInterceptor = Interceptor { chain ->
        var request = chain.request()
        var response: okhttp3.Response? = null
        var lastException: Exception? = null

        for (url in FALLBACK_URLS) {
            try {
                val newUrl = request.url.newBuilder()
                    .scheme("https")
                    .host(url.replace("https://", "").replace("http://", ""))
                    .build()
                
                request = request.newBuilder().url(newUrl).build()
                response = chain.proceed(request)
                
                if (response.isSuccessful) {
                    return@Interceptor response
                } else {
                    response.close()
                }
            } catch (e: Exception) {
                lastException = e
            }
        }
        
        throw lastException ?: java.net.UnknownHostException("All fallback URLs failed")
    }
    
    private fun createClient(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(45, TimeUnit.SECONDS) // Increased for Render cold start
        .readTimeout(45, TimeUnit.SECONDS)
        .addInterceptor(bypassHeaders)
        .addInterceptor(fallbackInterceptor)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        })
        .retryOnConnectionFailure(true)
        .build()
    
    private fun createApi(baseUrl: String): ShopeeApi = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(createClient())
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()
        .create(ShopeeApi::class.java)
    
    private var api: ShopeeApi = createApi(BASE_URL)
    
    private suspend fun warmUp() {
        try {
            api.wakeUp()
        } catch (_: Exception) {}
    }
    
    override suspend fun searchByBarcode(barcode: String): Result<Product> {
        return try {
            warmUp()
            val response = api.searchByBarcode(barcode)
            val product = Product(
                itemId = response.itemId,
                itemName = response.itemName,
                variations = response.variations.map { v ->
                    ProductVariation(
                        variationId = v.variationId,
                        name = v.name,
                        price = v.price,
                        stock = v.stock,
                        cost = v.cost,
                        barcode = v.barcode
                    )
                }
            )
            // Cache localmente
            db.productDao().insertProduct(ProductEntity(
                itemId = product.itemId,
                itemName = product.itemName,
                barcode = barcode,
                variations = product.variations
            ))
            Result.success(product)
        } catch (e: Exception) {
            // Tenta pegar do cache
            val cached = db.productDao().getProductByBarcode(barcode)
            if (cached != null) {
                Result.success(Product(
                    itemId = cached.itemId,
                    itemName = cached.itemName,
                    variations = cached.variations
                ))
            } else {
                Result.failure(e)
            }
        }
    }

    override suspend fun searchByItemId(itemId: String): Result<Product> {
        return try {
            warmUp()
            val response = api.searchByItemId(itemId)
            val product = Product(
                itemId = response.itemId,
                itemName = response.itemName,
                variations = response.variations.map { v ->
                    ProductVariation(
                        variationId = v.variationId,
                        name = v.name,
                        price = v.price,
                        stock = v.stock,
                        cost = v.cost,
                        barcode = v.barcode
                    )
                }
            )
            // Cache localmente
            db.productDao().insertProduct(ProductEntity(
                itemId = product.itemId,
                itemName = product.itemName,
                barcode = null, // Não temos certeza do barcode principal aqui
                variations = product.variations
            ))
            Result.success(product)
        } catch (e: Exception) {
            val cached = db.productDao().getProductByItemId(itemId)
            if (cached != null) {
                Result.success(Product(
                    itemId = cached.itemId,
                    itemName = cached.itemName,
                    variations = cached.variations
                ))
            } else {
                Result.failure(e)
            }
        }
    }

    private fun enqueueSync() {
        val workRequest = OneTimeWorkRequestBuilder<SyncWorker>().build()
        WorkManager.getInstance(context).enqueue(workRequest)
    }

    override suspend fun updatePrice(itemId: String, variationId: String, price: Double): Result<Unit> {
        return try {
            val response = api.updatePrice(UpdatePriceRequest(itemId, variationId, price))
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            // Salva pendência
            db.productDao().insertPendingAction(
                PendingActionEntity(
                    itemId = itemId,
                    variationId = variationId,
                    actionType = "UPDATE_PRICE",
                    value = price
                )
            )
            enqueueSync()
            Result.success(Unit) // Retorna sucesso falso pro app continuar offline
        }
    }

    override suspend fun updateStock(itemId: String, variationId: String, stock: Int): Result<Unit> {
        return try {
            val response = api.updateStock(UpdateStockRequest(itemId, variationId, stock))
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            db.productDao().insertPendingAction(
                PendingActionEntity(
                    itemId = itemId,
                    variationId = variationId,
                    actionType = "UPDATE_STOCK",
                    value = stock.toDouble()
                )
            )
            enqueueSync()
            Result.success(Unit)
        }
    }

    override suspend fun updateCost(itemId: String, variationId: String, cost: Double): Result<Unit> {
        return try {
            val response = api.updateCost(UpdateCostRequest(itemId, variationId, cost))
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            db.productDao().insertPendingAction(
                PendingActionEntity(
                    itemId = itemId,
                    variationId = variationId,
                    actionType = "UPDATE_COST",
                    value = cost
                )
            )
            enqueueSync()
            Result.success(Unit)
        }
    }
}