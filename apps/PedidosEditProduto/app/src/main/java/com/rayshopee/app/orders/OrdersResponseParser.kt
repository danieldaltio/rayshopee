package com.rayshopee.app.orders

import org.json.JSONArray
import org.json.JSONObject

/**
 * Parser de resposta JSON do endpoint `/api/orders/to-ship`.
 *
 * Extraída da antiga lógica de parsing inline que vivia em `OrdersScreen.kt`
 * (versão pré-refatoração, hoje removida). Aqui é a fonte canônica: tanto
 * [com.rayshopee.app.data.repository.OrdersRepositoryImpl] quanto a UI consomem
 * estes tipos e esta função.
 *
 * JVM-pura (usa apenas `org.json`), o que permite testá-la sem mock de HTTP nem
 * de Android — cobertura em `OrdersResponseParserTest`.
 */

/**
 * Item de um pedido conforme retornado pelo backend.
 */
data class OrdersResponseItem(
    val itemId: String,
    val modelId: String,
    val name: String,
    val variation: String,
    val price: Double,
    val cost: Double,
    val quantity: Int,
    val predictedProfit: Double,
    val stock: Int,
    val barcode: String
)

/**
 * Pedido retornado pelo endpoint `/api/orders/to-ship`.
 */
data class OrdersResponse(
    val orderSn: String,
    val status: String,
    val createTime: Long,
    val totalAmount: Double,
    val shippingCarrier: String,
    val items: List<OrdersResponseItem>,
    val orderCost: Double,
    val predictedProfit: Double
)

/**
 * Resultado da tentativa de parse. `errors` contém mensagens de erro
 * por linha caso o JSON esteja parcialmente malformado.
 */
sealed class ParseResult<out T> {
    data class Success<T>(val value: T) : ParseResult<T>()
    data class Failure(val error: String) : ParseResult<Nothing>()
}

/**
 * Faz o parse de um JSON no formato esperado pelo endpoint `/api/orders/to-ship`.
 *
 * Formato esperado:
 * ```json
 * {
 *   "orders": [
 *     {
 *       "orderSn": "...",
 *       "status": "READY_TO_SHIP",
 *       "createTime": 1234567890,
 *       "totalAmount": 100.0,
 *       "shippingCarrier": "Correios",
 *       "items": [...],
 *       "orderCost": 50.0,
 *       "predictedProfit": 30.0
 *     }
 *   ]
 * }
 * ```
 */
fun parseOrdersResponse(json: String): ParseResult<List<OrdersResponse>> {
    return try {
        val obj = JSONObject(json)
        val ordersArray = obj.getJSONArray("orders")
        val list = mutableListOf<OrdersResponse>()
        for (i in 0 until ordersArray.length()) {
            list.add(parseOrder(ordersArray.getJSONObject(i)))
        }
        ParseResult.Success(list)
    } catch (e: Exception) {
        ParseResult.Failure("JSON inválido: ${e.message}")
    }
}

private fun parseOrder(o: JSONObject): OrdersResponse {
    val itemsArray = o.optJSONArray("items") ?: JSONArray()
    val items = mutableListOf<OrdersResponseItem>()
    for (j in 0 until itemsArray.length()) {
        items.add(parseItem(itemsArray.getJSONObject(j)))
    }
    return OrdersResponse(
        orderSn = o.optString("orderSn", "N/A"),
        status = o.optString("status", "UNKNOWN"),
        createTime = o.optLong("createTime", 0L),
        totalAmount = o.optDouble("totalAmount", 0.0),
        shippingCarrier = o.optString("shippingCarrier", ""),
        items = items,
        orderCost = o.optDouble("orderCost", 0.0),
        predictedProfit = o.optDouble("predictedProfit", 0.0)
    )
}

private fun parseItem(it: JSONObject): OrdersResponseItem {
    return OrdersResponseItem(
        itemId = it.optString("itemId", ""),
        modelId = it.optString("modelId", ""),
        name = it.optString("name", "Produto"),
        variation = it.optString("variation", ""),
        price = it.optDouble("price", 0.0),
        cost = it.optDouble("cost", 0.0),
        quantity = it.optInt("quantity", 0),
        predictedProfit = it.optDouble("predictedProfit", 0.0),
        stock = it.optInt("stock", 0),
        barcode = it.optString("barcode", "")
    )
}