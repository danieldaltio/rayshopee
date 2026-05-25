package com.shopeelister.data.remote.shopee

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ShopeeResponse<T>(
    val error: String? = null,
    val message: String? = null,
    val response: T? = null
)

@JsonClass(generateAdapter = true)
data class TokenResponse(
    @Json(name = "access_token") val accessToken: String,
    @Json(name = "refresh_token") val refreshToken: String,
    @Json(name = "expire_in") val expireIn: Int,
    @Json(name = "shop_id") val shopId: Long
)

@JsonClass(generateAdapter = true)
data class SearchItemsResponse(
    @Json(name = "item_id_list") val itemIdList: List<Long> = emptyList(),
    @Json(name = "total_count") val totalCount: Int = 0
)

@JsonClass(generateAdapter = true)
data class ItemBase(
    @Json(name = "item_id") val itemId: Long = 0,
    @Json(name = "item_name") val itemName: String = "",
    @Json(name = "item_sku") val itemSku: String = "",
    val price: Double = 0.0,
    val weight: Double = 0.0,
    val brand: BrandInfo? = null,
    val images: List<String> = emptyList()
)

@JsonClass(generateAdapter = true)
data class BrandInfo(
    @Json(name = "brand_id") val brandId: Long = 0,
    @Json(name = "original_brand_name") val brandName: String = ""
)

@JsonClass(generateAdapter = true)
data class ItemDetailResponse(
    @Json(name = "item_list") val itemList: List<ItemBase> = emptyList()
)

@JsonClass(generateAdapter = true)
data class AddItemRequest(
    @Json(name = "category_id") val categoryId: Long,
    @Json(name = "item_name") val itemName: String,
    val description: String,
    @Json(name = "original_price") val originalPrice: Double? = null,
    @Json(name = "seller_stock") val sellerStock: List<SellerStock>? = null,
    @Json(name = "item_sku") val itemSku: String,
    val weight: Double,
    val dimension: Dimension,
    @Json(name = "condition") val condition: String = "NEW",
    @Json(name = "item_status") val itemStatus: String = "NORMAL",
    val image: ImageIdList,
    @Json(name = "logistic_info") val logisticInfo: List<LogisticInfo>,
    @Json(name = "brand") val brand: BrandInfo,
    @Json(name = "item_dangerous") val itemDangerous: Int = 0,
    @Json(name = "attribute_list") val attributeList: List<Attribute>? = null,
    @Json(name = "tax_info") val taxInfo: TaxInfo? = null,
    @Json(name = "compliances") val compliances: Compliances? = null,
    @Json(name = "tier_variation") val tierVariation: List<TierVariation>? = null,
    @Json(name = "model") val modelList: List<Model>? = null,
    val ean: String? = null
)

@JsonClass(generateAdapter = true)
data class AddItemRequestFixed(
    @Json(name = "category_id") val categoryId: Long,
    @Json(name = "item_name") val itemName: String,
    val description: String = "",
    @Json(name = "original_price") val originalPrice: Double? = null,
    @Json(name = "seller_stock") val sellerStock: List<SellerStock>? = null,
    @Json(name = "item_sku") val itemSku: String,
    val weight: Double,
    val dimension: Dimension,
    val condition: String = "NEW",
    val itemStatus: String = "NORMAL",
    val image: ImageIdList,
    @Json(name = "logistic_info") val logisticInfo: List<LogisticInfo>,
    @Json(name = "brand") val brand: BrandInfo,
    @Json(name = "item_dangerous") val itemDangerous: Int = 0,
    @Json(name = "attribute_list") val attributeList: List<Attribute>? = null,
    @Json(name = "tax_info") val taxInfo: TaxInfo? = null,
    @Json(name = "compliances") val compliances: Compliances? = null,
    @Json(name = "tier_variation") val tierVariation: List<TierVariation>? = null,
    @Json(name = "model") val modelList: List<Model>? = null,
    val ean: String? = null
)

@JsonClass(generateAdapter = true)
data class TaxInfo(
    @Json(name = "ncm") val ncm: String? = null,
    @Json(name = "same_state_cfop") val sameStateCfop: String? = null,
    @Json(name = "diff_state_cfop") val diffStateCfop: String? = null,
    @Json(name = "csosn") val csosn: String? = null
)

@JsonClass(generateAdapter = true)
data class Compliances(
    @Json(name = "manufacturer") val manufacturer: String? = null,
    @Json(name = "importer") val importer: String? = null
)

@JsonClass(generateAdapter = true)
data class DescriptionInfo(
    @Json(name = "extended_description") val extendedDescription: ExtendedDescription? = null
)

@JsonClass(generateAdapter = true)
data class ExtendedDescription(
    @Json(name = "field_list") val fieldList: List<DescriptionField> = emptyList()
)

@JsonClass(generateAdapter = true)
data class DescriptionField(
    @Json(name = "field_type") val fieldType: String = "text",
    val text: String? = null,
    @Json(name = "image_info") val imageInfo: ImageIdList? = null
)

@JsonClass(generateAdapter = true)
data class PriceInfo(
    @Json(name = "original_price") val originalPrice: Double
)

@JsonClass(generateAdapter = true)
data class SellerStock(
    val stock: Int,
    @Json(name = "location_id") val locationId: String? = null
)

@JsonClass(generateAdapter = true)
data class Attribute(
    @Json(name = "attribute_id") val attributeId: Long,
    @Json(name = "attribute_value_list") val attributeValueList: List<AttributeValue>
)

@JsonClass(generateAdapter = true)
data class AttributeValue(
    @Json(name = "value_id") val valueId: Long = 0,
    @Json(name = "original_value_name") val originalValueName: String = ""
)

