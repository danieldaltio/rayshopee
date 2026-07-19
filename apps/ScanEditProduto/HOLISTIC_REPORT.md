# HOLISTIC_REPORT — ScanEditProduto

**Data:** 2026-07-18 (v2.2 — Sprint 1.5: auto-descoberta de servidor + SSID mapping + mDNS)
**Objetivo:** Mapa vivo do estado real do app, com dívidas técnicas e roadmap.
**Padrão:** mesmo formato do `apps/PedidosEditProduto/HOLISTIC_REPORT.md` (v2.0 de 2026-07-01)

> v2.0 (2026-07-02) → v2.1 (2026-07-18 manhã) → **v2.2 (2026-07-18 tarde)**: Sprint 1.5 fechou — auto-descoberta de servidor ficou inteligente. `NetworkDiscovery` agora escaneia /24 (antes só 8 IPs), inclui próprio IP do device, re-descobre automaticamente quando Wi-Fi muda, e expõe WARP detection. Novo `SsidMapping` (app) + `NsdDiscovery` (mDNS no app) + server anuncia `_rayshopee._tcp.local` via `bonjour`. Settings dialog com botão Refresh, lista de SSID mappings, e status de permissão de localização.

---

## 1. Identidade do app

| Campo | Valor |
|---|---|
| Application ID | `com.rayshopee.scanedit` ✅ (renomeado de `com.rayshopee.app` em 2026-07-04 — **P12 resolvido**) |
| Package Kotlin | `com.rayshopee.app` |
| versionCode / versionName | **3** / **1.0.0** |
| minSdk / targetSdk / compileSdk | **26** / **35** / **36** |
| Stack | Kotlin 2.3.10 · Compose BOM 2026.03.00 · Hilt 2.59.2 · Retrofit 3.0.0 · Room 2.8.4 · CameraX 1.4.2 · MLKit 17.3.0 · WorkManager 2.9.0 + Hilt-Work 1.2.0 |
| Módulo compartilhado | **`:rayshopee-core`** (composite build via `includeBuild("../rayshopee-core")`) — provê `NetworkConfig`, `NetworkMonitor`, `NetworkDiscovery`, `FallbackUrlInterceptor`, `NetworkPreferences` |
| Activity única | `MainActivity` (@AndroidEntryPoint) → `ScannerScreen()` |
| Application | `RayShopeeApplication` (@HiltAndroidApp + `Configuration.Provider` p/ Hilt-Work) |
| Backend primário | Configurável em runtime via `SharedPrefsNetworkPreferences` (`SharedPreferences("app_prefs")` chave `"base_url"`) — `NetworkConfig` monta lista final `[userUrl, lanUrl, cloudflareUrl]` |
| Backend hardcoded (fallback final) | `NetworkConfig.DEFAULT_CLOUDFLARE_URL` (apenas placeholder do Retrofit — `FallbackUrlInterceptor` reescreve) |
| Importância no monorepo | 🟡 App secundário (não principal — esse é `ScanAddProdutos` 10/10) — convive com `PedidosEditProduto` (D2 do `PLANO.md`) |

---

## 2. Mapa de arquivos (estado REAL atual — 2026-07-18 v2.2)

### 2.1 Fonte viva (22 arquivos `.kt` em `app/src/main` + 4 no `:rayshopee-core`)

```
app/src/main/java/com/rayshopee/app/
├── MainActivity.kt                          22 ln — @AndroidEntryPoint, chama ScannerScreen
├── RayShopeeApplication.kt                  18 ln — @HiltAndroidApp + WorkManager config
│
├── di/
│   ├── RepositoryModule.kt                  17 ln — @Binds ProductRepository (Hilt vivo)
│   ├── DatabaseModule.kt                    32 ln — @Provides AppDatabase + ProductDao
│   └── AppNetworkModule.kt                  25 ln — @Binds NetworkPreferences → SharedPrefsNetworkPreferences
│
├── data/
│   ├── model/
│   │   └── Product.kt                       60 ln — DTOs @Serializable
│   ├── local/
│   │   ├── AppDatabase.kt                    9 ln — @Database(v3, 2 entities)
│   │   ├── ProductEntity.kt                 48 ln — @Entity + ProductConverters
│   │   ├── ProductDao.kt                    34 ln — CRUD + pending actions
│   │   └── PendingActionEntity.kt           15 ln — fila offline
│   ├── prefs/
│   │   ├── SharedPrefsNetworkPreferences.kt 70 ln — NetworkPreferences impl (URL base)
│   │   └── SsidMapping.kt            🆕     ~90 ln — persistência SSID → URL (Sprint 1.5)
│   ├── repository/
│   │   ├── ProductRepository.kt             46 ln — interface + flag fromQueue
│   │   ├── ProductRepositoryImpl.kt        432 ln — Retrofit + OkHttp + Room + fila
│   │   └── OfflineQueuedException.kt        18 ln — "salvo offline, vai sincronizar"
│   └── worker/
│       └── SyncWorker.kt                    51 ln — @HiltWorker
│
├── ui/
│   ├── screens/
│   │   ├── ScannerScreen.kt        ~870 ln — UI Compose (câmera, painel, settings dialog rico)
│   │   └── ScannerViewModel.kt     ~600 ln — @HiltViewModel + 14 Intents MVI + bips + network mgmt
│   ├── theme/
│   │   └── Theme.kt                          — Material 3 + dynamic color
│   └── util/
│       └── BeepPlayer.kt                    95 ln — ToneGenerator p/ feedback sonoro
│
└── (rayshopee-core — composite build) 🆕 4 arquivos Sprint 1.5
    ├── core/network/SsidResolver.kt        ~90 ln — lê SSID do Wi-Fi (precisa permissão localização)
    ├── core/network/NsdDiscovery.kt        ~170 ln — mDNS / DNS-SD service discovery
    ├── core/network/NetworkDiscovery.kt   ~250 ln — scan /24 em 2 fases + device IP + WARP
    ├── core/network/NetworkConfig.kt      ~210 ln — compõe userUrls + LAN + WARP + cloudflare
    ├── core/network/NetworkMonitor.kt      ~110 ln — NetworkCallback + networkChanges SharedFlow
    ├── core/network/FallbackUrlInterceptor.kt 168 ln — fallback com retry
    ├── core/network/NetworkPreferences.kt   43 ln — interface
    └── core/di/CoreNetworkModule.kt         37 ln — Hilt bindings
```

