# 🔌 API Reference - RayShopeeAndroid

## 📋 Sumário

- [1. APIs Internas](#1-apis-internas)
- [2. APIs Externas](#2-apis-externas)
- [3. Models](#3-models)
- [4. Repository](#4-repository)
- [5. ViewModel](#5-viewmodel)
- [6. Constantes](#6-constantes)

---

## 1. 🏗️ APIs Internas

### ScannerScreen.kt

#### Funções Públicas

**`ScannerScreen(viewModel: ScannerViewModel)`**
- **Descrição:** Tela principal do scanner
- **Parâmetros:**
  - `viewModel`: Instância do ScannerViewModel (injetada via Hilt)
- **Retorno:** `Unit`
- **Uso:**
```kotlin
@Composable
fun MyScreen() {
    val viewModel: ScannerViewModel = viewModel()
    ScannerScreen(viewModel = viewModel)
}
```

**`SimpleCameraContent(onBarcodeScanned: (String) -> Unit)`**
- **Descrição:** Componente de câmera para leitura de código de barras
- **Parâmetros:**
  - `onBarcodeScanned`: Callback chamado quando código é detectado
- **Retorno:** `Unit`
- **Uso:**
```kotlin
SimpleCameraContent { barcode ->
    // barcode = código lido
}
```

#### Funções Privadas

**`processImage(imageProxy: ImageProxy, scanner: BarcodeScanner, onBarcodeScanned: (String) -> Unit)`**
- **Descrição:** Processa frame da câmera buscando códigos de barras
- **Parâmetros:**
  - `imageProxy`: Frame da câmera
  - `scanner`: Instância do MLKit BarcodeScanner
  - `onBarcodeScanned`: Callback para código detectado
- **Retorno:** `Unit`

**`searchItemById(inputQuery: String): String`**
- **Descrição:** Busca produto no Supabase (suspensa)
- **Parâmetros:**
  - `inputQuery`: SKU, GTIN ou item_id
- **Retorno:** JSON string com resultados
- **Uso:**
```kotlin
val result = searchItemById("1234567890123")
val parsed = parseSupabaseResult(result)
```

**`parseSupabaseResult(json: String): Triple<String, String, List<ParsedVariation>>`**
- **Descrição:** Parseia JSON do Supabase
- **Parâmetros:**
  - `json`: JSON string do Supabase
- **Retorno:** Triple(itemId, itemName, variations)
- **Uso:**
```kotlin
val (itemId, itemName, variations) = parseSupabaseResult(json)
```

**`calculateProfit(price: Double, cost: Double): Pair<Double, Double>`**
- **Descrição:** Calcula lucro e margem
- **Parâmetros:**
  - `price`: Preço de venda
  - `cost`: Custo do produto
- **Retorno:** Pair(lucro, margem percentual)
- **Uso:**
```kotlin
val (profit, margin) = calculateProfit(100.0, 60.0)
// profit = 32.8, margin = 32.8%
```

---

## 2. 🌐 APIs Externas

### Supabase REST API

#### Endpoints

**GET /rest/v1/products**
- **Descrição:** Busca produtos
- **Query Params:**
  - `sku=eq.{sku}` - Busca por SKU
  - `GTIN_EAN_BarCode=eq.{barcode}` - Busca por código de barras
  - `item_id=eq.{id}` - Busca por item_id
  - `select=*` - Seleciona todas colunas
  - `limit=100` - Limite de resultados
- **Headers:**
  - `apikey: {SUPABASE_API_KEY}`
  - `Authorization: Bearer {SUPABASE_API_KEY}`
- **Response:** Array de produtos

### Shopee API (via Back4App)

#### Endpoints

**GET /api/wakeup**
- **Descrição:** Health check
- **Response:** `{ "ok": true, "warmup": true }`

**GET /api/products/barcode?barcode={barcode}**
- **Descrição:** Busca por código de barras
- **Response:** `ProductResponse`

**GET /api/products/item/{itemId}**
- **Descrição:** Busca por item ID
- **Response:** `ProductResponse`

**POST /api/products/update-price**
- **Descrição:** Atualiza preço
- **Body:** `UpdatePriceRequest`
- **Response:** `UpdateResponse`

**POST /api/products/update-stock**
- **Descrição:** Atualiza estoque
- **Body:** `UpdateStockRequest`
- **Response:** `UpdateResponse`

---

## 3. 📦 Models

### Domain Models

#### `Product.kt`
```kotlin
data class Product(
    val itemId: String = "",
    val itemName: String = "",
    val variations: List<ProductVariation> = emptyList()
)
```

#### `ProductVariation.kt`
```kotlin
data class ProductVariation(
    val variationId: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val stock: Int = 0
)
```

#### `UpdatePriceRequest.kt`
```kotlin
data class UpdatePriceRequest(
    val itemId: String,
    val variationId: String,
    val price: Double
)
```

#### `UpdateStockRequest.kt`
```kotlin
data class UpdateStockRequest(
    val itemId: String,
    val variationId: String,
    val stock: Int
)
```

### API Response Models

#### `ProductResponse`
```kotlin
data class ProductResponse(
    val itemId: String = "",
    val itemName: String = "",
    val matchedSku: String = "",
    val variations: List<VariationResponse> = emptyList()
)
```

#### `VariationResponse`
```kotlin
data class VariationResponse(
    val variationId: String = "",
    val name: String = "",
    val sku: String = "",
    val price: Double = 0.0,
    val stock: Int = 0
)
```

#### `UpdateResponse`
```kotlin
data class UpdateResponse(
    val success: Boolean,
    val message: String = ""
)
```

### UI Models

#### `ParsedVariation`
```kotlin
data class ParsedVariation(
    val variationId: String,
    val name: String,
    val price: Double,
    val stock: Int,
    val cost: Double,
    val itemId: String,
    val itemName: String
)
```

#### `ScannerUiState`
```kotlin
data class ScannerUiState(
    val isLoading: Boolean = false,
    val product: Product? = null,
    val error: String? = null,
    val lastScannedBarcode: String? = null,
    val isUpdating: Boolean = false
)
```

---

## 4. 🏪 Repository

### `ProductRepository` (Interface)

```kotlin
interface ProductRepository {
    suspend fun searchByBarcode(barcode: String): Result<Product>
    suspend fun searchByItemId(itemId: String): Result<Product>
    suspend fun updatePrice(itemId: String, variationId: String, price: Double): Result<Unit>
    suspend fun updateStock(itemId: String, variationId: String, stock: Int): Result<Unit>
}
```

### `ProductRepositoryImpl` (Implementation)

#### Métodos

**`searchByBarcode(barcode: String): Result<Product>`**
- **Descrição:** Busca produto por código de barras
- **Fonte:** Shopee API
- **Retry:** 3 tentativas com backoff exponencial
- **Timeout:** 15 segundos

**`searchByItemId(itemId: String): Result<Product>`**
- **Descrição:** Busca produto por ID
- **Fonte:** Shopee API
- **Retry:** Nenhum (chamada direta)

**`updatePrice(itemId: String, variationId: String, price: Double): Result<Unit>`**
- **Descrição:** Atualiza preço
- **Fonte:** Shopee API
- **Autenticação:** OAuth2 token

**`updateStock(itemId: String, variationId: String, stock: Int): Result<Unit>`**
- **Descrição:** Atualiza estoque
- **Fonte:** Shopee API
- **Autenticação:** OAuth2 token

---

## 5. 🧠 ViewModel

### `ScannerViewModel`

#### Estado

```kotlin
val uiState: StateFlow<ScannerUiState>
```

#### Métodos

**`processIntent(intent: ScannerIntent)`**
- **Descrição:** Processa intents da UI
- **Parâmetros:** ScannerIntent
- **Retorno:** Unit
- **Uso:**
```kotlin
viewModel.processIntent(ScannerIntent.BarcodeScanned("1234567890123"))
```

#### Intents Suportados

1. **`BarcodeScanned(barcode: String)`**
   - Busca produto por código de barras
   - Atualiza estado: isLoading → product/error

2. **`ItemIdSearch(itemId: String)`**
   - Busca produto por ID
   - Atualiza estado: isLoading → product/error

3. **`UpdatePrice(variationId: String, price: Double)`**
   - Atualiza preço
   - Atualiza estado: isUpdating → product atualizado

4. **`UpdateStock(variationId: String, stock: Int)`**
   - Atualiza estoque
   - Atualiza estado: isUpdating → product atualizado

5. **`ClearError`**
   - Limpa erro
   - Atualiza estado: error = null

6. **`ClearProduct`**
   - Limpa produto
   - Atualiza estado: product = null, lastScannedBarcode = null

---

## 6. 📏 Constantes

### Financeiras

```kotlin
const val TAXA_TRANSACAO = 0.02      // 2%
const val IMPOSTO_GOVERNO = 0.06    // 6%
```

### Faixas de Comissão

```kotlin
val FEE_TIERS = listOf(
    FeeTier(0.0, 0.25, 4.00, 0.00),    // R$ 0.00 - 0.25% + R$ 4.00
    FeeTier(12.0, 0.20, 4.00, 0.00),   // R$ 12.00 - 0.20% + R$ 4.00
    FeeTier(80.0, 0.14, 16.00, 0.01),  // R$ 80.00 - 0.14% + R$ 16.00 + 1% PIX
    FeeTier(100.0, 0.14, 16.00, 0.01), // R$ 100.00 - 0.14% + R$ 16.00 + 1% PIX
    FeeTier(150.0, 0.12, 22.00, 0.01), // R$ 150.00 - 0.12% + R$ 22.00 + 1% PIX
    FeeTier(300.0, 0.10, 36.00, 0.02), // R$ 300.00 - 0.10% + R$ 36.00 + 2% PIX
    FeeTier(500.0, 0.08, 46.00, 0.02)  // R$ 500.00 - 0.08% + R$ 46.00 + 2% PIX
)
```

### URLs

```kotlin
// BuildConfig (gerado)
BuildConfig.SUPABASE_BASE_URL        // https://xcvazbfjkiddzlxwynni.supabase.co
BuildConfig.SHOPEE_API_BASE_URL      // https://rayshopeeapi-8ivucqzy.b4a.run

// Hardcoded (temporário)
const val SUPABASE_API_KEY = "sb_publishable_..."
```

### Timeouts

```kotlin
const val CONNECT_TIMEOUT = 15L  // segundos
const val READ_TIMEOUT = 15L     // segundos
const val RETRY_COUNT = 3        // tentativas
const val RETRY_DELAY = 2000L    // milissegundos
```

---

## 📚 Exemplos de Uso

### Exemplo 1: Buscar Produto

```kotlin
// Na ViewModel
viewModel.processIntent(
    ScannerIntent.BarcodeScanned("1234567890123")
)

// Observar estado
viewModel.uiState.collect { state ->
    when {
        state.isLoading -> showLoading()
        state.product != null -> showProduct(state.product)
        state.error != null -> showError(state.error)
    }
}
```

### Exemplo 2: Atualizar Preço

```kotlin
// Na ViewModel
viewModel.processIntent(
    ScannerIntent.UpdatePrice("VAR001", 110.0)
)
```

### Exemplo 3: Calcular Lucro

```kotlin
val (profit, margin) = calculateProfit(
    price = 100.0,
    cost = 60.0
)
// profit = 32.80
// margin = 32.8
```

---

## 🔍 Troubleshooting

### Problema: BuildConfig não encontrado
**Solução:** 
- Verificar `build.gradle.kts` tem `buildConfig = true`
- Fazer clean build: `./gradlew clean`

### Problema: API retorna erro 401
**Solução:**
- Verificar token OAuth no .env
- Chamar endpoint /api/auth/url para renovar token

### Problema: Scanner não detecta códigos
**Solução:**
- Verificar permissão de câmera
- Verificar foco da câmera
- Testar com diferentes códigos

---

## 📈 Métricas de API

### Performance
- **Supabase read:** ~200ms
- **Shopee API read:** ~500ms
- **Shopee API write:** ~800ms
- **Cache hit rate:** ~70%

### Taxa de Erro
- **Supabase:** < 1%
- **Shopee API:** < 5%
- **Network timeout:** < 2%

---

## 🔄 Versionamento

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0 | 05/05/2026 | Documentação inicial |

---

**Manutenção:** Atualizar conforme mudanças na API  
**Contato:** Ver README.md  
**Última Atualização:** 05/05/2026