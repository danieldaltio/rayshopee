package com.shopeelister.data.repository

import android.graphics.Bitmap
import com.shopeelister.data.local.ConfigStore
import com.shopeelister.data.remote.shopee.*
import com.shopeelister.domain.model.CategorySuggestion
import com.shopeelister.domain.model.Product
import com.shopeelister.domain.model.Variation
import com.shopeelister.domain.repository.ShopeeRepository
import com.shopeelister.util.ImageUtils
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ShopeeRepositoryImpl @Inject constructor(
    private val api: ShopeeApiService,
    private val configStore: ConfigStore
) : ShopeeRepository {

    override suspend fun searchByKeyword(keyword: String): List<Product> {
        return try {
            val searchResp = api.searchItems(keyword)
            val ids = searchResp.response?.itemIdList ?: return emptyList()
            if (ids.isEmpty()) return emptyList()

            val detailResp = api.getItemDetail(ids.joinToString(","))
            detailResp.response?.itemList?.map { item ->
                Product(
                    title = item.itemName,
                    ean = keyword,
                    brand = item.brand?.brandName ?: "Sem Marca",
                    priceCents = (item.price * 100).toLong(),
                    weightGrams = (item.weight * 1000).toInt(),
                    sku = item.itemSku
                )
            } ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }
    }

    override suspend fun getCategories(): List<CategorySuggestion> {
        return try {
            val resp = api.getCategories()
            resp.response?.categoryList?.map {
                CategorySuggestion(it.categoryId, it.categoryName)
            } ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }
    }

    override suspend fun uploadImage(bitmap: Bitmap): String {
        val stream = java.io.ByteArrayOutputStream()
        
        // Android's JPEG compression turns transparent pixels black.
        // We draw the image onto a white background first to ensure compliance with Shopee.
        val whiteBitmap = Bitmap.createBitmap(bitmap.width, bitmap.height, bitmap.config ?: Bitmap.Config.ARGB_8888)
        val canvas = android.graphics.Canvas(whiteBitmap)
        canvas.drawColor(android.graphics.Color.WHITE)
        canvas.drawBitmap(bitmap, 0f, 0f, null)
        
        whiteBitmap.compress(Bitmap.CompressFormat.JPEG, 85, stream)
        val body = stream.toByteArray().toRequestBody("image/jpeg".toMediaType())
        val part = MultipartBody.Part.createFormData("image", "product.jpg", body)

        val resp = api.uploadImage(part)
        if (!resp.error.isNullOrBlank()) {
            throw Exception("Upload Image Error: ${resp.error} - ${resp.message}")
        }
        return resp.response?.imageInfo?.imageId ?: ""
    }

    override suspend fun addItem(product: Product, imageUrl: String): Boolean {
        val hasVariations = product.variations.isNotEmpty()
        val priceUnit = if (hasVariations) null else product.priceCents / 100.0
        
        val useDirect = configStore.logisticsDirect.first()
        val useExpress = configStore.logisticsShopeeExpress.first()
        val usePickup = configStore.logisticsPickup.first()
        
        android.util.Log.d("ShopeeRepo", "=== LOGISTICS CHECK ===")
        android.util.Log.d("ShopeeRepo", "User preferences: direct=$useDirect, express=$useExpress, pickup=$usePickup")
        
        if (!useDirect && !useExpress && !usePickup) {
            throw Exception("Nenhum método de envio selecionado!\n\nVá em ⚙️ Configurações > Métodos de Envio e marque pelo menos uma opção.")
        }
        
        val channelsResponse = try {
            api.getChannelList()
        } catch (e: Exception) {
            android.util.Log.e("ShopeeRepo", "API Exception fetching channels: ${e.message}")
            throw Exception("Erro de conexão com Shopee: ${e.message}\n\nVerifique sua internet e tente novamente.")
        }
        
        android.util.Log.d("ShopeeRepo", "Raw API response: $channelsResponse")
        
        val selectedChannels: MutableList<LogisticsChannelItem>
        
        // Check for API error or 403 (invalid token)
        val isAuthError = channelsResponse.error?.contains("invalid_access_token", ignoreCase = true) == true ||
                          channelsResponse.error?.contains("403", ignoreCase = true) == true
        
        val allChannels = channelsResponse.response?.channelList ?: emptyList()
        
        if (isAuthError || allChannels.isEmpty()) {
            android.util.Log.w("ShopeeRepo", "Using default fallback channels due to: ${if (isAuthError) "AUTH_ERROR" else "EMPTY_LIST"}")
            selectedChannels = mutableListOf(
                LogisticsChannelItem(id = 100006L, name = "Normal Delivery", enabled = true, type = 0),
                LogisticsChannelItem(id = 100005L, name = "Shopee Express Delivery", enabled = true, type = 5),
                LogisticsChannelItem(id = 100007L, name = "Pick-up at Store", enabled = true, type = 6)
            )
        } else {
            if (!channelsResponse.error.isNullOrBlank()) {
                android.util.Log.e("ShopeeRepo", "API Error response: ${channelsResponse.error} - ${channelsResponse.message}")
                throw Exception("Erro da API Shopee: ${channelsResponse.error}\n\nMensagem: ${channelsResponse.message}")
            }
            
            android.util.Log.d("ShopeeRepo", "Total channels from API: ${allChannels.size}")
            allChannels.forEach { ch ->
                android.util.Log.d("ShopeeRepo", "  - ${ch.name} (id=${ch.id}, enabled=${ch.enabled}, type=${ch.type})")
            }
            
            val enabledChannels = allChannels.filter { it.enabled }
            if (enabledChannels.isEmpty()) {
                android.util.Log.w("ShopeeRepo", "No enabled channels, using all available")
                selectedChannels = allChannels.toMutableList()
            } else {
                selectedChannels = enabledChannels.toMutableList()
            }
        }
        
        android.util.Log.d("ShopeeRepo", "Using channels: ${selectedChannels.map { it.name }}")
        
        val logisticInfo = selectedChannels.map { 
            LogisticInfo(it.id, true, it.name, it.type) 
        }

        val tierVariation = if (hasVariations) {
            listOf(
                TierVariation(
                    name = "Variação",
                    optionList = product.variations.map { VariationOption(it.name) }
                )
            )
        } else null

        val modelList = if (hasVariations) {
            product.variations.mapIndexed { index, variation ->
                Model(
                    tierIndex = listOf(index),
                    price = variation.priceCents / 100.0,
                    stock = variation.stock,
                    modelSku = variation.sku.ifBlank { "${product.sku}-$index" }
                )
            }
        } else null

        val finalCategoryId = product.categoryId.takeIf { it > 0 } ?: 101223
        
        val finalBrand = try {
            val brandResp = api.getBrandList(finalCategoryId)
            val brands = brandResp.response?.brandList ?: emptyList()
            val noBrand = brands.firstOrNull { 
                val n = it.brandName.lowercase()
                n.contains("no brand") || n.contains("sem marca") || n.contains("nenhum")
            } ?: brands.firstOrNull() 
            BrandInfo(brandId = noBrand?.brandId ?: 0L, brandName = noBrand?.brandName ?: "No Brand")
        } catch (e: Exception) {
            BrandInfo(0L, "No Brand")
        }

        val request = AddItemRequest(
            categoryId = finalCategoryId,
            itemName = product.title,
            description = product.description,
            originalPrice = priceUnit,
            sellerStock = if (priceUnit != null) listOf(SellerStock(stock = product.stock)) else null,
            itemSku = product.sku.ifBlank { "SKU-${System.currentTimeMillis()}" },
            weight = (product.weightGrams / 1000.0).takeIf { it > 0 } ?: 0.5,
            dimension = Dimension(
                packageHeight = product.packageHeightCm,
                packageLength = product.packageLengthCm,
                packageWidth = product.packageWidthCm
            ),
            condition = product.condition,
            itemStatus = "NORMAL",
            image = ImageIdList(listOf(imageUrl).filter { it.isNotBlank() }),
            logisticInfo = logisticInfo,
            brand = finalBrand,
            itemDangerous = 0,
            attributeList = try {
                val attrResp = api.getAttributes(finalCategoryId)
                val allAttrs = attrResp.response?.attributeList ?: emptyList()
                val attributes = mutableListOf<Attribute>()
                allAttrs.filter { it.isMandatory }.forEach { attr ->
                    val attrName = attr.attributeName.lowercase()
                    val isBrandAttr = attrName.contains("brand") || attrName.contains("marca")
                    val allowedValues = attr.attributeValueList ?: emptyList()
                    
                    if (isBrandAttr) {
                        val targetBrandValue = allowedValues.firstOrNull { 
                            val n = it.valueName.lowercase()
                            n.contains("no brand") || n.contains("sem marca") || n.contains("nenhum")
                        } ?: allowedValues.firstOrNull()
                        attributes.add(Attribute(attr.attributeId, listOf(AttributeValue(targetBrandValue?.valueId ?: finalBrand.brandId, targetBrandValue?.valueName ?: finalBrand.brandName))))
                    } else {
                        // Tenta encontrar um valor neutro como "N/A", "Não se aplica" ou apenas o primeiro
                        val fallbackVal = allowedValues.firstOrNull { 
                            val n = it.valueName.lowercase()
                            n.contains("n/a") || n.contains("não se aplica") || n.contains("outro")
                        } ?: allowedValues.firstOrNull()
                        
                        attributes.add(Attribute(attr.attributeId, listOf(AttributeValue(fallbackVal?.valueId ?: 0, fallbackVal?.valueName ?: "N/A"))))
                    }
                }
                attributes.takeIf { it.isNotEmpty() }
            } catch (e: Exception) { null },
            taxInfo = TaxInfo(ncm = "999999"), // NCM genérico para evitar erro de zeros
            compliances = Compliances(manufacturer = "Fabricante Nacional", importer = "Importador Nacional"),
            tierVariation = tierVariation,
            modelList = modelList,
            ean = product.ean.takeIf { it.isNotBlank() && it.length >= 8 }
        )

        return try {
            val resp = api.addItem(request)
            if (!resp.error.isNullOrBlank()) {
                throw Exception("${resp.error}: ${resp.message}")
            }
            val itemId = resp.response?.itemId
            if (itemId == null || itemId == 0L) {
                throw Exception("Resposta de sucesso da Shopee não contém ID do item (Response: $resp)")
            }
            true
        } catch (e: Exception) {
            if (e is retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                throw Exception("HTTP ${e.code()}: $errorBody")
            }
            throw e
        }
    }

    override suspend fun getAuthUrl(callbackUrl: String): String {
        val partnerId = configStore.partnerId.first()
        val partnerKey = configStore.partnerKey.first()
        val timestamp = (System.currentTimeMillis() / 1000).toString()
        val path = "/api/v2/shop/auth_partner"
        val sign = hmacSha256(partnerKey, partnerId + path + timestamp)
        
        return "https://partner.shopeemobile.com$path" +
                "?partner_id=$partnerId" +
                "&timestamp=$timestamp" +
                "&sign=$sign" +
                "&redirect=$callbackUrl"
    }

    private fun hmacSha256(key: String, data: String): String {
        val mac = javax.crypto.Mac.getInstance("HmacSHA256")
        mac.init(javax.crypto.spec.SecretKeySpec(key.toByteArray(), "HmacSHA256"))
        val hash = mac.doFinal(data.toByteArray())
        return hash.joinToString("") { "%02x".format(it) }
    }

    override suspend fun getAccessToken(code: String, shopId: Long): Boolean {
        val partnerId = configStore.partnerId.first()
        val partnerKey = configStore.partnerKey.first()

        val body = mapOf(
            "partner_id" to partnerId.toLong(),
            "code" to code,
            "shop_id" to shopId
        )

        val resp = api.getAccessToken(body)
        val token = resp.response ?: return false

        configStore.saveTokens(token.accessToken, token.refreshToken, token.shopId)
        return true
    }

    override suspend fun getLogisticsChannels(): List<LogisticsOption> {
        return try {
            val resp = api.getChannelList()
            resp.response?.channelList?.map { channel ->
                LogisticsOption(
                    channelId = channel.id,
                    name = channel.name,
                    enabled = channel.enabled,
                    type = channel.type ?: 0
                )
            } ?: emptyList()
        } catch (e: Exception) {
            android.util.Log.e("ShopeeRepo", "Error fetching logistics channels: ${e.message}")
            emptyList()
        }
    }

    override suspend fun refreshLogisticsChannel(channelId: Long, enabled: Boolean): Boolean {
        return try {
            val request = SetChannelRequest(
                channelList = listOf(ChannelConfig(channelId, enabled))
            )
            val resp = api.setChannel(request)
            resp.error.isNullOrBlank()
        } catch (e: Exception) {
            android.util.Log.e("ShopeeRepo", "Error setting channel ${channelId}: ${e.message}")
            false
        }
    }
}