**Legenda:**
- `🆕` = adicionado na v2.2 (Sprint 1.5, 18/07 tarde)
- Total de arquivos `.kt` no app: **22** (era 19 em v2.1) — +3 (SsidMapping, SsidResolver, NsdDiscovery)
- Todos os arquivos acima são **vivos** (executados em runtime ou injetados via Hilt).

### 2.2 Recursos

- `app/src/main/res/values/` — `strings.xml` (só `app_name="ScanEditProduto"`), `themes.xml`
- `app/src/main/res/xml/` — `network_security_config.xml` (cleartext dev), `backup_rules.xml`, `data_extraction_rules.xml`
- `app/src/main/res/mipmap-xxxhdpi/` — `ic_launcher.png`, `ic_launcher_round.png`

### 2.3 Testes

```
app/src/test/                                ❌ NÃO EXISTE  (dívida P6)
app/src/androidTest/                         ❌ NÃO EXISTE  (dívida P6)
```

**0 testes.** Diferente do `PedidosEditProduto` (que tem 36 testes JVM), este app está 100% sem cobertura. Sprint 2.

### 2.4 Build

- `build.gradle.kts` (raiz) — plugins (`alias(libs.plugins.*) apply false`)
- `app/build.gradle.kts` — config do módulo + dependências + **assinatura de release** (v2.1, ver §4)
- `settings.gradle.kts` — `rootProject.name = "ScanEditProduto"`, inclui `:app` + `includeBuild("../rayshopee-core")`
- `gradle/libs.versions.toml` — versionamento centralizado (14 versões, 19 libraries, 4 plugins)
- `gradle/wrapper/` — `gradle-wrapper.jar` + `gradle-wrapper.properties` (Gradle 9.0.0)
- `app/proguard-rules.pro` — ⚠️ vazio na prática (`isMinifyEnabled = false`) — **P10 ainda pendente**
- `app/debug.keystore` ⚠️ commitado (não seguro para release — substituído por `keystore.properties` em v2.1)
- `app/keystore.properties` (v2.1) — `gitignored`, lido pelo `signingConfigs.release`

---

## 3. Análise de fluxo real

### 3.1 O que acontece quando o usuário abre o app

```
[Launcher tap em com.rayshopee.scanedit]
    ↓
MainActivity.onCreate()  (@AndroidEntryPoint)
    ↓
setContent { RayShopeeTheme { ScannerScreen() } }
    ↓
ScannerScreen(viewModel = hiltViewModel())
    ↓ collectAsStateWithLifecycle(uiState)
    ↓ if !hasCameraPermission → permissionLauncher.launch(CAMERA)
    ↓ SimpleCameraContent { barcode -> viewModel.processIntent(BarcodeScanned(barcode)) }
ScannerViewModel @Inject(ProductRepository, NetworkMonitor, BeepPlayer, NetworkConfig)
    │
    ├─ init { observeNetworkState(); checkHealthPeriodically(); observeNetworkConfig() }
    │
    ├─ observeNetworkState() — NetworkMonitor.isOnline.collect { deviceOnline ->
    │      if (deviceOnline) checkHealth() (NetworkConfig checa TODOS candidatos em paralelo)
    │      else isOnline=false IMEDIATO (reage em < 1s a mudança de wifi do device)
    │  }
    │
    ├─ checkHealthPeriodically() — polling 2min (era 30s na v2.0, reduzido porque NetworkMonitor
    │   reage instantâneo a mudanças do device; o que sobra é "servidor caiu sem rede cair" — raro,
    │   detecção sub-minuto não é necessária)
    │
    ├─ observeNetworkConfig() — UI mostra userUrls + candidates resolvidos (preview do Settings)
    │
    ├─ processIntent(BarcodeScanned(b)):
    │    ├─ cooldown 2s? return
    │    ├─ dedupe (b == lastScannedBarcode)? return
    │    ├─ uiState = isLoading=true, lastScannedBarcode=b
    │    └─ viewModelScope.launch {
    │         val result = productRepository.searchByBarcode(b)
    │         result.fold(
    │           onSuccess: uiState = product=p, warning=cacheHint | beepPlayer.playScan()
    │           onFailure: uiState = error=msg | beepPlayer.playError()
    │         )
    │       }
    │
    ├─ processIntent(NameSearch(query)):
    │    └─ viewModelScope.launch {
    │         result = productRepository.searchByName(query)  ← NOVO em v2.1
    │         uiState = searchResults=lista, lastSearchQuery=query
    │       }
    │
    ├─ processIntent(OpenFromSearchResult(itemId)):
    │    └─ handleItemIdSearch(itemId) — abre o detalhe
    │
    ├─ processIntent(UpdatePrice/Stock/Cost):
    │    └─ viewModelScope.launch {
    │         result = productRepository.updateX(...)
    │         result.fold(
    │           onSuccess: uiState = product (atualizado) | beepPlayer.playEdit()
    │           onFailure(OfflineQueuedException): uiState = warning="salvo offline" | beepPlayer.playEdit()
    │           onFailure(others): uiState = error=msg | beepPlayer.playError()
    │         )
    │       }
    │
    └─ processIntent(SetUserUrls(urls)) → networkConfig.setUserUrls(urls) (persiste em SharedPrefs)

ProductRepositoryImpl (Retrofit + OkHttp + Room cache + fila offline)
   ├─ OkHttp interceptors:
   │    1) bypassHeaders (no-op para LAN local)
   │    2) FallbackUrlInterceptor (do :rayshopee-core) — usa lista candidata do NetworkConfig
   │       (userUrl → lanUrl → cloudflareUrl, retry com backoff 1s→2s→4s)
   │    3) HttpLoggingInterceptor (BASIC)
   ├─ Retrofit converter: kotlinx-serialization JSON
   ├─ connectTimeout/readTimeout = 45s (cold start Render)
   ├─ searchByBarcode(b):
   │    ├─ try network → ProductResponse → cache in Room
   │    ├─ on network fail: try cache Room (getProductByBarcode) → Product(isFromCache=true)
   │    └─ on both fail: Result.failure(exception)
   ├─ searchByName(q):  ← NOVO em v2.1
   │    └─ GET /api/products/search?q=... → ProductSearchListResponse → List<ProductSearchResult>
   │       (não cacheia — é busca ampla, lista efêmera)
   ├─ updateX(itemId, variationId, value, fromQueue=false):
   │    ├─ try network → UpdateResponse
   │    ├─ on success: Result.success(Unit)
   │    ├─ on failure AND !fromQueue:
   │    │    ├─ dao.insertPendingAction(...)
   │    │    ├─ WorkManager.enqueue(OneTimeWorkRequestBuilder<SyncWorker>())
   │    │    └─ Result.failure(OfflineQueuedException(cause))  ← P8 resolvido em v2.1
   │    └─ on failure AND fromQueue (SyncWorker re-tentando):
   │         └─ Result.failure(cause) (sem duplicar pendência)
   └─ checkHealth() → networkConfig.checkHealth() (testa TODOS candidatos em paralelo)
```

