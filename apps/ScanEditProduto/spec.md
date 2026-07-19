# ScanEditProduto — Technical Specification (SPEC)

**Versão:** 2.2 · 2026-07-18 (fechamento da Sprint 1.5 — auto-descoberta inteligente)
**Status:** ✅ Canônico (bump sincronizado com `HOLISTIC_REPORT.md` v2.2 e `prd.md` v2.2)
**Stack:** Kotlin 2.3.10 · Compose BOM 2026.03.00 · Hilt 2.59.2 · Retrofit 3.0.0 · Room 2.8.4 · CameraX 1.4.2 · MLKit 17.3.0 · WorkManager 2.9.0 + Hilt-Work 1.2.0
**Módulo compartilhado:** **`:rayshopee-core`** (composite build via `includeBuild("../rayshopee-core")`) — provê `NetworkConfig`, `NetworkMonitor`, `NetworkDiscovery` (v2 c/ scan /24), `FallbackUrlInterceptor`, `NetworkPreferences`, **`SsidResolver`**, **`NsdDiscovery`**

---

## 1. Identidade

| Atributo | Valor |
|---|---|
| `applicationId` | `com.rayshopee.scanedit` ✅ (renomeado de `com.rayshopee.app` em 2026-07-04 — **P12 resolvido**) |
| `namespace` Kotlin | `com.rayshopee.app` (mantido por compatibilidade com código existente) |
| `versionCode` / `versionName` | 3 / 1.0.0 |
| `minSdk` / `targetSdk` / `compileSdk` | 26 / 35 / 36 |
| `rootProject.name` | `ScanEditProduto` |
| Activities | 1 (`MainActivity`, LAUNCHER) |
| Application | `RayShopeeApplication` (`@HiltAndroidApp` + `Configuration.Provider`) |
| Entry point | `MainActivity.onCreate()` → `setContent { RayShopeeTheme { ScannerScreen() } }` |
| Settings dialog | 🆕 Permite configurar URL do backend em runtime (vai pra `SharedPreferences("app_prefs")` chave `"base_url"`) |

---

## 2. Stack e versões (versionado em `gradle/libs.versions.toml`)

```toml
[versions]
agp                = "9.0.0"
kotlin             = "2.3.10"
ksp                = "2.3.5"
coreKtx            = "1.16.0"
lifecycleRuntimeKtx= "2.10.0"
activityCompose    = "1.13.0"
composeBom         = "2026.03.00"
navigationCompose  = "2.9.7"
hilt               = "2.59.2"
hiltNavigationCompose = "1.2.0"
retrofit           = "3.0.0"
okhttp             = "5.3.0"
coroutines         = "1.10.2"
room               = "2.8.4"
camerax            = "1.4.2"
mlkitBarcode       = "17.3.0"
kotlinxSerialization = "1.8.1"
```

Build tools: Java 17 toolchain, Gradle wrapper, AGP 9.0.0.

---

## 3. Arquitetura — MVI com unidirectional data flow (v2.1 + 3.8 Sprint 1.5)

