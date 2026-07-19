package com.shopeelister.data.remote.shopee

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
@Serializable
data class ShopeeResponse<T>(
    val error: String? = null,
    val message: String? = null,
    val response: T? = null
)

@Serializable
data class TokenResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
    @SerialName("expire_in") val expireIn: Int,
    @SerialName("shop_id") val shopId: Long
)

@Serializable
data class SearchItemsResponse(
    @SerialName("item_id_list") val itemIdList: List<Long> = emptyList(),
    @SerialName("total_count") val totalCount: Int = 0
)

@Serializable
data class ItemBase(
    @SerialName("item_id") val itemId: Long = 0,
    @SerialName("item_name") val itemName: String = "",
    @SerialName("item_sku") val itemSku: String = "",
    val price: Double = 0.0,
    val weight: Double = 0.0,
    val brand: BrandInfo? = null,
    val images: List<String> = emptyList()
)

@Serializable
data class BrandInfo(
    @SerialName("brand_id") val brandId: Long = 0,
    @SerialName("original_brand_name") val brandName: String = ""
)

@Serializable
data class ItemDetailResponse(
    @SerialName("item_list") val itemList: List<ItemBase> = emptyList()
)

@Serializable
data class AddItemRequest(
    @SerialName("category_id") val categoryId: Long,
    @SerialName("item_name") val itemName: String,
    val description: String,
    @SerialName("original_price") val originalPrice: Double? = null,
    @SerialName("seller_stock") val sellerStock: List<SellerStock>? = null,
    @SerialName("item_sku") val itemSku: String,
    val weight: Double,
    val dimension: Dimension,
    @SerialName("condition") val condition: String = "NEW",
    @SerialName("item_status") val itemStatus: String = "NORMAL",
    val image: ImageIdList,
    @SerialName("logistic_info") val logisticInfo: List<LogisticInfo>,
    @SerialName("brand") val brand: BrandInfo,
    @SerialName("item_dangerous") val itemDangerous: Int = 0,
    @SerialName("attribute_list") val attributeList: List<Attribute>? = null,
    @SerialName("tax_info") val taxInfo: TaxInfo? = null,
    @SerialName("compliances") val compliances: Compliances? = null,
    @SerialName("tier_variation") val tierVariation: List<TierVariation>? = null,
    @SerialName("model") val modelList: List<Model>? = null,
    val ean: String? = null
)

@Serializable
data class AddItemRequestFixed(
    @SerialName("category_id") val categoryId: Long,
    @SerialName("item_name") val itemName: String,
    val description: String = "",
    @SerialName("original_price") val originalPrice: Double? = null,
    @SerialName("seller_stock") val sellerStock: List<SellerStock>? = null,
    @SerialName("item_sku") val itemSku: String,
    val weight: Double,
    val dimension: Dimension,
    val condition: String = "NEW",
    val itemStatus: String = "NORMAL",
    val image: ImageIdList,
    @SerialName("logistic_info") val logisticInfo: List<LogisticInfo>,
    @SerialName("brand") val brand: BrandInfo,
    @SerialName("item_dangerous") val itemDangerous: Int = 0,
    @SerialName("attribute_list") val attributeList: List<Attribute>? = null,
    @SerialName("tax_info") val taxInfo: TaxInfo? = null,
    @SerialName("compliances") val compliances: Compliances? = null,
    @SerialName("tier_variation") val tierVariation: List<TierVariation>? = null,
    @SerialName("model") val modelList: List<Model>? = null,
    val ean: String? = null
)

@Serializable
data class TaxInfo(
    @SerialName("ncm") val ncm: String? = null,
    @SerialName("same_state_cfop") val sameStateCfop: String? = null,
    @SerialName("diff_state_cfop") val diffStateCfop: String? = null,
    @SerialName("csosn") val csosn: String? = null
)

@Serializable
data class Compliances(
    @SerialName("manufacturer") val manufacturer: String? = null,
    @SerialName("importer") val importer: String? = null
)

@Serializable
data class DescriptionInfo(
    @SerialName("extended_description") val extendedDescription: ExtendedDescription? = null
)

@Serializable
data class ExtendedDescription(
    @SerialName("field_list") val fieldList: List<DescriptionField> = emptyList()
)

@Serializable
data class DescriptionField(
    @SerialName("field_type") val fieldType: String = "text",
    val text: String? = null,
    @SerialName("image_info") val imageInfo: ImageIdList? = null
)

@Serializable
data class PriceInfo(
    @SerialName("original_price") val originalPrice: Double
)