@JsonClass(generateAdapter = true)
data class ImageIdList(
    @Json(name = "image_id_list") val imageIdList: List<String>
)

@JsonClass(generateAdapter = true)
data class TierVariation(
    val name: String,
    @Json(name = "option_list") val optionList: List<VariationOption>
)

@JsonClass(generateAdapter = true)
data class VariationOption(
    val option: String,
    val image: VariationImage? = null
)

@JsonClass(generateAdapter = true)
data class VariationImage(
    @Json(name = "image_id") val imageId: String
)

@JsonClass(generateAdapter = true)
data class Model(
    @Json(name = "tier_index") val tierIndex: List<Int>,
    val price: Double,
    val stock: Int,
    @Json(name = "model_sku") val modelSku: String? = null
)

@JsonClass(generateAdapter = true)
data class Dimension(
    @Json(name = "package_height") val packageHeight: Int,
    @Json(name = "package_width") val packageWidth: Int,
    @Json(name = "package_length") val packageLength: Int
)

@JsonClass(generateAdapter = true)
data class AddItemResponse(
    @Json(name = "item_id") val itemId: Long = 0,
    @Json(name = "item_sku") val itemSku: String = ""
)

@JsonClass(generateAdapter = true)
data class UploadImageResponse(
    @Json(name = "image_info") val imageInfo: ImageInfo? = null
)

@JsonClass(generateAdapter = true)
data class ImageInfo(
    @Json(name = "image_id") val imageId: String = "",
    @Json(name = "image_url") val imageUrl: String = ""
)

@JsonClass(generateAdapter = true)
data class LogisticInfo(
    @Json(name = "logistic_id") val logisticId: Long,
    val enabled: Boolean = true,
    @Json(name = "logistic_name") val logisticName: String? = null,
    @Json(name = "delivery_type") val deliveryType: Int? = null
)

@JsonClass(generateAdapter = true)
data class LogisticsChannelListResponse(
    @Json(name = "logistics_channel_list") val channelList: List<LogisticsChannelItem> = emptyList()
)

@JsonClass(generateAdapter = true)
data class LogisticsChannelItem(
    @Json(name = "logistics_channel_id") val id: Long,
    @Json(name = "logistics_channel_name") val name: String,
    val enabled: Boolean = false,
    @Json(name = "logistics_channel_type") val type: Int? = null,
    val mask: Long? = null,
    val enabledByBuyer: Boolean? = null
)

@JsonClass(generateAdapter = true)
data class AttributeResponse(
    @Json(name = "attribute_list") val attributeList: List<AttributeDefinition> = emptyList()
)

@JsonClass(generateAdapter = true)
data class AttributeDefinition(
    @Json(name = "attribute_id") val attributeId: Long,
    @Json(name = "display_attribute_name") val attributeName: String,
    @Json(name = "is_mandatory") val isMandatory: Boolean,
    @Json(name = "attribute_value_list") val attributeValueList: List<AttributeValueDefinition>? = null
)

@JsonClass(generateAdapter = true)
data class AttributeValueDefinition(
    @Json(name = "value_id") val valueId: Long,
    @Json(name = "original_value_name") val valueName: String
)

@JsonClass(generateAdapter = true)
data class LogisticChannelResponse(
    @Json(name = "logistics_channel_list") val channelList: List<LogisticsChannel> = emptyList()
)

@JsonClass(generateAdapter = true)
data class LogisticsChannel(
    @Json(name = "logistics_channel_id") val id: Long,
    @Json(name = "logistics_channel_name") val name: String,
    val enabled: Boolean = false
)

@JsonClass(generateAdapter = true)
data class BrandListResponse(
    @Json(name = "brand_list") val brandList: List<BrandDefinition> = emptyList()
)

@JsonClass(generateAdapter = true)
data class BrandDefinition(
    @Json(name = "brand_id") val brandId: Long,
    @Json(name = "original_brand_name") val brandName: String
)

@JsonClass(generateAdapter = true)
data class CategoryListResponse(
    @Json(name = "category_list") val categoryList: List<CategoryInfo> = emptyList()
)

@JsonClass(generateAdapter = true)
data class CategoryInfo(
    @Json(name = "category_id") val categoryId: Long,
    @Json(name = "category_name") val categoryName: String,
    @Json(name = "has_children") val hasChildren: Boolean = false
)

data class LogisticsOption(
    val channelId: Long,
    val name: String,
    val enabled: Boolean = false,
    val type: Int = 0
) {
    companion object {
        const val TYPE_STANDARD = 0
        const val TYPE_CROSS_BORDER = 2
        const val TYPE_DELIVERY = 5
        const val TYPE_PICKUP = 6
        
        fun getTypeName(type: Int): String = when (type) {
            TYPE_STANDARD -> "Entrega Padrão"
            TYPE_CROSS_BORDER -> "Entrega Internacional"
            TYPE_DELIVERY -> "Entrega Direta"
            TYPE_PICKUP -> "Retirada pelo Comprador"
            else -> "Outro"
        }
    }
}

@JsonClass(generateAdapter = true)
data class SetChannelRequest(
    @Json(name = "logistic_channel_list") val channelList: List<ChannelConfig>
)

@JsonClass(generateAdapter = true)
data class ChannelConfig(
    @Json(name = "logistics_channel_id") val channelId: Long,
    val enabled: Boolean
)

@JsonClass(generateAdapter = true)
data class SetChannelResponse(
    val response: SetChannelResult?
)

@JsonClass(generateAdapter = true)
data class SetChannelResult(
    val success: Boolean = true
)