```
┌──────────────────────────────────────────────────────────────┐
│                       UI Layer (Compose)                      │
│  ScannerScreen.kt (770 ln)                                    │
│   ├─ collectAsStateWithLifecycle() ← uiState                  │
│   ├─ CameraX preview (when permission granted)                │
│   ├─ MLKit barcode callback → ScannerIntent.BarcodeScanned(b) │
│   ├─ Painel inferior (expandível): produto + variações        │
│   ├─ Lista de resultados de busca por nome 🆕                  │
│   ├─ Settings dialog (URL do backend) 🆕                       │
│   ├─ Toggle de mute dos bips 🆕                               │
│   └─ Status indicator (🟢/🔴/🟡) no TopAppBar                │
└──────────────────────────────────────────────────────────────┘
                          │  intent
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    ViewModel (MVI)                             │
│  ScannerViewModel.kt (556 ln)                                  │
│   ├─ sealed interface ScannerIntent (11 casos) 🆕              │
│   │    · BarcodeScanned(barcode)                              │
│   │    · ItemIdSearch(itemId)                                 │
│   │    · NameSearch(query) 🆕                                  │
│   │    · OpenFromSearchResult(itemId) 🆕                      │
│   │    · ClearSearchResults 🆕                                 │
│   │    · UpdatePrice(variationId, price)                      │
│   │    · UpdateStock(variationId, stock)                      │
│   │    · UpdateCost(variationId, cost)                        │
│   │    · ClearError | ClearProduct                            │
│   │    · SetUserUrls(urls) 🆕                                  │
│   ├─ data class ScannerUiState (12 campos) 🆕                  │
│   │    · isLoading · isSearching 🆕 · product · error          │
│   │    · warning · lastScannedBarcode · isUpdating            │
│   │    · isOnline · searchResults 🆕 · lastSearchQuery 🆕      │
│   │    · userUrls 🆕 · candidates 🆕                           │
│   ├─ private MutableStateFlow<ScannerUiState>                 │
│   ├─ init {                                                    │
│   │     observeNetworkState()  // 🆕 NetworkMonitor reativo   │
│   │     checkHealthPeriodically()  // polling 2min             │
│   │     observeNetworkConfig()  // 🆕 UI vê URLs resolvidas   │
│   │  }                                                         │
│   └─ fun processIntent(intent: ScannerIntent)                 │
│        ├─ handleBarcodeScanned (cooldown 2s + last-barcode)   │
│        ├─ handleItemIdSearch                                  │
│        ├─ handleNameSearch 🆕                                  │
│        ├─ handleOpenFromSearchResult 🆕                        │
│        ├─ handleUpdatePrice / Stock / Cost                    │
│        │   └─ sucesso → beepPlayer.playEdit()                 │
│        │   └─ OfflineQueuedException → warning 🆕 + playEdit  │
│        │   └─ outro erro → error + playError                  │
│        ├─ clearError / clearProduct                           │
│        └─ setUserUrls (persiste via NetworkConfig) 🆕         │
│                                                                │
│  Injetado: ProductRepository + NetworkMonitor + BeepPlayer 🆕 │
│            + NetworkConfig (todos do :rayshopee-core, exceto   │
│            repository que é local)                             │
└──────────────────────────────────────────────────────────────┘
                          │  suspend call
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                 Repository (Hilt @Singleton)                   │
│  ProductRepositoryImpl.kt (432 ln)                            │
│   ├─ searchByBarcode(b): Result<Product>                      │
│   │    ├─ try network → cache in Room                         │
│   │    ├─ on network fail: try cache Room                     │
│   │    └─ on both fail: Result.failure(...)                   │
│   ├─ searchByItemId(itemId): Result<Product>                  │
│   ├─ searchByName(query): Result<List<ProductSearchResult>> 🆕│
│   ├─ updatePrice / Stock / Cost(itemId, varId, value,         │
│   │                            fromQueue=false)                │
│   │    ├─ try network → Result.success(Unit)                  │
│   │    ├─ on failure + !fromQueue (UI chamando):              │
│   │    │    ├─ dao.insertPendingAction(...)                   │
│   │    │    ├─ WorkManager.enqueue(OneTimeWorkRequest<        │
│   │    │    │     SyncWorker>())                              │
│   │    │    └─ Result.failure(OfflineQueuedException) 🆕       │
│   │    └─ on failure + fromQueue (Worker re-tentando):        │
│   │         └─ Result.failure(cause) (NÃO duplica pendência)  │
│   ├─ checkHealth(): Boolean → networkConfig.checkHealth() 🆕  │
│   │    (testa TODOS candidatos em paralelo)                   │
│   └─ companion BASE_URL = NetworkConfig.DEFAULT_CLOUDFLARE_URL│
│        (placeholder do Retrofit; FallbackUrlInterceptor        │
│         reescreve pra cada candidato do NetworkConfig)        │
│                                                                │
│  NetworkConfig (do :rayshopee-core) 🆕                        │
│   ├─ userUrls: StateFlow<List<String>> (do SharedPrefs)       │
│   ├─ candidates: StateFlow<List<String>> = [userUrls,         │
│   │                                            lanUrl,        │
│   │                                            cloudflareUrl] │
│   ├─ refreshLan() (background scan de LAN)                    │
│   └─ checkHealth() (testa todos em paralelo)                  │
└──────────────────────────────────────────────────────────────┘
           │                                          │
           ▼                                          ▼
┌──────────────────────────────┐    ┌──────────────────────────────────┐
│   Remote: ShopeeApi (Retrofit)│    │  Local: AppDatabase (Room v3)    │
│  • /api/wakeup               │    │  • products (ProductEntity)      │
│  • /api/products/barcode     │    │  • pending_actions (PEntity)      │
│  • /api/products/item/{id}   │    │                                  │
│  • /api/products/search 🆕   │    │                                  │
│  • /api/products/update-*    │    │                                  │
│                              │    │                                  │
│  via legacy_v1/server        │    │                                  │
│  (Node.js, porta 3003)       │    │                                  │
│  ou RayHub (Sprint 3)        │    │                                  │
└──────────────────────────────┘    └──────────────────────────────────┘
              │                                  ▲
              │                                  │  insert
              │            ┌─────────────────────┴──────────────┐
              │            │   SyncWorker (@HiltWorker)         │
              └───────────▶│   • getAllPendingActions()         │
              (fromQueue=  │   • for each:                      │
               true)       │     repo.updateX(fromQueue=true)   │
                           │     sucesso → dao.deletePending(id) │
                           │     falha → retry                  │
                           │   agendado: OneTimeWorkRequest     │
                           │   (não periódico, sob demanda)     │
                           └────────────────────────────────────┘
```

