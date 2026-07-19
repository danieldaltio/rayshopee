package com.rayshopee.app.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rayshopee.app.orders.OrdersResponse
import com.rayshopee.app.orders.OrdersResponseItem
import com.rayshopee.app.util.calculateProfit
import java.text.SimpleDateFormat
import java.util.*

/**
 * Card de um pedido Shopee individual.
 *
 * Mostra cabeçalho (orderSn, status, data, transportadora), lista de itens
 * via [OrderItemRowRefactored], e rodapé com valor de venda e lucro previsto.
 */
@Composable
fun OrderCardRefactored(
    order: OrdersResponse,
    updatedPrices: Map<String, Double> = emptyMap(),
    onEditItem: (OrdersResponseItem) -> Unit,
    onSyncItem: (String) -> Unit
) {
    val dateFormat = remember { SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()) }
    val dateStr = remember(order.createTime) { dateFormat.format(Date(order.createTime)) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Pedido: ${order.orderSn}", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                Surface(
                    color = when (order.status) {
                        "READY_TO_SHIP" -> Color(0xFFFF9800)
                        "SHIPPED", "PROCESSED" -> Color(0xFF2196F3)
                        "COMPLETED" -> Color(0xFF4CAF50)
                        else -> Color.Gray
                    },
                    shape = MaterialTheme.shapes.extraSmall
                ) {
                    Text(
                        text = order.status,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White
                    )
                }
            }

            Text(dateStr, style = MaterialTheme.typography.bodySmall, color = Color.Gray)

            if (order.shippingCarrier.isNotBlank()) {
                Text(
                    "Transportadora: ${order.shippingCarrier}",
                    style = MaterialTheme.typography.labelSmall
                )
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), thickness = 0.5.dp)

            order.items.forEach { item ->
                val updatedPrice = updatedPrices["${item.itemId}:${item.modelId}"]
                OrderItemRowRefactored(
                    item = item,
                    updatedPrice = updatedPrice,
                    onClick = { onEditItem(item) },
                    onSync = { onSyncItem(item.itemId) }
                )
                Spacer(modifier = Modifier.height(4.dp))
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), thickness = 0.5.dp)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Valor Venda", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(
                        "R$ ${String.format("%.2f", order.totalAmount)}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Lucro Previsto", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    val profitColor = if (order.predictedProfit > 0) Color(0xFF2E7D32) else Color.Red
                    Text(
                        "R$ ${String.format("%.2f", order.predictedProfit)}",
                        fontWeight = FontWeight.Bold,
                        color = profitColor,
                        fontSize = 16.sp
                    )
                }
            }

            // Recalcular lucro previsto quando há preços alterados
            val hasUpdates = order.items.any { item ->
                updatedPrices.containsKey("${item.itemId}:${item.modelId}")
            }
            if (hasUpdates) {
                val profitDelta = order.items.sumOf { item ->
                    val newPrice = updatedPrices["${item.itemId}:${item.modelId}"]
                    if (newPrice != null) {
                        val (oldProfit, _) = calculateProfit(item.price, item.cost)
                        val (newProfit, _) = calculateProfit(newPrice, item.cost)
                        (newProfit - oldProfit) * item.quantity
                    } else 0.0
                }
                val newPredictedProfit = order.predictedProfit + profitDelta
                val newProfitColor = if (newPredictedProfit > 0) Color(0xFF2E7D32) else Color.Red
                Text(
                    "(novo lucro previsto: R$ ${String.format("%.2f", newPredictedProfit)})",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = newProfitColor,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp)
                        .wrapContentWidth(Alignment.End)
                )
            }
        }
    }
}

/**
 * Linha individual de um item dentro de um pedido.
 *
 * Mostra nome, EAN (copiável), variação, quantidade, preço/custo/estoque,
 * com botões de sincronizar e editar.
 */
@Composable
fun OrderItemRowRefactored(
    item: OrdersResponseItem,
    updatedPrice: Double? = null,
    onClick: () -> Unit,
    onSync: () -> Unit
) {
    val context = LocalContext.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            Icons.Default.ShoppingBag,
            contentDescription = null,
            modifier = Modifier.size(32.dp),
            tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
        )
        Column(modifier = Modifier.weight(1f).padding(start = 8.dp)) {
            Text(item.name, fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 1)
            if (item.barcode.isNotBlank()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        clipboard.setPrimaryClip(ClipData.newPlainText("EAN", item.barcode))
                        Toast.makeText(context, "Código copiado!", Toast.LENGTH_SHORT).show()
                    }
                ) {
                    Text(
                        "EAN: ${item.barcode}",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        Icons.Default.ContentCopy,
                        contentDescription = "Copiar",
                        modifier = Modifier.size(12.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
            Text(
                "${item.variation} | Qtd: ${item.quantity}",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Venda: R$ ${String.format("%.2f", item.price)}", fontSize = 11.sp)
                Text("Custo: R$ ${String.format("%.2f", item.cost)}", fontSize = 11.sp, color = Color.Blue)
                Text(
                    "Estoque: ${item.stock}",
                    fontSize = 11.sp,
                    color = if (item.stock < 5) Color.Red else Color.Unspecified
                )
            }
            if (updatedPrice != null) {
                Text(
                    "(alterado p/ R$ ${String.format("%.2f", updatedPrice)})",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF2E7D32),
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
        IconButton(onClick = onSync, modifier = Modifier.size(24.dp)) {
            Icon(
                Icons.Default.Sync,
                contentDescription = "Sincronizar Item",
                modifier = Modifier.size(16.dp),
                tint = MaterialTheme.colorScheme.primary
            )
        }
        IconButton(onClick = onClick, modifier = Modifier.size(24.dp)) {
            Icon(
                Icons.Default.Edit,
                contentDescription = "Editar",
                modifier = Modifier.size(16.dp),
                tint = Color.Gray
            )
        }
    }
}
