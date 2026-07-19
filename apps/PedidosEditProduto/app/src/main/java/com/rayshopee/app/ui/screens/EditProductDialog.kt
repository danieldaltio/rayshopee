package com.rayshopee.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Dialog de edição de produto (custo, estoque, preço).
 *
 * O estado `isSaving` agora vem do ViewModel (sobrevive a configuration changes
 * como rotação de tela), em vez de ser um `remember` local que se perdia.
 *
 * @param target item sendo editado + orderSn associado
 * @param isSaving se true, desabilita botões e mostra progress (controlado pelo ViewModel)
 * @param onDismiss callback para fechar o dialog
 * @param onConfirm callback com os novos valores (cost, stock, price)
 * @param onSync callback para sincronizar o item com a Shopee
 */
@Composable
fun EditProductDialogRefactored(
    target: EditingTarget,
    isSaving: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (cost: Double, stock: Int, price: Double) -> Unit,
    onSync: () -> Unit
) {
    val item = target.item
    var cost by remember { mutableStateOf(item.cost.toString()) }
    var stock by remember { mutableStateOf(item.stock.toString()) }
    var price by remember { mutableStateOf(item.price.toString()) }

    AlertDialog(
        onDismissRequest = { if (!isSaving) onDismiss() },
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Editar Produto", fontWeight = FontWeight.Bold)
                IconButton(onClick = onSync) {
                    Icon(
                        Icons.Default.Sync,
                        contentDescription = "Sincronizar com Shopee",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(item.name, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 2)
                Text("Variação: ${item.variation}", fontSize = 11.sp, color = Color.Gray)
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = cost,
                    onValueChange = { cost = it },
                    label = { Text("Preço de Custo (R$)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = stock,
                    onValueChange = { stock = it },
                    label = { Text("Estoque Shopee") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it },
                    label = { Text("Preço de Venda (R$)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(
                enabled = !isSaving,
                onClick = {
                    onConfirm(
                        cost.toDoubleOrNull() ?: 0.0,
                        stock.toIntOrNull() ?: 0,
                        price.toDoubleOrNull() ?: 0.0
                    )
                }
            ) {
                if (isSaving) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                else Text("Salvar Tudo")
            }
        },
        dismissButton = {
            TextButton(enabled = !isSaving, onClick = onDismiss) { Text("Cancelar") }
        }
    )
}