### 3.1 Módulo compartilhado `:rayshopee-core` (composite build) 🆕

Em 2026-07-02, a lógica de rede (NetworkConfig, NetworkMonitor, NetworkDiscovery, FallbackUrlInterceptor, NetworkPreferences) foi extraída para um módulo Kotlin/Gradle separado, compartilhado entre os 3 apps RayShopee. Configuração em `settings.gradle.kts`:

```kotlin
includeBuild("../rayshopee-core")
// Referência no build.gradle.kts: implementation("com.rayshopee:core")
```

**Por que composite build (`includeBuild`) em vez de `include` normal?**
- O `:rayshopee-core` tem seu próprio `settings.gradle.kts` que precisa ser carregado para o subprojeto `:core` ficar disponível
- Permite evoluir o core sem publicar versão (cada app aponta pro mesmo diretório)
- Evita duplicação de código entre os 3 apps

**Contrato que `:rayshopee-core` exige de cada app:**
- Cada app **deve** prover um binding de `NetworkPreferences` (o `CoreNetworkModule` NÃO fornece default — decisão para resolver DuplicateBindings do Hilt)
- O ScanEditProduto provê via `AppNetworkModule` (que binda `SharedPrefsNetworkPreferences`)

**O que o ScanEditProduto importa de `:rayshopee-core`:**
- `com.rayshopee.core.network.NetworkConfig` (injetado no Repository e no ViewModel)
- `com.rayshopee.core.network.NetworkMonitor` (injetado no ViewModel)
- `com.rayshopee.core.network.FallbackUrlInterceptor.Factory` (injetado no Repository)
- `com.rayshopee.core.network.NetworkPreferences` (interface, binding via `AppNetworkModule`)

### 3.2 BeepPlayer (`util/BeepPlayer.kt`) 🆕

Singleton injetado via Hilt no ViewModel. Usa `ToneGenerator` (zero footprint no APK, latência ~50ms, sem arquivos de áudio em `res/raw/`).

| Método | Tom | Quando toca |
|---|---|---|
| `playScan()` | TONE_PROP_BEEP (100ms) | Sucesso em `BarcodeScanned` |
| `playEdit()` | TONE_PROP_ACK (250ms) | Sucesso em update OU `OfflineQueuedException` (salvo offline) |
| `playError()` | TONE_PROP_NACK (400ms) | Falha genérica de rede/servidor |

Estado `isMuted: StateFlow<Boolean>` persistido em `SharedPreferences("rayshopee_prefs")` chave `"beep_muted"`. Exposto como `StateFlow` para a UI bindar o toggle da TopBar. ViewModel expõe `toggleMuted()` e `isMuted` direto (passa pelo BeepPlayer).

### 3.3 NetworkMonitor reativo 🆕

Antes (v2.0): polling de 30s via `checkHealthPeriodically()`. Reação a mudança de wifi: até 30s de delay.

Agora (v2.1):
- `NetworkMonitor` (do `:rayshopee-core`) usa `NetworkCallback` do Android — reage em < 1s a mudança de rede do device
- ViewModel observa `networkMonitor.isOnline.collect { ... }`:
  - Device ganha rede → dispara `checkHealth()` IMEDIATO (pra confirmar que servidor responde, não é captive portal)
  - Device perde rede → marca `isOnline = false` IMEDIATO (sem esperar health check)
- `checkHealthPeriodically()` mantido como **backup** com polling de **2min** (era 30s) — só serve pro caso "servidor caiu sem rede cair", que é raro e detecção sub-minuto não é necessária

### 3.4 Protocolo `fromQueue` / `OfflineQueuedException` 🆕

**Problema resolvido (P8):** o `updateX()` da UI e o `updateX()` do `SyncWorker` são o mesmo método. Se o Worker re-tentar e falhar de novo, não pode enfileirar outra vez (loop infinito de duplicação).

**Solução:** flag `fromQueue: Boolean` no contrato de `ProductRepository.updateX()`:
- `fromQueue = false` (UI chamando) → falha de rede = enfileira + agenda Worker + retorna `OfflineQueuedException`
- `fromQueue = true` (Worker re-tentando) → falha de rede = só retorna `Result.failure(cause)`, sem enfileirar

`OfflineQueuedException` é uma exceção de domínio que a UI trata como **soft-state** (warning "salvo offline, vai sincronizar"), NÃO como erro. O bip tocado é o de sucesso (`playEdit`), não o de erro.

---

## 3.8. Auto-descoberta de servidor (Sprint 1.5, v2.2) 🆕

Resolve o problema "subi o server mas o app continua offline". Camadas:

```
┌─────────────────────────────────────────────────────────────────┐
│  candidate URL resolution (NetworkConfig.candidates)            │
│                                                                  │
│  1. userUrls (config manual) — SharedPrefs                       │
│  2. ssidMappings (auto) — SharedPrefs "rayshopee_ssid_mappings"  │
│  3. lanUrl — NetworkDiscovery.scan() (2 fases)                  │
│  4. nsdUrl — NsdDiscovery.discover() (mDNS)                     │
│  5. warpUrl — se CloudflareWARP ativo (172.16.0.2)              │
│  6. cloudflareUrl — fallback final (constants)                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.8.1 NetworkDiscovery (v2 — scan /24 em 2 fases)

```kotlin
// Fase 1 (~500ms, 10 candidatos)
listOf("$subnet.1", "$subnet.2", "$subnet.7", "$subnet.8", "$subnet.9",
       "$subnet.10", "$subnet.50", "$subnet.100", "$subnet.200", "$subnet.254",
       deviceIp)  // próprio IP do device

// Fase 2 (~3-5s, 254 IPs em paralelo) — só roda se Fase 1 falhar
(1..254).map { "$subnet.$it" }.filter { it !in fase1Candidates }
```

- Cache: 5 minutos (TTL configurável)
- Invalida quando `NetworkMonitor.networkChanges` emite (Wi-Fi mudou)
- Probe em `/api/wakeup` (HTTP 200 = achou)

### 3.8.2 SsidMapping (Sprint 1.5)

Resolve: "VivoDM → 192.168.15.8", "Casa-2.4G → 192.168.1.50", etc.

**Localização:** `app/data/prefs/SsidMapping.kt` (app-specific, não no core)

```kotlin
class SsidMapping @Inject constructor(@ApplicationContext context: Context) {
    val mappings: StateFlow<Map<String, String>>  // SSID → URL
    fun save(ssid: String, url: String)
    fun forget(ssid: String)
    fun clearAll()
    fun autoSave(ssid: String?, url: String?)  // idempotente
}
```

**Storage:** `SharedPreferences("rayshopee_ssid_mappings")` (chave = SSID, valor = URL)

**Privacidade:** SSID fica no device, sem telemetria.

**Fluxo:**
1. App abre → `SsidResolver.currentSsid()` retorna o SSID atual (ou null se sem permissão)
2. `NetworkConfig.refreshLan()` acha server via Discovery
3. ViewModel chama `SsidMapping.autoSave(ssid, foundUrl)` (idempotente)
4. Settings dialog mostra a lista de mappings com botão forget

**Permissão:** `SsidResolver` exige `ACCESS_FINE_LOCATION` (Android 8+). UI mostra "Permitir" inline.

### 3.8.3 NsdDiscovery (Sprint 1.5, mDNS / DNS-SD)

Resolve: zero-config discovery — server anuncia por nome, app descobre.

**Server side** (`legacy_v1/server/index.js`):
```javascript
const bonjour = require('bonjour')();
bonjour.publish({
    name: 'rayshopee-local',
    type: 'rayshopee',   // → service type = _rayshopee._tcp.local
    port: 3003,
    txt: { version: '1.0', api: '/api', env: 'development' }
});
```

**App side** (`rayshopee-core/core/network/NsdDiscovery.kt`):
```kotlin
class NsdDiscovery @Inject constructor(@ApplicationContext context: Context) {
    suspend fun discover(timeoutMs: Long = 3000L): String?
    // Usa NsdManager.discoverServices("_rayshopee._tcp.", DNS_SD)
    // Resolve o primeiro serviço encontrado, retorna "http://host:port"
}
```

**Limitação:** mDNS é multicast na LAN local. NÃO atravessa 4G.

### 3.8.4 NetworkConfig observa mudanças de Wi-Fi

```kotlin
init {
    scope.launch { networkMonitor.networkChanges.collect {
        networkDiscovery.invalidateCache()  // limpa cache de IPs
        refreshLan()                         // re-escaneia
    }}
}
```

Resultado: troca de Wi-Fi → app re-descobre server em < 1s (sem precisar abrir app ou clicar em Refresh).

### 3.8.5 WARP detection

Se device tem CloudflareWARP ativo (interface `CloudflareWARP` ou IP `172.16.0.x`), adiciona `http://172.16.0.2:3003` como candidato. Funciona em 4G **se ambos** (PC + celular) estão logados na mesma conta WARP.

---

## 4. Estrutura de arquivos (estado vivo — v2.1, 2026-07-18)