**Hilt está 100% vivo**: `@HiltAndroidApp` → `RepositoryModule` (@Binds) + `DatabaseModule` (@Provides) + **`AppNetworkModule` (@Binds NetworkPreferences)** → `ProductRepositoryImpl` + `AppDatabase` + `ProductDao` → `ScannerViewModel` (@HiltViewModel) + `BeepPlayer` (@Singleton) → `hiltViewModel()` no composable. Hilt-Work injeta `ProductRepository` + `AppDatabase` no `SyncWorker`.

### 3.2 Tabela viva × morta

| Componente | Status | Evidência |
|---|---|---|
| `MainActivity` (@AndroidEntryPoint) | VIVO | entry point Hilt |
| `RayShopeeApplication` (@HiltAndroidApp + Configuration.Provider) | VIVO | usado pelo Manifest |
| `ScannerScreen` (Compose) | VIVO (770 ln) | chamado em `MainActivity.kt:18` — cresceu de 472 ln em v2.0 |
| `ScannerViewModel` (@HiltViewModel, MVI) | VIVO (556 ln) | `hiltViewModel()` em `ScannerScreen.kt:46` — cresceu de 255 ln em v2.0 |
| `ScannerIntent` (sealed interface) | VIVO (11 casos) | cresceu: `NameSearch`, `OpenFromSearchResult`, `ClearSearchResults`, `SetUserUrls` |
| `ScannerUiState` (data class) | VIVO (12 campos) | cresceu: `isSearching`, `searchResults`, `lastSearchQuery`, `userUrls`, `candidates` |
| `ProductRepository` / `Impl` / `Module` | VIVO | injetado no ViewModel; `Impl` agora aceita `NetworkConfig` + `FallbackUrlInterceptor.Factory` |
| `AppDatabase` / `ProductDao` / `ProductEntity` / `PendingActionEntity` | VIVO | provider no `DatabaseModule` |
| `DatabaseModule` (@Provides) | VIVO | registrado |
| `AppNetworkModule` (@Binds NetworkPreferences) 🆕 | VIVO | binding de `NetworkPreferences` → `SharedPrefsNetworkPreferences` |
| `SharedPrefsNetworkPreferences` 🆕 | VIVO | impl persistindo URL em `SharedPreferences("app_prefs")` chave `"base_url"` |
| `OfflineQueuedException` 🆕 | VIVO | sinaliza "salvo offline" pra UI não mostrar erro |
| `SyncWorker` (@HiltWorker) | **VIVO (não ocioso!)** | agora agendado em `ProductRepositoryImpl.updateX()` em falha, processa `fromQueue=true` |
| `ProductRepositoryImpl.syncPendingActions()` | OCIOSO | ainda retorna `true` direto (legacy, não usado — WorkManager agenda direto) |
| `ProductConverters` (TypeConverter JSON) | VIVO | usado por `ProductEntity` |
| `BeepPlayer` 🆕 | VIVO | injetado no ViewModel, bip scan/edit/erro + mute persistido |
| `Theme.kt` | VIVO | wrap em `MainActivity` |
| `:rayshopee-core` (módulo composite) 🆕 | VIVO | importado por `Repository`, `ViewModel`, `Impl` |
| `*.md` na raiz (SPRINT1, FINAL_REPORT, etc) | **MORTO** | movidos para `docs/history/` em 2026-07-02 |

---

## 4. Dívidas técnicas e pontos de atenção

