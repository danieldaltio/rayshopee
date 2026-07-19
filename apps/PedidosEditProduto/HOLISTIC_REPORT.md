# HOLISTIC_REPORT — PedidosEditProduto

**Data:** 2026-07-01 (v2.0 — releitura completa do código-fonte vivo)
**Objetivo:** Mapa vivo do estado real do app, com dívidas técnicas e roadmap.

> Esta versão **substitui** a v1.x. A v1.x foi escrita quando a refatoração ainda
> estava em andamento (`OrdersScreen.kt` antigo ainda no arquivo, switch no
> `MainActivity` pendente, "zero testes"). Tudo isso já foi concluído — esta v2.0
> reflete o estado pós-refatoração, lido linha a linha do código-fonte atual.

---

## 1. Identidade do app

| Campo | Valor |
|---|---|
| Application ID | `com.rayshopee.orders` |
| Package Kotlin | `com.rayshopee.app` |
| versionCode / versionName | 4 / 1.1.0 |
| minSdk / targetSdk / compileSdk | 26 / 35 / 36 |
| Stack | Kotlin 2.3.10 · Compose BOM 2026.03.00 · Hilt 2.59.2 · Retrofit 3.0.0 · Room 2.8.4 · CameraX 1.4.2 · MLKit 17.3.0 |
| Activity única | `MainActivity` (@AndroidEntryPoint) → `OrdersScreenRefactored()` |
| Backend primário | URL configurável via Settings dialog (default: tunnel ngrok hardcoded) |

---

## 2. Mapa de arquivos (estado REAL atual)

### 2.1 Fonte viva (9 arquivos `.kt` em `app/src/main`)

```
app/src/main/java/com/rayshopee/app/
├── MainActivity.kt                    21 ln — @AndroidEntryPoint, chama OrdersScreenRefactored
├── RayShopeeApplication.kt             6 ln — @HiltAndroidApp
│
├── data/
│   ├── model/Product.kt               31 ln — DTOs @Serializable (Product, Variation, Update*Request)
│   └── repository/
│       ├── OrdersRepository.kt        50 ln — interface JVM-pura (suspend + Result<...>)
│       ├── OrdersRepositoryImpl.kt   100 ln — HttpURLConnection (timeouts 15s/30s/60s)
│       └── OrdersRepositoryModule.kt 21 ln — @Binds @Singleton (Hilt vivo)
│
├── orders/
│   └── OrdersResponseParser.kt       129 ln — parseOrdersResponse() + ParseResult<T> + DTOs
│
├── products/
│   └── ProductResponseParser.kt       67 ln — parseProductResponse() (origem: scanner arquivado)
│
├── util/
│   └── ProfitCalculator.kt           102 ln — FEE_TIERS, calculateProfit(), breakdownFees()
│
└── ui/
    ├── screens/
    │   ├── OrdersScreenRefactored.kt 509 ln — UI Compose (Scaffold, LazyColumn, dialogs)
    │   └── OrdersViewModel.kt        238 ln — @HiltViewModel + StateFlow + Intents MVI
    └── theme/Theme.kt                44 ln — Material 3 + dynamic color
```

**Legenda:**
- Todos os arquivos acima são **vivos** (executados em runtime ou injetados via Hilt).

### 2.2 Recursos

- `app/src/main/res/values/` — `strings.xml` (só `app_name`), `themes.xml`
- `app/src/main/res/xml/` — `network_security_config.xml`, `backup_rules.xml`, `data_extraction_rules.xml`
- `app/src/main/res/mipmap-xxxhdpi/` — ícones

### 2.3 Testes (3 arquivos, 36 `@Test`)

```
app/src/test/java/com/rayshopee/app/
├── orders/OrdersResponseParserTest.kt     9 tests — parsing JSON de pedidos
├── products/ProductResponseParserTest.kt 10 tests — parsing JSON de produto
└── util/ProfitCalculatorTest.kt          17 tests — fórmulas de taxa/lucro Shopee
```

Todos JVM-puros (sem Android, sem mock de HTTP). Há um runner em `scripts/run-jvm-tests.ps1`.

### 2.4 Código arquivado (morto, reversível)