```
apps/ScanEditProduto/
├── prd.md                                       # ✅ ESTE PACK — canônico
├── spec.md                                      # ✅ ESTE PACK — canônico (este)
├── sprint.md                                    # ✅ ESTE PACK — canônico
├── HOLISTIC_REPORT.md                           # ✅ ESTE PACK — canônico
├── README.md                                    # ponto de entrada
├── build.gradle.kts                             # plugins root
├── settings.gradle.kts                          # rootProject + includeBuild("../rayshopee-core")
├── gradle.properties
├── gradle/
│   ├── libs.versions.toml                       # 14 versões, 19 libraries, 4 plugins
│   └── wrapper/
├── gradlew, gradlew.bat
├── local.properties                             # sdk.dir (gitignored)
├── get-ip.ps1                                   # util: pega IP local pro emulador
│
├── app/
│   ├── build.gradle.kts                         # compileSdk 36, minSdk 26, applicationId=com.rayshopee.scanedit
│   │                                             # implementation("com.rayshopee:core") 🆕
│   ├── proguard-rules.pro
│   ├── debug.keystore                           # ⚠️ substituir antes de release
│   ├── schemas/com.rayshopee.app.data.local.AppDatabase/
│   │   ├── 1.json, 2.json, 3.json              # Room schema history
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── java/com/rayshopee/app/
│       │   │   ├── MainActivity.kt              # 22 ln — entry point Hilt
│       │   │   ├── RayShopeeApplication.kt      # 18 ln — @HiltAndroidApp + WorkManager
│       │   │   │
│       │   │   ├── di/
│       │   │   │   ├── RepositoryModule.kt      # 17 ln — @Binds ProductRepository
│       │   │   │   ├── DatabaseModule.kt        # 32 ln — Room + DAO providers
│       │   │   │   └── AppNetworkModule.kt 🆕   # 25 ln — @Binds NetworkPreferences
│       │   │   │
│       │   │   ├── data/
│       │   │   │   ├── model/
│       │   │   │   │   └── Product.kt           # 60 ln — @Serializable DTOs (Product, Variation, Update*Request, ProductSearchResult)
│       │   │   │   ├── local/
│       │   │   │   │   ├── AppDatabase.kt       # 9 ln — @Database(v3)
│       │   │   │   │   ├── ProductEntity.kt     # 48 ln — @Entity + converters
│       │   │   │   │   ├── ProductDao.kt        # 34 ln — CRUD + pendingActions
│       │   │   │   │   └── PendingActionEntity.kt # 15 ln
│       │   │   │   ├── prefs/                                    🆕
│       │   │   │   │   └── SharedPrefsNetworkPreferences.kt     # 70 ln — impl NetworkPreferences (URL em SharedPrefs)
│       │   │   │   ├── repository/
│       │   │   │   │   ├── ProductRepository.kt # 46 ln — interface JVM-pura (+fromQueue flag)
│       │   │   │   │   ├── ProductRepositoryImpl.kt # 432 ln — Retrofit + Room + fila
│       │   │   │   │   └── OfflineQueuedException.kt   🆕       # 18 ln — sinaliza "salvo offline"
│       │   │   │   └── worker/
│       │   │   │       └── SyncWorker.kt        # 51 ln — @HiltWorker (VIVO desde v2.1)
│       │   │   │
│       │   │   └── ui/
│       │   │       ├── screens/
│       │   │       │   ├── ScannerScreen.kt     # 770 ln — Compose UI
│       │   │       │   └── ScannerViewModel.kt  # 556 ln — MVI
│       │   │       ├── theme/
│       │   │       │   └── Theme.kt             # Material3 + dynamic color
│       │   │       └── util/                                       🆕
│       │   │           └── BeepPlayer.kt        # 95 ln — ToneGenerator p/ feedback sonoro
│       │   │
│       │   └── res/
│       │       ├── values/strings.xml (app_name="ScanEditProduto")
│       │       ├── values/themes.xml
│       │       ├── mipmap-xxxhdpi/ic_launcher{,_round}.png
│       │       └── xml/
│       │           ├── network_security_config.xml  # cleartext p/ dev (10.0.2.2, etc)
│       │           ├── backup_rules.xml
│       │           └── data_extraction_rules.xml
│       │
│       ├── test/                                # ❌ NÃO EXISTE (dívida P6) — Sprint 2
│       └── androidTest/                         # ❌ NÃO EXISTE (dívida P6) — Sprint 2
│
├── docs/
│   ├── history/                                 # 9 docs legadas v1 (frozen)
│   ├── legacy/                                  # post-mortems pré-SDD
│   └── architecture/                            # (vazio — reservado)
│
└── .memory/                                     # 8 docs OpenMemory + sqlite (auxiliar, NÃO canônico)
    ├── ARCHITECTURE.md, API_REFERENCE.md, CONTEXT.md, CONTEXT.json
    ├── DECISIONS.md, DEPLOYMENT.md, QUICK_REFERENCE.md, TEST_GUIDE.md
    └── openmemory.sqlite
```

**Métricas de código (vivas, main, snapshot 2026-07-18 v2.2):**
- **22 arquivos `.kt` no app** (era 19 na v2.1) · **~2.700 linhas** (era ~2.357, +15%)
- + **8 arquivos `.kt` no `:rayshopee-core`** (4 novos em v2.2: `SsidResolver`, `NsdDiscovery`, `NetworkDiscovery` v2, `NetworkMonitor` v2)
- Maior arquivo: `ScannerScreen.kt` (~870 ln) > `ScannerViewModel.kt` (~600 ln) > `ProductRepositoryImpl.kt` (~432 ln)
- 0 código morto (apenas `ProductRepositoryImpl.syncPendingActions()` legacy que retorna `true` direto — pode ser removido, é harmless)
- 0 testes (⚠️ P6, scaffold criado)

