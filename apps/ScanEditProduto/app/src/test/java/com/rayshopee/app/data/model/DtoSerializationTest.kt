package com.rayshopee.app.data.model

import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Testes JVM-puros para DTOs do `data/model/Product.kt` (T2.2 do sprint.md).
 *
 * Valida que:
 *  - DTOs desserializam o JSON que vem do backend `legacy_v1/server`
 *  - Os campos camelCase sobrevivem o round-trip (P7 resolvido)
 *  - Defaults funcionam (campos opcionais)
 *
 * Roda com:  ./gradlew testDebugUnitTest
 */
class DtoSerializationTest {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    @Test
    fun `ProductVariation desserializa JSON da Shopee`() {
        val payload = """
            {
              "variationId": "123456789",
              "name": "Azul M",
              "price": 49.90,
              "stock": 12,
              "cost": 25.00,
              "barcode": "7891234567890"
            }
        """.trimIndent()

        val variation = json.decodeFromString<ProductVariation>(payload)

        assertEquals("123456789", variation.variationId)
        assertEquals("Azul M", variation.name)
        assertEquals(49.90, variation.price)
        assertEquals(12, variation.stock)
        assertEquals(25.00, variation.cost)
        assertEquals("7891234567890", variation.barcode)
    }

    @Test
    fun `ProductVariation aceita campos faltantes (defaults)`() {
        val payload = """{ "variationId": "1" }"""

        val variation = json.decodeFromString<ProductVariation>(payload)

        assertEquals("1", variation.variationId)
        assertEquals("", variation.name)
        assertEquals(0.0, variation.price)
        assertEquals(0, variation.stock)
    }

    @Test
    fun `UpdatePriceRequest serializa em camelCase`() {
        val req = UpdatePriceRequest(
            itemId = "987654321",
            variationId = "111222333",
            price = 99.99
        )

        val encoded = json.encodeToString(UpdatePriceRequest.serializer(), req)

        // camelCase (P7 alinhado em 2026-07-18)
        assertTrue(encoded.contains("\"itemId\":\"987654321\""), "Esperava itemId camelCase, recebi: $encoded")
        assertTrue(encoded.contains("\"variationId\":\"111222333\""), "Esperava variationId camelCase, recebi: $encoded")
        assertTrue(encoded.contains("\"price\":99.99"), "Esperava price, recebi: $encoded")
        // Garante que NÃO tem snake_case
        assertTrue(!encoded.contains("item_id"), "NÃO deveria ter item_id snake_case: $encoded")
        assertTrue(!encoded.contains("variation_id"), "NÃO deveria ter variation_id snake_case: $encoded")
    }

    @Test
    fun `UpdateStockRequest serializa em camelCase`() {
        val req = UpdateStockRequest(
            itemId = "987654321",
            variationId = "111222333",
            stock = 42
        )

        val encoded = json.encodeToString(UpdateStockRequest.serializer(), req)

        assertTrue(encoded.contains("\"itemId\":\"987654321\""), "Esperava itemId camelCase, recebi: $encoded")
        assertTrue(encoded.contains("\"variationId\":\"111222333\""), "Esperava variationId camelCase, recebi: $encoded")
        assertTrue(encoded.contains("\"stock\":42"), "Esperava stock, recebi: $encoded")
    }

    @Test
    fun `UpdateCostRequest serializa em camelCase (P7 resolvido)`() {
        val req = UpdateCostRequest(
            itemId = "987654321",
            modelId = "111222333",
            cost = 25.50
        )

        val encoded = json.encodeToString(UpdateCostRequest.serializer(), req)

        // P7 resolvido em 2026-07-18: era snake_case, agora camelCase alinhado com Price/Stock
        assertTrue(encoded.contains("\"itemId\":\"987654321\""),
            "P7: Esperava itemId camelCase (alinhado), recebi: $encoded")
        assertTrue(encoded.contains("\"modelId\":\"111222333\""),
            "P7: Esperava modelId camelCase (alinhado), recebi: $encoded")
        assertTrue(encoded.contains("\"cost\":25.5"), "Esperava cost, recebi: $encoded")

        // Garantia: NÃO tem mais snake_case (era o bug)
        assertTrue(!encoded.contains("\"item_id\""),
            "REGRESSÃO P7: voltou snake_case item_id: $encoded")
        assertTrue(!encoded.contains("\"model_id\""),
            "REGRESSÃO P7: voltou snake_case model_id: $encoded")
    }

    @Test
    fun `UpdateCostRequest desserializa o JSON que o backend envia`() {
        // Validação do contrato com backend — o que legacy_v1/server/index.js envia após o alinhamento
        val payload = """{ "itemId": "987654321", "modelId": "111222333", "cost": 25.50 }"""

        val req = json.decodeFromString<UpdateCostRequest>(payload)

        assertEquals("987654321", req.itemId)
        assertEquals("111222333", req.modelId)
        assertEquals(25.50, req.cost)
    }

    @Test
    fun `ProductSearchResult (nao-Serializable) é só modelo de dominio`() {
        // ProductSearchResult NÃO tem @Serializable, é construído pelo Repository
        // a partir do ProductSearchItemResponse (que VEM do backend)
        val result = ProductSearchResult(
            itemId = "1",
            modelId = 100L,
            name = "Camiseta",
            variation = "Azul M",
            sku = "CAM-AZ-M",
            price = 49.90,
            stock = 10,
            cost = 20.0,
            image = "https://..."
        )

        // Sanidade: construtor funciona, todos os campos são preenchidos
        assertNotNull(result)
        assertEquals("Camiseta", result.name)
        assertEquals(100L, result.modelId)
        assertEquals(49.90, result.price)
    }

    @Test
    fun `Product desserializa com lista de variacoes`() {
        val payload = """
            {
              "itemId": "987654321",
              "itemName": "Camiseta Test",
              "variations": [
                { "variationId": "1", "name": "Azul", "price": 49.9, "stock": 10, "cost": 20.0, "barcode": "111" },
                { "variationId": "2", "name": "Vermelha", "price": 49.9, "stock": 5, "cost": 20.0, "barcode": "222" }
              ]
            }
        """.trimIndent()

        val product = json.decodeFromString<Product>(payload)

        assertEquals("987654321", product.itemId)
        assertEquals("Camiseta Test", product.itemName)
        assertEquals(2, product.variations.size)
        assertEquals("Azul", product.variations[0].name)
        // Transient fields têm defaults
        assertEquals(false, product.isFromCache)
        assertEquals(0L, product.lastSyncedAt)
    }
}
