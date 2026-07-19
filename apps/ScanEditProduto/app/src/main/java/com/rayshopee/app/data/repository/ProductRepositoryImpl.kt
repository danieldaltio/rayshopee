package com.rayshopee.app.data.repository

import com.rayshopee.app.data.model.Product
import com.rayshopee.app.data.model.ProductSearchResult
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
import com.rayshopee.core.network.FallbackUrlInterceptor
import com.rayshopee.core.network.NetworkConfig
import com.rayshopee.core.network.NetworkDiscovery
import com.rayshopee.app.data.worker.SyncWorker
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

// Lista de URLs candidatas agora vem do NetworkConfig (rayshopee-core).
// Ela é dinâmica: [userUrl (opcional), lanUrl (auto), cloudflareUrl (fallback final)].
// O NetworkConfig já faz o scan de LAN em background e prepende.

interface ShopeeApi {
    @GET("/api/wakeup")
    suspend fun wakeUp()
    
    @GET("/api/products/barcode")
    suspend fun searchByBarcode(@Query("barcode") barcode: String): ProductResponse
    
    @GET("/api/products/item/{itemId}")
    suspend fun searchByItemId(@retrofit2.http.Path("itemId") itemId: String): ProductResponse
    
    /**
     * Busca ampla por nome/SKU/EAN. Retorna lista de até 100 produtos
     * (backend usa ILIKE no Supabase, com fallback pra API da Shopee).
     */
    @GET("/api/products/search")
    suspend fun searchByName(@Query("q") query: String): ProductSearchListResponse
    
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

/**
 * Response de /api/products/search?q=...
 *
 * Backend retorna { products: [{ item_id, model_id, name, variation, sku, image, price, stock, cost }, ...] }.
 */
@Serializable
data class ProductSearchListResponse(
    val products: List<ProductSearchItemResponse> = emptyList()
)

@Serializable
data class ProductSearchItemResponse(
    val item_id: String = "",
    val model_id: Long = 0,
    val name: String = "",
    val variation: String = "",
    val sku: String = "",
    val image: String = "",
    val price: Double = 0.0,
    val stock: Int = 0,
    val cost: Double = 0.0
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
    @ApplicationContext private val context: Context,
    private val networkConfig: NetworkConfig,
    private val fallbackInterceptorFactory: FallbackUrlInterceptor.Factory
) : ProductRepository {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    init {
        // NetworkConfig já faz o scan de LAN em background no próprio init.
        // Só precisamos garantir que ele esteja ativo.
        scope.launch {
            networkConfig.refreshLan()
        }
    }

    suspend fun syncPendingActions(): Boolean {
        // Feature disabled temporarily
        return true
    }

    companion object {
        // URL base usada pelo Retrofit. O `baseUrl` é só um placeholder —
        // o FallbackUrlInterceptor reescreve pra cada candidato na hora da request.
        // Mantemos o Cloudflare aqui porque o Retrofit exige um URL bem-formado
        // (com scheme + host), e isso garante que mesmo se o Interceptor falhar,
        // o cliente saiba pra onde apontar.
        private const val BASE_URL = NetworkConfig.DEFAULT_CLOUDFLARE_URL
    }
    
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private val bypassHeaders = Interceptor { chain ->
        // LAN local — sem headers de bypass de túnel
        chain.proceed(chain.request())
    }

    private fun createClient(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(45, TimeUnit.SECONDS) // Increased for Render cold start
        .readTimeout(45, TimeUnit.SECONDS)
        .addInterceptor(bypassHeaders)
        // Fallback vem do rayshopee-core: usa a lista de candidatos do NetworkConfig,
        // que muda dinamicamente conforme LAN é descoberta ou user URL é alterada.
        .addInterceptor(fallbackInterceptorFactory.create())
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

    /**
     * Converte ProductResponse → Product e salva no cache local.
     */
    private suspend fun mapAndCache(response: ProductResponse, barcode: String? = null): Product {
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
        val cacheBarcode = barcode ?: product.variations.firstOrNull()?.barcode
        db.productDao().insertProduct(ProductEntity(
            itemId = product.itemId,
            itemName = product.itemName,
            barcode = cacheBarcode,
            variations = product.variations,
            lastSyncedAt = System.currentTimeMillis()
        ))
        return product
    }

    override suspend fun searchByBarcode(barcode: String): Result<Product> {
        // Cache-first: retorna do cache local se existir (instantâneo, funciona offline)
        val cached = db.productDao().getProductByBarcode(barcode)
        if (cached != null) {
            return Result.success(Product(
                itemId = cached.itemId,
                itemName = cached.itemName,
                variations = cached.variations,
                isFromCache = true,
                lastSyncedAt = cached.lastSyncedAt
            ))
        }
        // Sem cache → vai direto pra rede
        return try {
            val response = api.searchByBarcode(barcode)
            Result.success(mapAndCache(response, barcode))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Busca direto na rede (ignora cache). Usado pelo ViewModel pra
     * background refresh: mostra cache imediato, depois atualiza a UI com dados frescos.
     */
    override suspend fun fetchFreshByBarcode(barcode: String): Result<Product> {
        return try {
            val response = api.searchByBarcode(barcode)
            Result.success(mapAndCache(response, barcode))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun searchByItemId(itemId: String): Result<Product> {
        val cached = db.productDao().getProductByItemId(itemId)
        if (cached != null) {
            return Result.success(Product(
                itemId = cached.itemId,
                itemName = cached.itemName,
                variations = cached.variations,
                isFromCache = true,
                lastSyncedAt = cached.lastSyncedAt
            ))
        }
        return try {
            val response = api.searchByItemId(itemId)
            Result.success(mapAndCache(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun fetchFreshByItemId(itemId: String): Result<Product> {
        return try {
            val response = api.searchByItemId(itemId)
            Result.success(mapAndCache(response))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun searchByName(query: String): Result<List<ProductSearchResult>> {
        return try {
            val response = api.searchByName(query)
            val results = response.products.map { r ->
                ProductSearchResult(
                    itemId = r.item_id,
                    modelId = r.model_id,
                    name = r.name,
                    variation = r.variation,
                    sku = r.sku,
                    price = r.price,
                    stock = r.stock,
                    cost = r.cost,
                    image = r.image
                )
            }
            Result.success(results)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun enqueueSync() {
        val workRequest = OneTimeWorkRequestBuilder<SyncWorker>().build()
        WorkManager.getInstance(context).enqueue(workRequest)
    }

    override suspend fun updatePrice(
        itemId: String,
        variationId: String,
        price: Double,
        fromQueue: Boolean
    ): Result<Unit> {
        return try {
            val response = api.updatePrice(UpdatePriceRequest(itemId, variationId, price))
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            if (fromQueue) {
                // SyncWorker re-tentando — não duplica a pendência
                return Result.failure(e)
            }
            // Chamada do UI — enfileira localmente e sinaliza "salvo offline"
            try {
                db.productDao().insertPendingAction(
                    PendingActionEntity(
                        itemId = itemId,
                        variationId = variationId,
                        actionType = "UPDATE_PRICE",
                        value = price
                    )
                )
                enqueueSync()
                Result.failure(OfflineQueuedException(e))
            } catch (dbError: Exception) {
                // Não conseguiu nem enfileirar — falha real
                Result.failure(dbError)
            }
        }
    }

    override suspend fun updateStock(
        itemId: String,
        variationId: String,
        stock: Int,
        fromQueue: Boolean
    ): Result<Unit> {
        return try {
            val response = api.updateStock(UpdateStockRequest(itemId, variationId, stock))
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            if (fromQueue) {
                return Result.failure(e)
            }
            try {
                db.productDao().insertPendingAction(
                    PendingActionEntity(
                        itemId = itemId,
                        variationId = variationId,
                        actionType = "UPDATE_STOCK",
                        value = stock.toDouble()
                    )
                )
                enqueueSync()
                Result.failure(OfflineQueuedException(e))
            } catch (dbError: Exception) {
                Result.failure(dbError)
            }
        }
    }

    override suspend fun updateCost(
        itemId: String,
        variationId: String,
        cost: Double,
        fromQueue: Boolean
    ): Result<Unit> {
        return try {
            val response = api.updateCost(UpdateCostRequest(itemId, variationId, cost))
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.message))
        } catch (e: Exception) {
            if (fromQueue) {
                return Result.failure(e)
            }
            try {
                db.productDao().insertPendingAction(
                    PendingActionEntity(
                        itemId = itemId,
                        variationId = variationId,
                        actionType = "UPDATE_COST",
                        value = cost
                    )
                )
                enqueueSync()
                Result.failure(OfflineQueuedException(e))
            } catch (dbError: Exception) {
                Result.failure(dbError)
            }
        }
    }

    override suspend fun checkHealth(): Boolean {
        // Usa NetworkConfig.checkHealth — ele tenta cada candidato em paralelo
        // e retorna true se QUALQUER um responder 200 em /api/wakeup.
        // Isso é mais robusto que `api.wakeUp()` (que só testa o baseUrl do Retrofit,
        // não os fallbacks).
        return try {
            networkConfig.checkHealth()
        } catch (e: Exception) {
            false
        }
    }
}