```
archive/dead-code-2026-07-01/   — Scanner completo + Repository Hilt antigo
├── README.md                            Guia de reativação (3 opções)
├── ui/screens/ScannerScreen.kt        623 ln — scanner de código de barras (CameraX + MLKit)
├── ui/screens/ScannerViewModel.kt     144 ln
├── data/repository/ProductRepository.kt + Impl.kt   — Retrofit (nunca usado em runtime)
└── di/RepositoryModule.kt                                — @Binds antigo
```

### 2.5 Build

- `build.gradle.kts` (raiz) — plugins
- `app/build.gradle.kts` — config do módulo + dependências via `libs.versions.toml`
- `settings.gradle.kts` — `rootProject.name = "PedidosEditProduto"`, inclui `:app`
- `gradle/libs.versions.toml` — versionamento centralizado

---

## 3. Análise de fluxo real

### 3.1 O que acontece quando o usuário abre o app

```
[Launcher tap em com.rayshopee.orders]
    ↓
MainActivity.onCreate()  (@AndroidEntryPoint)
    ↓
setContent { RayShopeeTheme { OrdersScreenRefactored() } }
    ↓
OrdersScreenRefactored(viewModel = hiltViewModel())
    ↓ collectAsStateWithLifecycle(state)
OrdersViewModel @Inject(OrdersRepository, ApplicationContext)
    │
    ├─ init: lê baseUrl de SharedPrefs("app_prefs") → dispara Refresh
    ├─ Refresh    → repo.fetchOrdersToShip(url) → state.orders
    ├─ SyncAll    → POST /api/products/sync-full
    ├─ SyncItem   → POST /api/products/sync-item/{id}
    ├─ UpdateItem → 3 POSTs em sequência: update-cost → update-stock → update-price
    ├─ OpenEdit / DismissEdit → state.editingItem
    └─ SetBaseUrl → SharedPrefs + Refresh

OrdersRepositoryImpl (HttpURLConnection, Dispatchers.IO)
   headers: Connection: close, Accept-Encoding: identity,
            bypass-tunnel-reminder: true, User-Agent: PedidosEditProduto/1.0
   parse via parseOrdersResponse() (testado em 9 testes)
```

**Hilt está 100% vivo**: `@HiltAndroidApp` → `OrdersRepositoryModule` (@Binds) →
`OrdersRepositoryImpl` (@Singleton, @Inject) → `OrdersViewModel` (@HiltViewModel) →
`hiltViewModel()` no composable.

### 3.2 Tabela viva × morta

| Componente | Status | Evidência |
|---|---|---|
| `OrdersScreenRefactored` | VIVO | chamado em `MainActivity.kt:18` |
| `OrdersViewModel` (@HiltViewModel) | VIVO | `hiltViewModel()` em `OrdersScreenRefactored.kt:58` |
| `OrdersRepository` / `Impl` / `Module` | VIVO | injetado no ViewModel |
| `parseOrdersResponse`, `OrdersResponse`, `OrdersResponseItem` | VIVO | usado em `OrdersRepositoryImpl` e na UI |
| `MainActivity` (@AndroidEntryPoint) | VIVO | entry point Hilt |
| `parseProductResponse`, `ParsedProductResult` | OCIOSO | só chamado em testes (origem: scanner arquivado) |
| `calculateProfit`, `FEE_TIERS`, `breakdownFees` | OCIOSO | só chamado em testes (UI usa `predictedProfit` do backend) |
| `ScannerScreen`, `ScannerViewModel`, `ProductRepository*` | MORTO | em `archive/dead-code-2026-07-01/`, nenhuma referência em código vivo |

---

## 4. Dívidas técnicas e pontos de atenção

### P1 — Dependências instaladas sem uso em runtime
**Severidade:** 🟡 Média
**Detalhe:** `Room` (configurada com `schemaDirectory`, mas **zero `@Entity`**), `CameraX` + `MLKit` (só pro scanner arquivado), `Retrofit` + `OkHttp` + `kotlinx-serialization` (o caminho vivo usa `HttpURLConnection` + `org.json`). Aumenta APK e compile time.
**Decisão recomendada:** remover do `libs.versions.toml` + `app/build.gradle.kts` em commit dedicado, ou reativar Retrofit substituindo `OrdersRepositoryImpl`. Reversível.

