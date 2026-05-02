# RayShopee Android - Technical Specification (SPEC.md)

## 1. Visão Geral Técnica

| Atributo | Valor |
|----------|-------|
| **Nome** | RayShopee Android |
| **Tipo** | Aplicativo Android nativo |
| **Arquitetura** | MVI (Model-View-Intent) |
| **Min SDK** | API 26 (Android 8.0) |
| **Target SDK** | API 35 (Android 15) |
| **Idioma** | Kotlin |
| **UI Framework** | Jetpack Compose com Material 3 |

---

## 2. Stack Tecnológico

### 2.1 Dependências Principais

| Biblioteca | Versão | Propósito |
|-----------|--------|-----------|
| Kotlin | 2.3.10 | Linguagem principal |
| Compose BOM | 2026.03.00 | UI Framework |
| Compose Compiler | 2.3.10 | Compilação Compose |
| Hilt | 2.53.1 | Injeção de dependência |
| Navigation Compose | 2.8.5 | Navegação |
| Retrofit | 2.11.0 | Cliente HTTP |
| OkHttp | 4.12.0 | HTTP interceptor/logging |
| Kotlin Coroutines | 1.9.0 | Programação assíncrona |
| CameraX | 1.4.1 | Camera API |
| ML Kit Barcode | 17.3.0 | Leitura de códigos de barras |
| Room | 2.6.1 | Cache local (preparado) |

### 2.2 Dependências de Build

| Ferramenta | Versão |
|-----------|--------|
| Gradle | 9.5.0 |
| AGP | 9.0.0 |
| Java | 25 (toolchain) |

---

## 3. Arquitetura de Software

### 3.1 Padrão MVI

```
┌─────────────────────────────────────────────────────────────────┐
│                         VIEW (UI)                               │
│  ScannerScreen.kt                                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ val uiState by viewModel.uiState.collectAsState()         │  │
│  │ onBarcodeScanned = { intent -> viewModel.processIntent() }│  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Intent
┌─────────────────────────────────────────────────────────────────┐
│                      VIEWMODEL                                  │
│  ScannerViewModel.kt                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ - sealed class ScannerIntent                              │  │
│  │ - data class ScannerUiState                               │  │
│  │ - fun processIntent(intent: ScannerIntent)               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ State
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ProductRepository.kt                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ interface ProductRepository                               │  │
│  │   - searchByBarcode(barcode): Flow<Result<Product>>      │  │
│  │   - updatePrice(itemId, variationId, price)               │  │
│  │   - updateStock(itemId, variationId, stock)                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Estrutura de Diretórios

```
app/src/main/java/com/rayshopee/app/
├── RayShopeeApplication.kt          # @HiltAndroidApp
├── MainActivity.kt                 # @AndroidEntryPoint
├── di/
│   └── RepositoryModule.kt         # Hilt Module
├── data/
│   ├── model/
│   │   ├── Product.kt              # Data models
│   │   ├── ProductVariation.kt
│   │   ├── UpdatePriceRequest.kt
│   │   └── UpdateStockRequest.kt
│   └── repository/
│       ├── ProductRepository.kt    # Interface
│       └── ProductRepositoryImpl.kt # Implementation (Retrofit)
└── ui/
    ├── theme/
    │   └── Theme.kt                # Material3 theme
    └── screens/
        ├── ScannerScreen.kt       # Composable (View)
        ├── ScannerViewModel.kt    # MVI ViewModel
        └── ScannerIntent.kt      # Intent definitions
