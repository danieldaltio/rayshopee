package com.shopeelister.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var showKeys by remember { mutableStateOf(false) }
    val uriHandler = LocalUriHandler.current
    val context = LocalContext.current

    LaunchedEffect(state.authUrl) {
        state.authUrl?.let {
            uriHandler.openUri(it)
        }
    }

    LaunchedEffect(state.saved) {
        if (state.saved) onBack()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Configurações") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Voltar")
                    }
                },
                actions = {
                    TextButton(onClick = { viewModel.fillDefaults() }) {
                        Text("Preencher Padrões", color = MaterialTheme.colorScheme.primary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Shopee Section
            // Connection Section
            SectionHeader("Conexão e Backend")
            OutlinedTextField(
                value = state.serverUrl,
                onValueChange = { viewModel.updateServerUrl(it) },
                label = { Text("URL do Servidor RayShopee") },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("https://xxx.ngrok-free.dev") }
            )

            HorizontalDivider(Modifier.padding(vertical = 8.dp))

            SectionHeader("Configuração Rápida")
            Button(
                onClick = { viewModel.importFromRayShopee() },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.tertiary
                )
            ) {
                Icon(Icons.Default.CloudDownload, null)
                Spacer(Modifier.width(8.dp))
                Text("Importar do RayShopee (Server)")
            }
            
            Text(
                "Sincroniza automaticamente as chaves e o Access Token do seu servidor backend.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (state.loginStatus.isNotBlank()) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = if (state.loginStatus.contains("Erro") || state.loginStatus.contains("Falha"))
                            MaterialTheme.colorScheme.errorContainer
                        else MaterialTheme.colorScheme.primaryContainer
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = state.loginStatus,
                        modifier = Modifier.padding(12.dp),
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (state.loginStatus.contains("Erro") || state.loginStatus.contains("Falha"))
                            MaterialTheme.colorScheme.onErrorContainer
                        else MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }

            HorizontalDivider(Modifier.padding(vertical = 8.dp))

            SectionHeader("Shopee Open Platform")
            OutlinedTextField(
                value = state.partnerId,
                onValueChange = { viewModel.updatePartnerId(it) },
                label = { Text("Partner ID") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = state.partnerKey,
                onValueChange = { viewModel.updatePartnerKey(it) },
                label = { Text("Partner Key") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = if (showKeys) VisualTransformation.None
                else PasswordVisualTransformation()
            )

            Spacer(Modifier.height(8.dp))

            Button(
                onClick = { viewModel.generateAuthUrl() },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
            ) {
                Icon(Icons.Default.Link, null)
                Spacer(Modifier.width(8.dp))
                Text("Linkar Loja (Abrir Navegador)")
            }

            HorizontalDivider(Modifier.padding(vertical = 8.dp))

            // Shop Section
            SectionHeader("Dados da Loja (Após Autorizar)")
            OutlinedTextField(
                value = state.shopId,
                onValueChange = { viewModel.updateShopId(it) },
                label = { Text("Shop ID") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
            )

            var authCode by remember { mutableStateOf("") }
            OutlinedTextField(
                value = authCode,
                onValueChange = { authCode = it },
                label = { Text("Código de Autorização (da URL)") },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Cole o 'code=' da URL aqui") }
            )

            Spacer(Modifier.height(8.dp))

            Button(
                onClick = { viewModel.loginShopee(authCode, state.shopId) },
                modifier = Modifier.fillMaxWidth(),
                enabled = authCode.isNotBlank() && state.shopId.isNotBlank()
            ) {
                Text("Finalizar Login (Obter Token)")
            }

            OutlinedTextField(
                value = state.accessToken,
                onValueChange = { viewModel.updateAccessToken(it) },
                label = { Text("Access Token") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = if (showKeys) VisualTransformation.None
                else PasswordVisualTransformation()
            )

            HorizontalDivider()

            // Groq Section
            SectionHeader("Groq AI (Llama 3.3)")
            OutlinedTextField(
                value = state.groqKey,
                onValueChange = { viewModel.updateGroqKey(it) },
                label = { Text("Groq API Key") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = if (showKeys) VisualTransformation.None
                else PasswordVisualTransformation()
            )

            HorizontalDivider()

            HorizontalDivider()

            // Remove BG Section
            SectionHeader("Remoção de Fundo (Cloudinary)")
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Remover fundo automaticamente", Modifier.weight(1f))
                Switch(
                    checked = state.removeBgEnabled,
                    onCheckedChange = { viewModel.updateRemoveBgEnabled(it) }
                )
            }
            OutlinedTextField(
                value = state.cloudinaryCloudName,
                onValueChange = { viewModel.updateCloudinaryCloudName(it) },
                label = { Text("Cloud Name") },
                modifier = Modifier.fillMaxWidth(),
                enabled = state.removeBgEnabled
            )
            OutlinedTextField(
                value = state.cloudinaryApiKey,
                onValueChange = { viewModel.updateCloudinaryApiKey(it) },
                label = { Text("API Key") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = if (showKeys) VisualTransformation.None
                else PasswordVisualTransformation(),
                enabled = state.removeBgEnabled
            )
            OutlinedTextField(
                value = state.cloudinaryApiSecret,
                onValueChange = { viewModel.updateCloudinaryApiSecret(it) },
                label = { Text("API Secret") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = if (showKeys) VisualTransformation.None
                else PasswordVisualTransformation(),
                enabled = state.removeBgEnabled
            )
            Text(
                text = "Configure em cloudinary.com > Settings > API Keys",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            HorizontalDivider()

            // Logistics Section
            SectionHeader("Métodos de Envio")
            Text(
                "Selecione os canais de logística para usar na publicação de produtos:",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = state.logisticsDirect,
                            onCheckedChange = { viewModel.updateLogisticsDirect(it) }
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "Entrega Direta",
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                "Standard / Normal Delivery",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = state.logisticsShopeeExpress,
                            onCheckedChange = { viewModel.updateLogisticsShopeeExpress(it) }
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "Shopee Express",
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                "Entrega rápida via Shopee",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = state.logisticsPickup,
                            onCheckedChange = { viewModel.updateLogisticsPickup(it) }
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "Retirada pelo Comprador",
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                "Pickup / Retirada em ponto",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
            
            Text(
                "💡 Pelo menos um método deve estar selecionado para publicar produtos.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.primary
            )

            HorizontalDivider()

            // Toggle key visibility
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = showKeys, onCheckedChange = { showKeys = it })
                Text("Mostrar chaves")
            }

            Spacer(Modifier.height(8.dp))

            // Save button
            Button(
                onClick = { viewModel.save() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Save, null)
                Spacer(Modifier.width(8.dp))
                Text("Salvar Configurações", style = MaterialTheme.typography.labelLarge)
            }

            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.primary
    )
}