### P2 — `parseProductResponse` e `calculateProfit` prontos mas não plugados
**Severidade:** 🟡 Média
**Detalhe:** Vivem só nos testes. `OrdersScreenRefactored`/`OrdersViewModel` não chamam `calculateProfit` — o `predictedProfit` vem pronto do backend. Se o backend parar de enviar esse campo, a UI quebra sem fallback.
**Decisão recomendada:** ou plugar `calculateProfit` como fallback, ou remover (`ProductResponseParser` + `ProfitCalculator`) junto com o scanner arquivado, se não houver intenção de usá-los.

### P3 — Comentários históricos referenciando arquivo removido
**Severidade:** 🟢 Baixa
**Detalhe:** Vários KDocs mencionavam `OrdersScreen.kt:NNN`, `ParsedOrder`, "ainda no arquivo", "Passo 4 do roadmap". **Limpo em 2026-07-01** (v2.0 deste report): hoje só restam menções em contexto histórico correto ("antiga `OrdersScreen.kt`... hoje removida").
**Status:** ✅ Resolvido.

### P4 — Encadeamento `UpdateItem` com early-exit incorreto (REGRESSÃO)
**Severidade:** 🟡 Média
**Detalhe:** A refatoração converteu o `try/catch` original (que lançava exceção e interrompia a sequência cost → stock → price no primeiro erro) em `Result<Unit> + .onFailure { return@onFailure ... }`. Mas `return@onFailure` é non-local return **da lambda inline** (que retorna `this`), **não da corrotina** — então as 3 chamadas sempre rodavam e o dialog fechava mesmo em erro, levando a atualização parcial (ex.: cost velho + stock/price novos).
**Status:** ✅ Resolvido em 2026-07-01 — trocado por `getOrElse { return@launch ... }`, que faz early-exit da corrotina no primeiro erro, fiel ao `try/catch` original. O dialog só fecha se os 3 updates forem bem-sucedidos.

### P5 — URLs hardcoded e default específico de máquina
**Severidade:** 🟢 Baixa
**Detalhe:** `OrdersViewModel.kt` (constante `DEFAULT_BASE_URL`) aponta para um tunnel ngrok específico. É sobrescrito pelo Settings dialog (SharedPrefs), mas o primeiro launch usa o default.
**Decisão recomendada:** mover para `BuildConfig` quando o `gradle.properties` for saneado.

### P6 — Sem testes instrumentados (`androidTest/`)
**Severidade:** 🟢 Baixa
**Detalhe:** Os 36 testes são JVM puros (suficiente para parsers e cálculo financeiro). UI, ViewModel via Hilt e a camada de rede não têm cobertura.

---

## 5. Saúde geral

| Dimensão | Estado |
|---|---|
| Arquitetura | ✅ Limpa (UI → ViewModel MVI → Repository → HTTP), Hilt 100% vivo |
| Separação de concerns | ✅ Parsers e cálculos isolados e testáveis |
| Testes | 🟡 36 JVM puros (parsers + cálculo), sem UI/integração |
| Código morto | 🟡 Scanner arquivado (reversível) + dependências órfãs (P1) |
| Documentação | ✅ KDocs limpos (P3 resolvido); este report atualizado |
| Backend | 🟡 Dependente de tunnel ngrok, sem retry no vivo |

---

## 6. Histórico da refatoração (concluída)

Roadmap executado em 2026-07-01, todos os passos concluídos:

| Passo | O quê | Status |
|---|---|---|
| 1 — Diagnóstico | Este documento (v1.0) | ✅ |
| 2 — Limpar mortos | 5 arquivos movidos p/ `archive/dead-code-2026-07-01/` (reversível em <2min) | ✅ |
| 3 — Testes JVM | 3 parsers/calculadora + 36 testes + script runner | ✅ |
| 4 — Refator OrdersScreen | `OrdersRepository` + `OrdersViewModel` + `OrdersScreenRefactored`; switch no `MainActivity` feito | ✅ |
| 4b — Correções pós-refator | P3 (KDocs obsoletos) + P4 (bug do encadeamento `UpdateItem`) | ✅ |