```

---

## 4. Especificação de UI/UX

### 4.1 Design System

**Material Design 3** com dynamic colors ativado (Android 12+).

```kotlin
@Composable
fun RayShopeeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) 
            else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    MaterialTheme(colorScheme = colorScheme, content = content)
}
```

### 4.2 Layout da Tela

```
┌─────────────────────────────────────────┐
│  TopAppBar: "RayShopee - Scanner"        │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      Camera Preview (250dp)     │   │
│  │    [Visualização da câmera]    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Card do Produto               │   │
│  │  - Nome do Produto             │   │
│  │  - ID: xxxxx                    │   │
│  │  - [Loading spinner]           │   │
│  │                                 │   │
│  │  Variações:                     │   │
│  │  ┌───────────────────────────┐ │   │
│  │  │ Cor: Azul                 │ │   │
│  │  │ Preço: R$ 99,90 [✏️]      │ │   │
│  │  │ Estoque: 50 [✏️]          │ │   │
│  │  └───────────────────────────┘ │   │
│  │  ┌───────────────────────────┐ │   │
│  │  │ Cor: Vermelho              │ │   │
│  │  │ Preço: R$ 99,90 [✏️]      │ │   │
│  │  │ Estoque: 30 [✏️]          │ │   │
│  │  └───────────────────────────┘ │   │
│  │                                 │   │
│  │  [Botão: Escanear Outro]       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ou                                      │
│                                         │
│  "Aponte a câmera para o código de      │
│   barras" (estado inicial)               │
│                                         │
│  ou                                      │
│                                         │
│  [Card de Erro em vermelho]             │
└─────────────────────────────────────────┘
```

### 4.3 Componentes UI

| Componente | Material3 | Uso |
|------------|-----------|-----|
| Scaffold | ✅ | Estrutura base |
| TopAppBar | ✅ | Header |
| Card | ✅ | Container de produto |
| OutlinedTextField | ✅ | Edição inline |
| IconButton | ✅ | Botões de editar |
| CircularProgressIndicator | ✅ | Loading |
| LazyColumn | ✅ | Lista de variações |
| Button/OutlinedButton | ✅ | Ações |

---

## 5. Especificação de API

### 5.1 Endpoints Backend

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/products/barcode?barcode={code}` | Buscar produto por código |
| POST | `/api/products/update-price` | Atualizar preço |
| POST | `/api/products/update-stock` | Atualizar estoque |

### 5.2 Contratos de Dados

```kotlin
// Response: GET /api/products/barcode
data class ProductResponse(
    val itemId: String,
    val itemName: String,
    val variations: List<VariationResponse>
)

data class VariationResponse(
    val variationId: String,
    val name: String,
    val price: Double,
    val stock: Int
)

// Request: POST /api/products/update-price
data class UpdatePriceRequest(
    val itemId: String,
    val variationId: String,
    val price: Double
)

// Request: POST /api/products/update-stock
data class UpdateStockRequest(
    val itemId: String,
    val variationId: String,
    val stock: Int
)

// Response genérico
data class UpdateResponse(
    val success: Boolean,
    val message: String = ""
)
```

---

## 6. Especificação de Camera

### 6.1 CameraX Configuration

```kotlin
val imageAnalysis = ImageAnalysis.Builder()
    .setTargetResolution(Size(1280, 720))
    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
    .build()
```

### 6.2 ML Kit Barcode

- **Formatos suportados:** EAN-13, EAN-8, UPC-A, UPC-E, Code-128, Code-39, QR Code
- **Modo de detecção:** Real-time com ImageAnalysis
- **Cooldown:** 2 segundos entre detecções (para evitar múltiplos triggers)

---

## 7. Tratamento de Erros

| Cenário | Comportamento |
|---------|---------------|
| API retorna 404 | Exibe "Produto não encontrado" |
| Timeout de rede | Exibe "Erro de conexão" |
| Câmera não disponível | Exibe "Camera permission required" |
| Permissão negada | Solicita permissão novamente |

---

## 8. Estado da Aplicação (MVI)

```kotlin
data class ScannerUiState(
    val isLoading: Boolean = false,        // Busca em andamento
    val product: Product? = null,         // Produto carregado
    val error: String? = null,            // Mensagem de erro
    val lastScannedBarcode: String? = null, // Último código escaneado
    val isUpdating: Boolean = false       // Atualização em andamento
)

sealed interface ScannerIntent {
    data class BarcodeScanned(val barcode: String) : ScannerIntent
    data class UpdatePrice(val variationId: String, val price: Double) : ScannerIntent
    data class UpdateStock(val variationId: String, val stock: Int) : ScannerIntent
    data object ClearError : ScannerIntent
    data object ClearProduct : ScannerIntent
}
```

---

## 9. Configuração de Build

### 9.1 Gradle Version Catalog (libs.versions.toml)

```toml
[versions]
agp = "9.0.0"
kotlin = "2.3.10"
composeBom = "2026.03.00"
hilt = "2.53.1"
# ... outras dependências
```

### 9.2 Android Configuration

```kotlin
android {
    namespace = "com.rayshopee.app"
    compileSdk = 35
    defaultConfig {
        minSdk = 26
        targetSdk = 35
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_25
        targetCompatibility = JavaVersion.VERSION_25
    }
    buildFeatures {
        compose = true
    }
}
```

---

## 10. Permissions

```xml
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
```

---

## 11. Critérios de Qualidade

- **Cobertura de código:** Mínimo 70% para camadas de domínio
- **Linting:** ktlint com regras padrão
- **Tamagui:** Sem imports desnecessários
- **Proguard:** Configurado para release builds
- **APK Size:** < 15MB (sem debug symbols)