---

## 5. Modelo de dados

### 5.1 DTOs de transporte (`data/model/Product.kt`)

```kotlin
@Serializable
data class Product(
    val itemId: String = "",          // BigInt do Shopee, trafega como String
    val itemName: String = "",
    val variations: List<ProductVariation> = emptyList(),
    @Transient val isFromCache: Boolean = false,
    @Transient val lastSyncedAt: Long = 0L
)

@Serializable
data class ProductVariation(
    val variationId: String = "",     // = model_id
    val name: String = "",            // "Azul", "M", etc
    val price: Double = 0.0,
    val stock: Int = 0,
    val cost: Double = 0.0,
    val barcode: String = ""
)

/** Resultado de busca ampla por nome/SKU/EAN (NÃO é @Serializable — vem do ProductRepositoryImpl) */
data class ProductSearchResult(        // 🆕 em v2.1
    val itemId: String,
    val modelId: Long,
    val name: String,
    val variation: String,
    val sku: String,
    val price: Double,
    val stock: Int,
    val cost: Double,
    val image: String = ""
)

@Serializable data class UpdatePriceRequest(val itemId: String, val variationId: String, val price: Double)
@Serializable data class UpdateStockRequest(val itemId: String, val variationId: String, val stock: Int)
@Serializable data class UpdateCostRequest(val item_id: String, val model_id: String, val cost: Double)
```

> ⚠️ **Inconsistência de nomenclatura (ainda pendente, P7)**: `UpdatePriceRequest`/`UpdateStockRequest` usam camelCase (`itemId`, `variationId`), mas `UpdateCostRequest` usa snake_case (`item_id`, `model_id`). Bug latente — o backend precisa aceitar as duas chaves, ou o app precisa alinhar. **Resolução:** Sprint 1, T1.5 (auditar backend `legacy_v1/server`, decidir alinhamento).

> **Resposta do backend `searchByName`** (em `ProductRepositoryImpl.kt:50-60`): `ProductSearchListResponse(products: List<ProductSearchItemResponse>)` onde cada item tem `item_id, model_id, name, variation, sku, image, price, stock, cost` — **snake_case aqui vem do backend, é OK**.

### 5.2 Persistência local (Room v3)

```kotlin
@Entity(tableName = "products", /* converter p/ List<ProductVariation> via JSON */)
data class ProductEntity(
    @PrimaryKey val itemId: String,
    val itemName: String,
    val barcode: String?,
    val variations: List<ProductVariation>,  // serializa como JSON
    val lastSyncedAt: Long = 0L
)

@Entity(tableName = "pending_actions")
data class PendingActionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val actionType: String,        // "UPDATE_PRICE" | "UPDATE_STOCK" | "UPDATE_COST"
    val itemId: String,
    val variationId: String,
    val value: Double,             // Double p/ Preço/Custo, Int→Double p/ Estoque
    val createdAt: Long = System.currentTimeMillis()
)
```

> ✅ **Fila offline plugada (P8 resolvido em v2.1):** `ProductRepositoryImpl.updateX()` em falha de rede chama `dao.insertPendingAction(...)` + `WorkManager.enqueue(OneTimeWorkRequestBuilder<SyncWorker>())` + retorna `Result.failure(OfflineQueuedException(cause))`. O `SyncWorker` re-tenta cada pendência via `updateX(fromQueue=true)` (não duplica), remove em sucesso. A UI trata `OfflineQueuedException` como warning "salvo offline, vai sincronizar" (bip ACK) e não como erro.

---

## 6. API contract (REST, contra `legacy_v1/server`)

| Verbo | Path | Body | Response | Status |
|---|---|---|---|---|
| GET | `/api/wakeup` | — | 204 / 200 | ✅ usado (health check) |
| GET | `/api/products/barcode?barcode={code}` | — | `ProductResponse` | ✅ |
| GET | `/api/products/item/{itemId}` | — | `ProductResponse` | ✅ |
| GET | `/api/products/search?q={query}` 🆕 | — | `ProductSearchListResponse` | ✅ (até 100 resultados) |
| POST | `/api/products/update-price` | `UpdatePriceRequest` (camelCase) | `UpdateResponse` | ✅ |
| POST | `/api/products/update-stock` | `UpdateStockRequest` (camelCase) | `UpdateResponse` | ✅ |
| POST | `/api/products/update-cost` | `UpdateCostRequest` (snake_case) | `UpdateResponse` | ✅ (P7 — alinhamento pendente) |

`ProductResponse` no backend deve serializar `item_id`/`model_id` como **String** (não BigInt) — bug histórico documentado em `docs/legacy/scan_edit_produto_doc.md` (Erro 408).