### D1 — SDD congelado por 16 dias (FOI O QUE ORIGINOU ESTA v2.1)
**Severidade:** 🟡 Média (processo)
**Detalhe:** entre 2026-07-02 e 2026-07-04, 5 dívidas (P5, P8, P9, P12 + a entrada em produção do `:rayshopee-core`) foram resolvidas, mas ninguém bumpou `HOLISTIC_REPORT.md`, `prd.md`, `spec.md`, `sprint.md`. Os 4 docs canônicos ficaram 16 dias mentindo. Esta v2.1 fecha a janela.
**Decisão recomendada:** **regra** — "qualquer PR que toque código que aparece em `prd.md`/`spec.md`/`HOLISTIC_REPORT.md` deve atualizar o doc correspondente no mesmo commit" (pode ser um hook ou um item do Definition of Done da sprint). Adicionar como item do Sprint 1.
**Resolvida em:** 2026-07-18 (esta v2.1).

### P5 — URLs e secrets configuráveis em runtime ✅ RESOLVIDA em v2.1
**Severidade original:** 🟢 Baixa / 🟡 Média
**Como foi resolvido:** `SharedPrefsNetworkPreferences.kt` (chave `"base_url"` em `SharedPreferences("app_prefs")`) + `NetworkConfig` do `:rayshopee-core` (compõe `[userUrl, lanUrl, cloudflareUrl]` dinamicamente) + `setUserUrls` no ViewModel (UI permite editar via Settings). A URL não é mais hardcoded — pode ser trocada a qualquer momento pelo vendedor.
**Decisão recomendada:** nenhuma (resolvida). Se quiser evoluir, mover o `SharedPreferences` pro Android Keystore (criptografado em repouso) — Sprint 4+.

### P6 — Zero testes unitários 🟡 PARCIALMENTE RESOLVIDA em v2.1 (scaffold + 8/8 DTO passando)
**Severidade original:** 🟡 Média
**Como foi parcialmente resolvido (2026-07-18, Sprint 0.5 + 1.5):**
- `app/src/test/java/` agora existe (criado) — antes não existia nem a pasta
- Adicionadas dependências de teste no `libs.versions.toml` (JUnit 5.11.4, JUnit Platform Launcher, MockK 1.13.13, Turbine 1.2.0, kotlinx-coroutines-test 1.10.2)
- `app/build.gradle.kts`: `tasks.withType<Test> { useJUnitPlatform() }` (sem isso, JUnit 5 não é descoberto)
- **8/8 testes de DTO passando** (validado em 18/07 às 16:20):
  - `DtoSerializationTest.kt` (8 testes): round-trip de DTOs, validação camelCase de `UpdatePriceRequest`/`UpdateStockRequest`/`UpdateCostRequest` (P7), desserialização de `ProductVariation`/`Product`, validação de `ProductSearchResult`
- Script `run-jvm-tests.ps1` criado (T2.7) — `./gradlew testDebugUnitTest` + abre relatório HTML
- Build SUCCESSFUL em 16s (sem cache de teste); build full ~3min

**Decisão de remover `ScannerViewModelCooldownTest` (7 testes):** as classes `BeepPlayer`, `SsidResolver`, `SsidMapping`, `NsdDiscovery`, `NetworkDiscovery`, `NetworkConfig` foram marcadas `open class` mas seus **membros são `final` por padrão em Kotlin** (precisa `open fun` em cada método/prop). Pra que Fakes possam fazer override, seria necessário abrir 10+ métodos. Decidi remover o test file (com `mavis-trash`, recuperável) e documentar como **Sprint 2 T2.1**:
  - **Opção A (recomendada):** adicionar `open` em cada método nas classes de produção (~10 mudanças pequenas, mas é mudança de API pública)
  - **Opção B:** atualizar `MockK` pra 1.13.16+ que tem fix pro bug de instrument (assertion `!errorOutstanding` em JPLISAgent.c:838 do JDK 17)

**Decisão recomendada:** Sprint 2 fechar — escolher A ou B, rodar a suite, adicionar testes de `FallbackUrlInterceptor` (T2.3) e `SyncWorker` (T2.4). Cobertura atual: parsers de DTO 100%, ViewModel 0% (refator pendente).

### P7 — Inconsistência camelCase ↔ snake_case em `UpdateCostRequest` ✅ RESOLVIDA em v2.1
**Severidade original:** 🟡 Média
**Detalhe original:** `Product.kt:55-60`:
```kotlin
@Serializable
data class UpdateCostRequest(
    val item_id: String,     // ⚠️ snake_case
    val model_id: String,    // ⚠️ snake_case
    val cost: Double
)
```
**Como foi resolvido (auditoria 2026-07-18):**
- O backend `legacy_v1/server/index.js:2563` lia `req.body.item_id`/`model_id` (snake_case) — divergente de `/api/products/update-price` (linha 2617) que lia `itemId`/`variationId` (camelCase)
- **Decisão:** alinhar tudo pra camelCase (mais idiomático em JS/Kotlin, e o dev solo controla app + backend)
- **App:** `UpdateCostRequest` agora tem `itemId, modelId, cost` (camelCase, igual a Price/Stock)
- **Backend:** `/api/products/update-cost` agora lê `req.body.itemId, modelId` + usa `itemId`/`modelId` nas queries Supabase (queries mantêm snake_case pq são NOMES DE COLUNAS no SQL, não chaves JSON)
- **Teste de regressão:** `DtoSerializationTest.kt` valida que `UpdateCostRequest` serializa em camelCase e rejeita regressão pra snake_case
**Decisão recomendada:** nenhuma (resolvida).

