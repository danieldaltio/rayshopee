package com.rayshopee.app.orders

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

/**
 * Testes do parser de resposta JSON do endpoint `/api/orders/to-ship`.
 *
 * Cobre:
 * - JSON bem formado com N pedidos e M itens
 * - JSON com lista vazia de pedidos
 * - JSON sem o campo "orders"
 * - JSON completamente inválido
 * - Campos faltantes (defaults aplicados)
 */
class OrdersResponseParserTest {

    @Test
    fun `parse JSON bem formado com 1 pedido e 2 itens retorna estrutura completa`() {
        val json = """
        {
          "orders": [
            {
              "orderSn": "ORD-001",
              "status": "READY_TO_SHIP",
              "createTime": 1700000000,
              "totalAmount": 150.50,
              "shippingCarrier": "Correios",
              "items": [
                {
                  "itemId": "ITEM-1",
                  "modelId": "MODEL-1",
                  "name": "Camiseta Azul P",
                  "variation": "Azul P",
                  "price": 50.00,
                  "cost": 25.00,
                  "quantity": 1,
                  "predictedProfit": 15.00,
                  "stock": 10,
                  "barcode": "7891234567890"
                },
                {
                  "itemId": "ITEM-2",
                  "modelId": "MODEL-2",
                  "name": "Camiseta Azul M",
                  "variation": "Azul M",
                  "price": 100.50,
                  "cost": 50.00,
                  "quantity": 1,
                  "predictedProfit": 30.00,
                  "stock": 5,
                  "barcode": "7891234567891"
                }
              ],
              "orderCost": 75.00,
              "predictedProfit": 45.00
            }
          ]
        }
        """.trimIndent()

        val result = parseOrdersResponse(json)
        when (result) {
            is ParseResult.Success -> {
                val orders = result.value
                assertEquals(1, orders.size)
                val order = orders[0]
                assertEquals("ORD-001", order.orderSn)
                assertEquals("READY_TO_SHIP", order.status)
                assertEquals(1700000000L, order.createTime)
                assertEquals(150.50, order.totalAmount, 0.001)
                assertEquals("Correios", order.shippingCarrier)
                assertEquals(75.00, order.orderCost, 0.001)
                assertEquals(45.00, order.predictedProfit, 0.001)

                assertEquals(2, order.items.size)
                val item1 = order.items[0]
                assertEquals("ITEM-1", item1.itemId)
                assertEquals("Camiseta Azul P", item1.name)
                assertEquals(50.00, item1.price, 0.001)
                assertEquals(10, item1.stock)
                assertEquals("7891234567890", item1.barcode)
            }
            is ParseResult.Failure -> fail("Esperava Success, recebi Failure: ${result.error}")
        }
    }

    @Test
    fun `parse JSON com lista vazia de pedidos retorna lista vazia`() {
        val json = """{"orders": []}"""
        val result = parseOrdersResponse(json)
        when (result) {
            is ParseResult.Success -> assertEquals(0, result.value.size)
            is ParseResult.Failure -> fail("Esperava Success, recebi Failure: ${result.error}")
        }
    }

    @Test
    fun `parse JSON sem campo orders retorna Failure`() {
        val json = """{"someOtherField": []}"""
        val result = parseOrdersResponse(json)
        assertTrue("Esperava Failure", result is ParseResult.Failure)
    }

    @Test
    fun `parse JSON completamente inválido retorna Failure`() {
        val result = parseOrdersResponse("isso nao é json")
        assertTrue("Esperava Failure", result is ParseResult.Failure)
    }

    @Test
    fun `parse JSON vazio retorna Failure`() {
        val result = parseOrdersResponse("")
        assertTrue("Esperava Failure", result is ParseResult.Failure)
    }

    @Test
    fun `parse aplica defaults quando campos do item estao faltando`() {
        val json = """
        {
          "orders": [
            {
              "orderSn": "ORD-002",
              "status": "SHIPPED",
              "items": [
                { "itemId": "X", "name": "Item Vazio" }
              ]
            }
          ]
        }
        """.trimIndent()

        val result = parseOrdersResponse(json)
        when (result) {
            is ParseResult.Success -> {
                val item = result.value[0].items[0]
                assertEquals("X", item.itemId)
                assertEquals("Item Vazio", item.name)
                assertEquals("", item.modelId)
                assertEquals("", item.variation)
                assertEquals(0.0, item.price, 0.001)
                assertEquals(0.0, item.cost, 0.001)
                assertEquals(0, item.quantity)
                assertEquals(0, item.stock)
                assertEquals("", item.barcode)
            }
            is ParseResult.Failure -> fail("Esperava Success com defaults: ${result.error}")
        }
    }

    @Test
    fun `parse aplica defaults quando campos do pedido estao faltando`() {
        val json = """{"orders": [{}]}"""
        val result = parseOrdersResponse(json)
        when (result) {
            is ParseResult.Success -> {
                val order = result.value[0]
                assertEquals("N/A", order.orderSn)
                assertEquals("UNKNOWN", order.status)
                assertEquals(0L, order.createTime)
                assertEquals(0.0, order.totalAmount, 0.001)
                assertEquals("", order.shippingCarrier)
                assertEquals(0, order.items.size)
            }
            is ParseResult.Failure -> fail("Esperava Success com defaults: ${result.error}")
        }
    }

    @Test
    fun `parse pedido com items ausente trata como lista vazia`() {
        val json = """
        {
          "orders": [
            { "orderSn": "ORD-003", "status": "COMPLETED" }
          ]
        }
        """.trimIndent()
        val result = parseOrdersResponse(json)
        when (result) {
            is ParseResult.Success -> {
                assertEquals(1, result.value.size)
                assertEquals(0, result.value[0].items.size)
            }
            is ParseResult.Failure -> fail("Esperava Success: ${result.error}")
        }
    }

    @Test
    fun `parse multiplos pedidos preserva ordem`() {
        val json = """
        {
          "orders": [
            { "orderSn": "A", "status": "X", "items": [] },
            { "orderSn": "B", "status": "Y", "items": [] },
            { "orderSn": "C", "status": "Z", "items": [] }
          ]
        }
        """.trimIndent()
        val result = parseOrdersResponse(json)
        when (result) {
            is ParseResult.Success -> {
                assertEquals(3, result.value.size)
                assertEquals("A", result.value[0].orderSn)
                assertEquals("B", result.value[1].orderSn)
                assertEquals("C", result.value[2].orderSn)
            }
            is ParseResult.Failure -> fail("Esperava Success: ${result.error}")
        }
    }
}