`ProductSearchListResponse` (🆕): `{ products: [{ item_id, model_id, name, variation, sku, image, price, stock, cost }, ...] }` — backend usa ILIKE no Supabase, com fallback pra API da Shopee.

### Headers (ngrok bypass)
- `Bypass-Tunnel-Reminder: true`
- `ngrok-skip-browser-warning: 69420`

### Timeouts
- `connectTimeout = 45s` (cold start Render)
- `readTimeout = 45s`

### Retry policy (interceptor `FallbackUrlInterceptor` do `:rayshopee-core`) 🆕
- **Lista de candidatos** vem de `NetworkConfig.candidates` = `[userUrls (configurável runtime), lanUrl (auto-descoberta), cloudflareUrl (fallback final)]`
- Por URL: até 3 tentativas com backoff 1s → 2s → 4s
- 502/503/504 → tenta de novo; outros HTTP error → quebra o loop
- `UnknownHostException` → quebra (DNS, não adianta tentar)
- Itera candidatos até dar certo (ou acabarem)

### URL configurável em runtime 🆕 (P5 resolvido)
- `SharedPreferences("app_prefs")` chave `"base_url"` → lista CSV de URLs que o usuário setou
- `SharedPrefsNetworkPreferences` (impl de `NetworkPreferences`) lê/escreve
- ViewModel expõe `ScannerIntent.SetUserUrls(List<String>)` → `NetworkConfig.setUserUrls()` → persiste
- UI tem Settings dialog (no TopAppBar) pra editar a lista
- Lista vazia → apaga (volta pra LAN auto + cloudflare)

---

## 7. Segurança e rede

### 7.1 Network security config (`res/xml/network_security_config.xml`)

```
cleartextTrafficPermitted = true (default)
Whitelist de cleartext:
  - 10.0.2.2           (emulador → host)
  - localhost
  - 192.168.15.10
  - 192.168.15.7
```

> ngrok e Render usam TLS — cleartext só para dev local. **OK para debug**, **proibido para release** sem refatoração.

### 7.2 Secrets — auditoria ✅ RESOLVIDA (P9)

Auditoria de 2026-07-04 (v2.1):

```bash
grep -rni "supabase\|api_key\|secret\|token\|password\|credential" apps/ScanEditProduto/app/src/main/java
# Resultado: 1 hit, em ProductRepositoryImpl.kt:56 — COMENTÁRIO ("backend usa ILIKE no Supabase")
# Zero credenciais hardcoded
```

Tudo o que era Supabase migrou pro backend `legacy_v1/server` (que vira `RayHub` no Sprint 3). **Dívida P9 resolvida** — sem necessidade de Android Keystore para credenciais.

### 7.3 Permissões (`AndroidManifest.xml`)

```xml
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

### 7.4 WorkManager init desabilitado

O `InitializationProvider` do `androidx.startup` é sobrescrito para o Hilt controlar (`HiltWorkerFactory`):

```xml
<meta-data android:name="androidx.work.WorkManagerInitializer"
           android:value="androidx.startup"
           tools:node="remove" />
```

---

## 8. Build & deploy

### 8.1 Build local

```bash
cd apps/ScanEditProduto
./gradlew assembleDebug              # → app/build/outputs/apk/debug/app-debug.apk
./gradlew installDebug               # → instala no device/emulator
./gradlew assembleRelease            # ⚠️ sem signing config (usa debug.keystore por fallback)
./gradlew bundleRelease              # AAB para Play Store
```

### 8.2 Assinatura

Hoje: `debug.keystore` commitado (⚠️ **não é segredo** mas é má prática para release). **Sprint 1 T1.3 (pendente):** configurar `release` signing config lendo de `app/keystore.properties` (gitignored), com fallback explícito que falha o build se keystore não estiver configurado.

### 8.3 ProGuard / R8

`isMinifyEnabled = false` em release. R8 desabilitado → APK ~25 MB. **Sprint 1 T1.4 (pendente):** ativar + validar regras para Hilt, Retrofit, kotlinx-serialization, MLKit, CameraX, Room.

### 8.4 CI/CD

**Não existe.** GitHub Actions proposta para Sprint 2:
- `./gradlew assembleDebug` em PR
- `./gradlew testDebugUnitTest` (quando existirem testes)
- `./gradlew lint`

---

## 9. Contratos MVI (ScannerIntent × ScannerUiState) — v2.1

```kotlin
// Estado observável pela UI (12 campos)
data class ScannerUiState(
    val isLoading: Boolean = false,
    val isSearching: Boolean = false,                    // 🆕 busca por nome em andamento
    val product: Product? = null,
    val error: ScannerErrorKind? = null,                 // agora é sealed class tipada
    val warning: String? = null,                         // "⚠️ Sem conexão — dados de 5 min atrás"
                                                         // ou "salvo offline, vai sincronizar"
    val lastScannedBarcode: String? = null,
    val isUpdating: Boolean = false,
    val isOnline: Boolean? = null,                       // null = ainda não checou
    val searchResults: List<ProductSearchResult> = emptyList(),  // 🆕
    val lastSearchQuery: String? = null,                 // 🆕
    val userUrls: List<String> = emptyList(),            // 🆕 (do Settings)
    val candidates: List<String> = listOf(NetworkConfig.DEFAULT_CLOUDFLARE_URL)  // 🆕 resolvido final
)