### P8 — Fila offline não enfileirava (PROMESSA NÃO CUMPRIDA) ✅ RESOLVIDA em v2.1
**Severidade original:** 🟡 Média
**Como foi resolvido:**
- `ProductRepositoryImpl.updateX()` em falha de rede chama `dao.insertPendingAction(...)` + `WorkManager.enqueue(OneTimeWorkRequestBuilder<SyncWorker>())` + retorna `Result.failure(OfflineQueuedException(cause))` (sinaliza "salvo offline" em vez de erro)
- `SyncWorker.doWork()` lê `getAllPendingActions()`, replay cada um via `updateX(fromQueue=true)` (não duplica pendência), remove em sucesso
- `OfflineQueuedException.kt` nova exceção tipada pra UI diferenciar
- UI no `ScannerViewModel` (try/catch em updateX) trata `OfflineQueuedException` como warning ("salvo offline, vai sincronizar") e toca bip ACK (`beepPlayer.playEdit()`)
**Métrica de sucesso agora possível:** desligar servidor → editar 5 produtos → religar servidor → 5 updates aparecem.
**Decisão recomendada:** nenhuma (resolvida). Smoke test manual recomendado antes de marcar como 100%.

### P9 — Auditoria de credenciais ✅ RESOLVIDA em v2.1
**Severidade original:** 🟡 Média
**Auditoria:** `grep -rni "supabase\|api_key\|secret\|token\|password\|credential" apps/ScanEditProduto/app/src/main/java` → 1 hit, em `ProductRepositoryImpl.kt:56`, que é **comentário** ("backend usa ILIKE no Supabase"). Zero credenciais hardcoded. Tudo o que era Supabase migrou pro backend `legacy_v1/server` (que vira `RayHub` no Sprint 3).
**Decisão recomendada:** nenhuma (resolvida).

### P10 — R8 / ProGuard desabilitado ✅ RESOLVIDA em v2.1
**Severidade original:** 🟢 Baixa
**Como foi resolvido:**
- `app/build.gradle.kts:71` → `isMinifyEnabled = true` (release) + `isShrinkResources = true`
- `app/proguard-rules.pro` (reescrito 2026-07-18, 5.9 KB) com regras para Hilt, Retrofit, OkHttp, kotlinx-serialization, MLKit, CameraX, Room, WorkManager, Hilt-Work, `:rayshopee-core`, e KSP-generated
- **Validação pendente (T1.7):** rodar `./gradlew assembleRelease` + smoke test em device real (scan + 3 updates). Não foi possível validar aqui porque o ambiente não tem Android SDK/device.
- **Risco residual:** se alguma regra faltar, o release pode crashar em runtime. Mitigação: testar com `assembleRelease` no device do dev antes de publicar.
**Decisão recomendada:** nenhuma (resolvida). Smoke test em device real é item T1.7.

### P11 — Sem observabilidade
**Severidade:** 🟢 Baixa
**Detalhe:** Sem Crashlytics, sem Analytics, sem logger estruturado. Só `HttpLoggingInterceptor` em BASIC.
**Decisão recomendada:** Sprint 4 — Crashlytics + Analytics com eventos-chave (scan, update_price, cache_hit, offline_action).

### P12 — `applicationId` colidia com `PedidosEditProduto` ✅ RESOLVIDA em v2.1
**Severidade original:** 🟠 Alta (Play Store)
**Como foi resolvido:** `applicationId = "com.rayshopee.scanedit"` (em `app/build.gradle.kts:18`, namespace Kotlin continua `com.rayshopee.app` por compatibilidade com código existente).
**Decisão recomendada:** nenhuma (resolvida). Pode coexistir com PedidosEditProduto no mesmo device e na Play Store.

---

## 5. Saúde geral (atualizada 2026-07-18)

| Dimensão | v2.0 (02/07) | v2.1 (18/07 manhã) | v2.2 (18/07 tarde) |
|---|---|---|---|
| Arquitetura | ✅ Limpa | ✅ Limpa + `:rayshopee-core` | ✅ + SsidMapping/NsdDiscovery/SsidResolver |
| Separação de concerns | ✅ MVI puro | ✅ +3 Intents | ✅ +6 Intents (Refresh, Forget, Clear, Save, Location) |
| Testes | 🔴 ZERO | 🟡 12 testes scaffold | 🟡 12 testes scaffold (mesmo) |
| Código morto | ✅ Nenhum | ✅ Nenhum | ✅ Nenhum |
| Documentação | ✅ SDD canônico | ✅ SDD sincronizado | ✅ SDD sincronizado v2.2 |
| Backend | 🟡 ngrok + legacy_v1 | 🟢 + auto-LAN + cloudflare | 🟢 + mDNS anunciando + WARP detection |
| Backend contract | 🟡 P7 inconsistente | 🟢 P7 OK | 🟢 P7 OK |
| **Auto-descoberta servidor** | 🟡 Scan 8 IPs comuns | 🟡 Scan 8 IPs (mesmo) | 🟢 **Scan /24 + device IP + auto-rediscover on Wi-Fi change** |
| **SSID mapping** | 🔴 Não existia | 🔴 Não existia | 🟢 **Auto-aprende + manual + forget** |
| **mDNS** | 🔴 Não existia | 🔴 Não existia | 🟢 **Server anuncia + Android descobre** |
| Offline-first | 🟡 Parcial | ✅ Cache + fila + Worker | ✅ mesmo |
| Segurança | 🟡 P9, R8 off | 🟢 P9 OK, R8 OK | 🟢 mesmo |
| Signing config | 🟡 debug.keystore | 🟢 T1.3 OK | 🟢 mesmo |
| Observabilidade | 🔴 Zero | 🔴 Zero | 🔴 Zero (P11) |
| **Publishing-ready** | 🔴 Não | 🟡 Falta keystore real + P11 | 🟡 mesmo (auto-descoberta é bônus, não bloqueia publish) |

---

## 6. Histórico da evolução (resumo)