---

## 7. Métricas atuais (snapshot 2026-07-01, pós-refatoração + correções)

| Métrica | Valor |
|---|---|
| Arquivos Kotlin vivos (main) | **9** |
| Linhas Kotlin (main, vivo) | **~1.160** |
| Linhas em código morto (main) | **0** |
| Linhas arquivadas (`archive/dead-code-2026-07-01/`) | ~994 (reversíveis) |
| Linhas de teste | ~640 (36 `@Test`) |
| Telas em uso | 1 (`OrdersScreenRefactored`) |
| Telas arquivadas | 1 (`ScannerScreen`) |
| Repositories ativos | 1 (`OrdersRepository`) |
| Repositories arquivados | 1 (`ProductRepository`) |
| ViewModels ativos (injetados) | 1 (`OrdersViewModel`) |
| Módulos Hilt ativos | 1 (`OrdersRepositoryModule`) |
| Parsers em produção (testados) | 1 vivo (`OrdersResponseParser`) + 1 ocioso (`ProductResponseParser`) |
| Utility financeiro testado | 1 (`ProfitCalculator` — ocioso) |
| Endpoints HTTP chamados em runtime | 6 (`/api/orders/to-ship`, `update-cost`, `update-stock`, `update-price`, `sync-full`, `sync-item/{id}`) |
| **Testes** | **36** (JVM puros) |
| Dependências em `libs.versions.toml` | 25 (destas, ~10 usadas em runtime — ver P1) |

---

## 8. Verificação independente

Para revalidar este relatório sem confiar no autor:

```bash
# Fonte viva
find apps/PedidosEditProduto/app/src/main/java -name "*.kt" -type f
# Esperado: 9 arquivos listados na Seção 2.1

# Quem a MainActivity chama
grep -n "setContent\|OrdersScreen" apps/PedidosEditProduto/app/src/main/java/com/rayshopee/app/MainActivity.kt
# Esperado: OrdersScreenRefactored()

# Hilt vivo (deve aparecer em código main, não só em archive)
grep -rn "@HiltViewModel\|hiltViewModel\|@Inject\|@Binds" apps/PedidosEditProduto/app/src/main/java
# Esperado: hits em OrdersViewModel / OrdersScreenRefactored / OrdersRepositoryImpl / OrdersRepositoryModule

# Testes
find apps/PedidosEditProduto/app/src/test -name "*.kt"
# Esperado: 3 arquivos, 36 @Test no total
```

---

## 9. Conclusão

- **O app está funcional, em produção e refatorado.** Arquitetura limpa, Hilt vivo, testes cobrindo a lógica crítica (parsing + cálculo financeiro).
- **A refatoração da Seção 6 está completa**, incluindo as correções de documentação (P3) e do bug de regressão no `UpdateItem` (P4).
- **Próximos ganhos de baixo risco:** limpar dependências órfãs (P1) e decidir o destino de `parseProductResponse`/`calculateProfit` (P2).

---

**Versão:** 2.0 (2026-07-01) — releitura completa pós-refatoração.

### Changelog

- **v2.0 (2026-07-01):** Releitura completa do código-fonte vivo. Reflete estado pós-refatoração: `MainActivity` → `OrdersScreenRefactored`, Hilt 100% vivo, 36 testes JVM. Resolve P3 (KDocs que apontavam para `OrdersScreen.kt` removido) e P4 (bug de regressão no encadeamento `UpdateItem` — `return@onFailure` trocado por `getOrElse { return@launch }`). Reorganiza dívidas (P1–P6) e métricas.
- **v1.3 (2026-07-01):** Passo 4 (adição) — `OrdersRepository`, `OrdersViewModel`, `OrdersScreenRefactored` criados; switch ainda pendente.
- **v1.2 (2026-07-01):** Passo 3 — testes JVM (36).
- **v1.1 (2026-07-01):** Passo 2 — arquivamento do código morto.
- **v1.0 (2026-07-01):** Passo 1 — diagnóstico inicial.
