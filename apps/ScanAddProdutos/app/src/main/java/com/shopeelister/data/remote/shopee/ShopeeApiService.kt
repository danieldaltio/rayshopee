package com.shopeelister.data.remote.shopee

import okhttp3.MultipartBody
import retrofit2.http.*

interface ShopeeApiService {

    @POST("/api/v2/auth/token/get")
    suspend fun getAccessToken(
        @Body body: Map<String, @JvmSuppressWildcards Any>
    ): ShopeeResponse<TokenResponse>

    @POST("/api/v2/auth/access_token/get")
    suspend fun refreshAccessToken(
        @Body body: Map<String, @JvmSuppressWildcards Any>
    ): ShopeeResponse<TokenResponse>

    @GET("/api/v2/product/search_items")
    suspend fun searchItems(
        @Query("keyword") keyword: String,
        @Query("page_size") pageSize: Int = 10
    ): ShopeeResponse<SearchItemsResponse>

    @GET("/api/v2/product/get_item_base_info")
    suspend fun getItemDetail(
        @Query("item_id_list") itemIds: String
    ): ShopeeResponse<ItemDetailResponse>

    @POST("/api/v2/product/add_item")
    suspend fun addItem(
        @Body body: AddItemRequest
    ): ShopeeResponse<AddItemResponse>

    @POST("/api/v2/product/add_item")
    suspend fun addItemFixed(
        @Body body: AddItemRequestFixed
    ): ShopeeResponse<AddItemResponse>

    @Multipart
    @POST("/api/v2/media_space/upload_image")
    suspend fun uploadImage(
        @Part image: MultipartBody.Part
    ): ShopeeResponse<UploadImageResponse>

    @GET("/api/v2/logistics/get_channel_list")
    suspend fun getChannelList(): ShopeeResponse<LogisticsChannelListResponse>

    @POST("/api/v2/logistics/set_channel")
    suspend fun setChannel(
        @Body body: SetChannelRequest
    ): ShopeeResponse<SetChannelResponse>

    @GET("/api/v2/product/get_category")
    suspend fun getCategories(
        @Query("language") language: String = "pt_BR"
    ): ShopeeResponse<CategoryListResponse>

    @GET("/api/v2/product/get_attributes")
    suspend fun getAttributes(
        @Query("category_id") categoryId: Long,
        @Query("language") language: String = "pt_BR"
    ): ShopeeResponse<AttributeResponse>

    @GET("/api/v2/product/get_brand_list")
    suspend fun getBrandList(
        @Query("category_id") categoryId: Long,
        @Query("status") status: Int = 1,
        @Query("page_size") pageSize: Int = 100
    ): ShopeeResponse<BrandListResponse>
}