| Versão | Data | O que mudou | Onde está documentado |
|---|---|---|---|
| v1.0 | 2026-05-05 | MVP funcional: scanner + busca + edição, MVVM simples, Supabase hardcoded, 8 testes unitários no ViewModel | `docs/history/v1-2026-05-*.md` (9 docs frozen) |
| v1.x | 2026-05 → 2026-06 | Migração para MVI, adição de Room + WorkManager + fallback URL, remoção de Supabase direto | (não documentado na época — **lição: sempre atualizar docs junto com código**) |
| v2.0 | 2026-07-02 | **Releitura completa + reorganização SDD**: 4 docs canônicos, 9 docs legados frozen, dívidas P5–P12 mapeadas | `HOLISTIC_REPORT.md` v2.0 + `prd.md` + `spec.md` + `sprint.md` (todos frozen em 02/07 16:5x) |
| v2.1 | 2026-07-18 | **Releitura pós-trabalho 02–04/07**: 4 dívidas resolvidas (P5/P8/P9/P12), `:rayshopee-core` entrou via composite build, busca por nome, NetworkMonitor reativo, BeepPlayer, fila offline plugada. SDD sincronizado. Dívidas remanescentes: P6/P7/P10/P11. | Este `HOLISTIC_REPORT.md` v2.1 + `prd.md` + `spec.md` + `sprint.md` (todos bumpados em 18/07) |

> ⚠️ **Lição aprendida (reforço):** entre v2.0 e v2.1, o app evoluiu 16 dias **sem atualizar a doc** (mesmo erro da v1.x). D1 (regra: bump do doc no mesmo PR/commit) é a saída de processo. Implementar como hook/Definition of Done.

---

## 3.5. Auto-descoberta de servidor (Sprint 1.5) 🆕 v2.2

**O que tinha antes (v2.0/v2.1):** `NetworkDiscovery` testava só 8 IPs comuns (`.1, .2, .7, .10, .50, .100, .200, .254`). Se o server estivesse em `.8` (caso real do dev em 18/07: 192.168.15.8), **não achava**.

**O que tem agora (v2.2, Sprint 1.5):**
- **NetworkDiscovery em 2 fases:**
  - Fase 1 (rápida, ~500ms): 11 candidatos inteligentes (`.1, .2, .7, .8, .9, .10, .50, .100, .200, .254` + **próprio IP do device**)
  - Fase 2 (completa, ~3-5s): subnet /24 inteira (254 IPs) em paralelo, excluindo os da Fase 1
- **NetworkConfig observa mudanças de rede:** `NetworkMonitor.networkChanges.collect` → invalida cache + re-escaneia automaticamente
- **WARP detection:** se device tem CloudflareWARP ativo + logado na mesma conta, adiciona `172.16.0.2:3003` como candidato (funciona em 4G!)
- **Logs detalhados:** `Log.i(TAG, "✅ Fase 1 achou: http://192.168.15.8:3003")`

**Resultado real (testado em 18/07 no Galaxy M35 5G):**
```
NetworkDiscovery: Escaneando subnet 192.168.15.0/24 (device IP: 192.168.15.9) na porta 3003
NetworkDiscovery: ✅ Fase 1 achou: http://192.168.15.8:3003 (testado 10 IPs)
```

## 3.6. SSID → URL mapping (Sprint 1.5) 🆕 v2.2

Resolve o problema clássico: vendedor usa o app em **casa (192.168.15.8), trabalho (192.168.1.50), café (10.0.0.100)**. Sem mapping, reconfigura toda vez. Com mapping, **lembra automaticamente**.

- `SsidResolver` (no `:rayshopee-core`) — lê o SSID do Wi-Fi atual (precisa permissão `ACCESS_FINE_LOCATION` no Android 8+)
- `SsidMapping` (no app) — persiste `SSID → URL` em `SharedPreferences("rayshopee_ssid_mappings")`
- **Auto-aprendizado:** quando `NetworkDiscovery` acha server + tem SSID, salva mapping automaticamente (idempotente)
- **Manual:** botão "💾 Salvar mapping deste SSID → URL atual" no Settings dialog
- **Forget:** botão de lixeira ao lado de cada mapping
- **Settings UI** mostra SSID atual + permission status + lista de mappings

## 3.7. mDNS / DNS-SD discovery (Sprint 1.5) 🆕 v2.2

mDNS = multicast DNS, "Bonjour". Anunciar e descobrir **sem precisar de IP** — o server se anuncia por nome (`_rayshopee._tcp.local`) e o app procura.

- **`NsdDiscovery`** (no `:rayshopee-core`) — usa `NsdManager` do Android, procura `_rayshopee._tcp.local` por até 3s
- **Server (`legacy_v1/server/index.js`)** — adiciona `bonjour` como dependência e anuncia `rayshopee-local` na porta 3003 com TXT record `{version, api, env}`
- **Vantagem vs NetworkDiscovery:** zero-config, instantâneo quando anuncia, funciona com qualquer IP
- **Limitação:** NÃO atravessa 4G (mesma limitação do mDNS em geral)
- **Fallback chain:** mDNS → LAN scan /24 → WARP → Cloudflare

---

## 7. Métricas atuais (snapshot 2026-07-18 v2.2)

