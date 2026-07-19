package com.rayshopee.app.data.repository

import com.rayshopee.app.orders.OrdersResponse
import org.json.JSONObject

/**
 * Repository para operações de rede relacionadas a pedidos Shopee.
 *
 * Extraída da lógica de rede que vivia inline na antiga `OrdersScreen.kt`
 * (versão pré-refatoração, hoje removida). É o ponto único de acesso ao backend
 * para a tela de pedidos, consumido pelo [com.rayshopee.app.ui.screens.OrdersViewModel].
 *
 * Implementação padrão: [OrdersRepositoryImpl] usando HttpURLConnection.
 *
 * **Importante:** Esta interface é JVM-pura (não depende de Android). Os métodos
 * suspendem usando kotlinx-coroutines (Dispatchers.IO é aplicado pelo impl). Isso
 * permite testes unitários sem mock de Android.
 */
interface OrdersRepository {
    /**
     * Busca a lista de pedidos a enviar do backend.
     *
     * Endpoint esperado: `GET {baseUrl}/api/orders/to-ship`
     *
     * @param baseUrl URL base configurável (ex.: ngrok)
     * @param timeFrom Timestamp em segundos Unix do início do período (null = servidor usa padrão 15 dias)
     * @param timeTo Timestamp em segundos Unix do fim do período (null = servidor usa agora)
     * @param skipEscrow Se true, pula busca de escrow (carregamento rápido)
     * @return Result.success com lista de pedidos parseados, ou Result.failure com erro
     */
    suspend fun fetchOrdersToShip(
        baseUrl: String,
        timeFrom: Long? = null,
        timeTo: Long? = null,
        skipEscrow: Boolean = false
    ): Result<List<OrdersResponse>>

    /**
     * Atualiza um valor de produto via POST genérico.
     *
     * Endpoint esperado: `POST {baseUrl}{endpoint}`
     *
     * Usado pelos fluxos de:
     * - update-cost
     * - update-stock
     * - update-price
     * - sync-full
     * - sync-item/{id}
     *
     * @param baseUrl URL base configurável
     * @param endpoint path do endpoint (começando com `/`)
     * @param body corpo JSON da requisição
     * @return Result.success(Unit) em HTTP 2xx, Result.failure com erro caso contrário
     */
    suspend fun updateProductValue(
        baseUrl: String,
        endpoint: String,
        body: JSONObject
    ): Result<Unit>
}