// Eventos do usuário (11 intents)
sealed interface ScannerIntent {
    data class BarcodeScanned(val barcode: String) : ScannerIntent
    data class ItemIdSearch(val itemId: String) : ScannerIntent
    data class NameSearch(val query: String) : ScannerIntent               // 🆕
    data class OpenFromSearchResult(val itemId: String) : ScannerIntent    // 🆕
    data object ClearSearchResults : ScannerIntent                          // 🆕
    data class UpdatePrice(val variationId: String, val price: Double) : ScannerIntent
    data class UpdateStock(val variationId: String, val stock: Int) : ScannerIntent
    data class UpdateCost(val variationId: String, val cost: Double) : ScannerIntent
    data object ClearError : ScannerIntent
    data object ClearProduct : ScannerIntent
    data class SetUserUrls(val urls: List<String>) : ScannerIntent         // 🆕
}
```

### Invariantes do ViewModel

- `BarcodeScanned` é ignorado se `currentTime - lastScannedTime < 2000ms` (cooldown)
- `BarcodeScanned` é ignorado se `barcode == lastScannedBarcode` (anti-duplicado)
- Toda chamada de rede roda em `viewModelScope.launch` (não bloqueia UI)
- `error` ≠ `null` ⇔ `product == null` (mutuamente exclusivos)
- `warning` é setado em dois casos: (a) `product.isFromCache == true`, (b) update retornou `OfflineQueuedException` (fila pegou, "salvo offline")
- `beepPlayer.playScan()` toca em sucesso de scan; `playEdit()` em sucesso de update OU `OfflineQueuedException`; `playError()` em qualquer outro erro
- Bip silenciado se `BeepPlayer.isMuted.value == true` (persistido em SharedPrefs)
- `candidates` reflete o estado atual de `NetworkConfig` (recomposto dinamicamente conforme `userUrls` muda ou LAN é descoberta)

---

## 10. Riscos técnicos (atualizado v2.1)

| Risco | Prob. | Impacto | Mitigação | Status |
|---|---|---|---|---|
| **R1** `legacy_v1/server` EOL (migração RayHub) | 🟡 Alta | 🔴 Crítico | API isolada em `ProductRepository`; troca = 1 classe | Sprint 3 |
| **R2** Tunnel ngrok cair em demo | 🔴 Certo | 🟠 Médio | URL configurável runtime + auto-LAN + retry + cache Room | ✅ **endurecido em v2.1** |
| **R3** ~~Pending actions não enfileiram (P8)~~ | — | — | — | ✅ **RESOLVIDO** em 2026-07-04 |
| **R4** Sem testes (P6) | 🔴 Certo | 🟠 Médio | Sprint 2: criar suite JVM-pura (parsers, cooldown logic, retry policy) | Sprint 2 |
| **R5** ~~`applicationId` colide com `PedidosEditProduto`~~ | — | — | — | ✅ **RESOLVIDO** (renomeado `com.rayshopee.scanedit`) |
| **R6** Inconsistência camelCase/snake_case no `UpdateCostRequest` (P7) | 🟡 Alta | 🟡 Médio | Auditar backend: aceita ambos? Se não, alinhar. | Sprint 1 T1.5 |
| **R7** ~~Hardcoded URLs + keystore debug (P9)~~ | — | — | — | ✅ URLs OK (P5); keystore ainda pendente (T1.3 Sprint 1) |
| **R8** ~~`applicationId` `com.rayshopee.app` colide~~ | — | — | — | ✅ **RESOLVIDO** (mesmo que R5) |
| **R9** 🆕 Mudança de docs não acompanhar código (D1) | 🔴 Certo (já aconteceu 2x) | 🟠 Médio | Regra: bump de docs no mesmo commit que toca código que aparece em canônicos | Implementar T1.8 (Sprint 1) |
| **R10** 🆕 R8 desabilitado (P10) — APK ~25 MB | 🔴 Certo | 🟢 Baixo | Ativar R8 + regras | Sprint 1 T1.4 |

---

## 11. Onde está cada coisa (mapa rápido)

- **Visão de produto** → `prd.md`
- **Visão técnica completa** → este `spec.md`
- **Próximas iterações** → `sprint.md`
- **Estado vivo do código (dívidas, métricas, fluxo real)** → `HOLISTIC_REPORT.md`
- **Histórico (docs antigas)** → `docs/history/`
- **Contexto IA (auxiliar)** → `.memory/`