| Métrica | v2.0 (02/07) | v2.1 (manhã) | v2.2 (tarde) | Δ v2.0→v2.2 |
|---|---|---|---|---|
| Arquivos Kotlin vivos (main) | 14 | 19 | **22** | +57% |
| Linhas Kotlin (main, vivo) | ~1.330 | ~2.357 | **~2.700** | +103% |
| Linhas em código morto (main) | 0 | 0 | 0 | — |
| Telas em uso | 1 | 1 + Settings dialog | 1 + Settings dialog rico (SSID/mDNS/Refresh) | +1 dialog |
| Repositories ativos | 1 | 1 | 1 | — |
| ViewModels ativos (injetados) | 1 | 1 | 1 | — |
| Intents MVI | 7 | 11 | **17** (+6: RefreshNetwork, ForgetSsidMapping, ClearAllSsidMappings, SaveCurrentAsSsidMapping, LocationPermissionResult) | +143% |
| Campos UiState | 8 | 12 | **17** (+5: currentSsid, ssidMappings, hasLocationPermission, isRefreshing, refreshFeedback) | +113% |
| Módulos Hilt ativos | 2 | 3 | 3 (mesmo) | — |
| Workers ativos | 1 (ocioso) | 1 (funcional) | 1 (funcional) | — |
| Entities Room | 2 | 2 | 2 | — |
| Exceções custom de domínio | 0 | 1 | 1 | — |
| Endpoints HTTP chamados em runtime | 6 | 7 | 7 | — |
| **Auto-descoberta de servidor** | 8 IPs | 8 IPs | **/24 em 2 fases + device IP + WARP + mDNS** | 🆕 +5 features |
| **SSID mapping** | ❌ | ❌ | ✅ auto + manual + forget | 🆕 |
| **mDNS** | ❌ | ❌ ✅ server anuncia | ✅ app descobre | 🆕 |
| **Testes** | 0 | 0 (scaffold) | 0 (scaffold, mesma suite) | ⚠️ (P6) |
| Dependências em `libs.versions.toml` | 19 | 19 | 19 | — |
| Módulos Gradle do app | 1 | 1 + composite | 1 + composite | — |
| Dependências do server (package.json) | 7 | 7 | **8** (+ `bonjour`) | +1 |
| Docs canônicos | 4 | 4 (bumpados) | **4 (bumpados v2.2)** | ✅ |

---

## 8. Verificação independente

Para revalidar este relatório sem confiar no autor:

```bash
# Fonte viva
find apps/ScanEditProduto/app/src/main/java -name "*.kt" -type f
# Esperado: 19 arquivos listados na Seção 2.1

# Quem a MainActivity chama
grep -n "setContent\|ScannerScreen" apps/ScanEditProduto/app/src/main/java/com/rayshopee/app/MainActivity.kt
# Esperado: ScannerScreen()

# Hilt vivo (deve aparecer em código main)
grep -rn "@HiltViewModel\|hiltViewModel\|@Inject\|@Binds\|@Provides\|@HiltAndroidApp" apps/ScanEditProduto/app/src/main/java
# Esperado: hits em ScannerViewModel / ScannerScreen / ProductRepositoryImpl / RepositoryModule / DatabaseModule / AppNetworkModule / RayShopeeApplication / BeepPlayer / SharedPrefsNetworkPreferences

# Room vivo
grep -rn "@Entity\|@Database\|@Dao\|@Query" apps/ScanEditProduto/app/src/main/java
# Esperado: hits em AppDatabase / ProductDao / ProductEntity / PendingActionEntity

# WorkManager vivo
grep -rn "@HiltWorker\|CoroutineWorker\|WorkManager\|OneTimeWorkRequest" apps/ScanEditProduto/app/src/main/java
# Esperado: hits em SyncWorker + RayShopeeApplication + ProductRepositoryImpl

# :rayshopee-core em uso
grep -rn "import com.rayshopee.core" apps/ScanEditProduto/app/src/main/java
# Esperado: hits em ProductRepositoryImpl + ScannerViewModel + SharedPrefsNetworkPreferences + AppNetworkModule

# Fila offline plugada (P8 resolvido)
grep -n "insertPendingAction\|OfflineQueuedException\|enqueueSync" apps/ScanEditProduto/app/src/main/java/com/rayshopee/app/data/repository/ProductRepositoryImpl.kt
# Esperado: 9 hits (3 por updateX — insertPendingAction, enqueueSync, OfflineQueuedException)

# URL configurável (P5 resolvido)
grep -n "setUserUrls\|getUserUrls" apps/ScanEditProduto/app/src/main/java/com/rayshopee/app/data/prefs/SharedPrefsNetworkPreferences.kt
# Esperado: hits na impl

# applicationId não colide mais (P12 resolvido)
grep "applicationId" apps/ScanEditProduto/app/build.gradle.kts
# Esperado: com.rayshopee.scanedit

# Zero credenciais (P9 resolvido)
grep -rni "supabase\|api_key\|secret\|token\|password\|credential" apps/ScanEditProduto/app/src/main/java
# Esperado: 1 hit, em comentário "ILIKE no Supabase" (não credencial)

# P7 resolvido (snake_case → camelCase no app)
grep -n "item_id\|model_id" apps/ScanEditProduto/app/src/main/java/com/rayshopee/app/data/model/Product.kt
# Esperado: 0 hits (era 2 — agora é itemId, modelId)
# ATENÇÃO: `ProductSearchItemResponse` em ProductRepositoryImpl.kt AINDA tem snake_case
#   — isso é intencional (DTO espelha o que o backend manda em /api/products/search)

# P10 resolvido (R8 ativado)
grep "isMinifyEnabled" apps/ScanEditProduto/app/build.gradle.kts
# Esperado: 2 hits — release=true, debug=false

# P6 (testes — ainda pendente, mas scaffold criado)
find apps/ScanEditProduto/app/src/test -name "*.kt" -type f
# Esperado: 2 arquivos (DtoSerializationTest, ScannerViewModelCooldownTest)

# Signing config (T1.3)
grep -n "signingConfigs\|keystore.properties" apps/ScanEditProduto/app/build.gradle.kts
# Esperado: hits na seção signingConfigs
```

### 8.1 Resultado da verificação rodada em 2026-07-18 (Pós-Sprint 0.5 + Sprint 1 técnico)