@Serializable
data class SellerStock(
    val stock: Int,
    @SerialName("location_id") val locationId: String? = null
)

@Serializable
data class Attribute(
    @SerialName("attribute_id") val attributeId: Long,
    @SerialName("attribute_value_list") val attributeValueList: List<AttributeValue>
)

@Serializable
data class AttributeValue(
    @SerialName("value_id") val valueId: Long = 0,
    @SerialName("original_value_name") val originalValueName: String = ""
)

@Serializable
data class ImageIdList(
    @SerialName("image_id_list") val imageIdList: List<String>
)

@Serializable
data class TierVariation(
    val name: String,
    @SerialName("option_list") val optionList: List<VariationOption>
)

@Serializable
data class VariationOption(
    val option: String,
    val image: VariationImage? = null
)

@Serializable
data class VariationImage(
    @SerialName("image_id") val imageId: String
)

@Serializable
data class Model(
    @SerialName("tier_index") val tierIndex: List<Int>,
    val price: Double,
    val stock: Int,
    @SerialName("model_sku") val modelSku: String? = null
)

@Serializable
data class Dimension(
    @SerialName("package_height") val packageHeight: Int,
    @SerialName("package_width") val packageWidth: Int,
    @SerialName("package_length") val packageLength: Int
)

@Serializable
data class AddItemResponse(
    @SerialName("item_id") val itemId: Long = 0,
    @SerialName("item_sku") val itemSku: String = ""
)

@Serializable
data class UploadImageResponse(
    @SerialName("image_info") val imageInfo: ImageInfo? = null
)

@Serializable
data class ImageInfo(
    @SerialName("image_id") val imageId: String = "",
    @SerialName("image_url") val imageUrl: String = ""
)

@Serializable
data class LogisticInfo(
    @SerialName("logistic_id") val logisticId: Long,
    val enabled: Boolean = true,
    @SerialName("logistic_name") val logisticName: String? = null,
    @SerialName("delivery_type") val deliveryType: Int? = null
)

@Serializable
data class LogisticsChannelListResponse(
    @SerialName("logistics_channel_list") val channelList: List<LogisticsChannelItem> = emptyList()
)

@Serializable
data class LogisticsChannelItem(
    @SerialName("logistics_channel_id") val id: Long,
    @SerialName("logistics_channel_name") val name: String,
    val enabled: Boolean = false,
    @SerialName("logistics_channel_type") val type: Int? = null,
    val mask: Long? = null,
    val enabledByBuyer: Boolean? = null
)

@Serializable
data class AttributeResponse(
    @SerialName("attribute_list") val attributeList: List<AttributeDefinition> = emptyList()
)

@Serializable
data class AttributeDefinition(
    @SerialName("attribute_id") val attributeId: Long,
    @SerialName("display_attribute_name") val attributeName: String,
    @SerialName("is_mandatory") val isMandatory: Boolean,
    @SerialName("attribute_value_list") val attributeValueList: List<AttributeValueDefinition>? = null
)

@Serializable
data class AttributeValueDefinition(
    @SerialName("value_id") val valueId: Long,
    @SerialName("original_value_name") val valueName: String
)

@Serializable
data class LogisticChannelResponse(
    @SerialName("logistics_channel_list") val channelList: List<LogisticsChannel> = emptyList()
)

@Serializable
data class LogisticsChannel(
    @SerialName("logistics_channel_id") val id: Long,
    @SerialName("logistics_channel_name") val name: String,
    val enabled: Boolean = false
)

@Serializable
data class BrandListResponse(
    @SerialName("brand_list") val brandList: List<BrandDefinition> = emptyList()
)

@Serializable
data class BrandDefinition(
    @SerialName("brand_id") val brandId: Long,
    @SerialName("original_brand_name") val brandName: String
)

@Serializable
data class CategoryListResponse(
    @SerialName("category_list") val categoryList: List<CategoryInfo> = emptyList()
)

@Serializable
data class CategoryInfo(
    @SerialName("category_id") val categoryId: Long,
    @SerialName("category_name") val categoryName: String,
    @SerialName("has_children") val hasChildren: Boolean = false
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

@Serializable
data class SetChannelRequest(
    @SerialName("logistic_channel_list") val channelList: List<ChannelConfig>
)

@Serializable
data class ChannelConfig(
    @SerialName("logistics_channel_id") val channelId: Long,
    val enabled: Boolean
)

@Serializable
data class SetChannelResponse(
    val response: SetChannelResult?
)

@Serializable
data class SetChannelResult(
    val success: Boolean = true
)