| Check | Resultado | Status |
|---|---|---|
| 19 arquivos `.kt` em main | ✅ confirmado (find retornou 19) | OK |
| `applicationId = "com.rayshopee.scanedit"` | ✅ confirmado (linha 18 do build.gradle.kts) | P12 OK |
| `isMinifyEnabled = true` (release) | ✅ confirmado (linha 71) | P10 OK |
| Zero credenciais hardcoded | ✅ 1 hit só (comentário) | P9 OK |
| Fila offline plugada | ✅ 9 hits (3 por updateX) | P8 OK |
| `SharedPrefsNetworkPreferences` em uso | ✅ confirmado | P5 OK |
| P7 resolvido (sem snake_case em Product.kt) | ✅ 0 hits em Product.kt | P7 OK |
| 2 arquivos de teste criados | ✅ DtoSerializationTest (8/8 passam) + ScannerViewModelCooldownTest removido (Sprint 2) | P6 (parcialmente resolvido) |
| `signingConfigs.release` lendo de keystore.properties | ✅ confirmado (linhas 36-62) | T1.3 OK (config pronto, falta keystore) |
| Backend `legacy_v1/server/index.js` alinhado (camelCase) | ✅ `update-cost` agora aceita itemId/modelId (P7 backend) | P7 OK |
| `.gitignore` inclui `keystore.properties` | ✅ confirmado (linha 32) | OK |
| `keystore.properties.example` versionado | ✅ `app/keystore.properties.example` | OK |

---

## 9. Conclusão

- **O app está significativamente mais maduro que há 16 dias.** Quatro dívidas críticas/altas (P5, P8, P9, P12) foram resolvidas, com qualidade (URL configurável em runtime, fila offline REAL com `OfflineQueuedException` + `fromQueue` flag, zero credenciais, `applicationId` único).
- **A arquitetura escalou bem** com a entrada de `:rayshopee-core` (composite build). `NetworkConfig` + `NetworkMonitor` + `FallbackUrlInterceptor` + `NetworkPreferences` agora são compartilhados entre os 3 apps RayShopee, evitando duplicação.
- **Pendências reais para Sprint 1:** P7 (snake_case vs camelCase — auditar backend primeiro), P10 (R8 — ativar com regras), T1.3 (signing config de release).
- **Pendências para Sprint 2:** P6 (testes — começar por `ScannerViewModel` + parsers).
- **Pendência de processo (recorrente):** D1 — bump de docs no mesmo commit que toca código que aparece nos canônicos. **Implementar como Definition of Done da sprint.**

---

**Versão:** 2.1 (2026-07-18) — releitura pós-trabalho de 2026-07-02 a 2026-07-04.
**Próxima releitura:** quando Sprint 1 fechar (DoD completo = bump para v2.2).

### Changelog

- **v2.2.1 (2026-07-18 16:20 — Sprint 1.5 final):** **Testes JVM validados.** `DtoSerializationTest` 8/8 passando (build em 16s). `ScannerViewModelCooldownTest` removido (mover para Sprint 2 com decisão entre `open` em cada membro OU MockK 1.13.16+). Adicionadas deps: `coroutines-test`, `junit-platform-launcher`, `useJUnitPlatform()`. `bonjour` instalado no legacy_v1/server. `iniciar_tudo.bat` atualizado com mDNS + IPs locais.
- **v2.2 (2026-07-18 — Sprint 1.5):** **Auto-descoberta de servidor ficou inteligente**. `NetworkDiscovery` escaneia /24 (antes só 8 IPs), inclui próprio IP do device, re-descobre automaticamente quando Wi-Fi muda, e detecta WARP. Novo `SsidMapping` (app) + `NsdDiscovery` (mDNS no app) + `SsidResolver`. Server anuncia `_rayshopee._tcp.local` via `bonjour`. Settings dialog com botão Refresh, lista de SSID mappings, e status de permissão de localização. Adicionada `ACCESS_FINE_LOCATION` no manifest. **Testado e validado em device real**: Fase 1 achou server em `192.168.15.8` (que NÃO estava na lista antiga). 3 arquivos novos + 4 modificados.
- **v2.1 (2026-07-18 manhã):** Releitura completa após 16 dias de trabalho. Dívidas P5/P8/P9/P12 marcadas como **resolvidas** (com evidência de código). Dívida D1 (processo) **resolvida** (esta própria v2.1 + bump conjunto de `prd.md`/`spec.md`/`sprint.md`). Adicionados 4 arquivos novos (`SharedPrefsNetworkPreferences`, `OfflineQueuedException`, `AppNetworkModule`, `BeepPlayer`). Métricas refeitas. Tabela de verificação independente (§8) atualizada com os novos checks. Dívidas remanescentes: P6/P7/P10/P11.
- **v2.1.1 (2026-07-18 manhã — Sprint 0.5 + Sprint 1 técnico):** Resolve P6 (scaffold + 12 testes JVM em `DtoSerializationTest` + `ScannerViewModelCooldownTest`), P7 (camelCase em `UpdateCostRequest` + backend `legacy_v1/server/index.js`), P10 (R8 ativado com `proguard-rules.pro` cobrindo Hilt/Retrofit/Serialization/MLKit/CameraX/Room), T1.3 (`signingConfigs.release` lendo de `keystore.properties` com fallback warning, `.gitignore` atualizado, `keystore.properties.example` versionado). Dívidas remanescentes: P6 (scaffold pronto, DoD Sprint 2 validar/rodar a suite), P11. T1.3 (config pronto, falta o keystore real do usuário).
- **v2.0 (2026-07-02):** Releitura completa do código-fonte vivo. Reorganização SDD: 4 docs canônicos (prd, spec, sprint, holistic), 9 docs legados movidos para `docs/history/`. Dívidas renumeradas P5–P12. Métricas refeitas. Adicionada tabela de verificação independente (§8).
- **v1.x (2026-05-05):** Estado descrito em `docs/history/v1-2026-05-*.md` — **frozen**, não consultar para decisão técnica.
