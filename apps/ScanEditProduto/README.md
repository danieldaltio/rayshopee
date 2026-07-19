# ScanEditProduto — App Android (Scanner + Edição de Produto)

> App Android nativo do ecossistema RayShopee. Scanner de código de barras com edição rápida de preço/estoque/custo, **offline-first** (cache Room + fila de updates), com fallback automático de URL.

**Status:** 🟡 **Secundário** (convive com `ScanAddProdutos` [principal, 10/10] e `PedidosEditProduto` [irmão]).
**Application ID:** `com.rayshopee.app` *(⚠️ colide com `PedidosEditProduto` — renomear antes de publish, ver `sprint.md` Sprint 1)*
**Stack:** Kotlin 2.3.10 · Compose BOM 2026.03.00 · Hilt 2.59.2 · Retrofit 3.0.0 · Room 2.8.4 · CameraX 1.4.2 · MLKit 17.3.0 · WorkManager + Hilt-Work

---

## 📚 Documentação SDD (canônica)

Toda a documentação canônica fica na **raiz deste app** (não em `docs/`). Lê nessa ordem:

| # | Doc | O que tem | Quando ler |
|---|---|---|---|
| 1 | **[`prd.md`](./prd.md)** | Product Requirements — visão de negócio, personas, user stories, escopo, métricas | Entender **o quê** e **por quê** |
| 2 | **[`spec.md`](./spec.md)** | Technical Specification — arquitetura, modelos, API contract, MVI, build | Entender **como** funciona tecnicamente |
| 3 | **[`sprint.md`](./sprint.md)** | Sprint Plan — Roadmap iterativo, dívidas priorizadas | Planejar **o que fazer agora** |
| 4 | **[`HOLISTIC_REPORT.md`](./HOLISTIC_REPORT.md)** | Visão holística do estado vivo + dívidas técnicas (P5–P12) | Auditar **o que está quebrado/faltando** |

> **Política:** Os 4 docs acima são a **verdade única**. Tudo em `docs/history/` é frozen (não atualizar). Tudo em `.memory/` é auto-gerado pelo OpenMemory (cache de contexto, **sempre validar contra canônicos**).

---

## 🚀 Quick start

```bash
# Pré-requisitos
# - JDK 17
# - Android SDK com API 26+ instalado
# - device/emulador com câmera

# Build debug
./gradlew assembleDebug
# → app/build/outputs/apk/debug/app-debug.apk

# Instalar no device
./gradlew installDebug

# Build release (⚠️ sem signing config — usa debug.keystore)
./gradlew assembleRelease

# Limpar build
./gradlew clean
```

> Backend esperado: `legacy_v1/server` (Node.js, porta 3003) acessível via tunnel ngrok. Sem isso, o app **funciona com cache** (dados da última vez que esteve online).

---

## 📁 Estrutura

```
ScanEditProduto/
├── prd.md                       # 📘 SDD — Product Requirements
├── spec.md                      # 📘 SDD — Technical Specification
├── sprint.md                    # 📘 SDD — Sprint Plan
├── HOLISTIC_REPORT.md           # 📘 SDD — Visão holística
├── README.md                    # 📘 este arquivo (entrada)
│
├── build.gradle.kts             # Gradle root
├── settings.gradle.kts
├── gradle/libs.versions.toml    # 14 versões, 19 libraries, 4 plugins
├── gradlew, gradlew.bat
│
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro       # vazio (isMinifyEnabled=false)
│   ├── debug.keystore           # ⚠️ substituir antes de release
│   ├── schemas/.../AppDatabase/ # Room schema history (v1, v2, v3)
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── java/com/rayshopee/app/
│       │   │   ├── MainActivity.kt                    # @AndroidEntryPoint
│       │   │   ├── RayShopeeApplication.kt            # @HiltAndroidApp
│       │   │   ├── di/                                # Hilt modules
│       │   │   ├── data/
│       │   │   │   ├── model/                         # DTOs @Serializable
│       │   │   │   ├── local/                         # Room (AppDatabase, DAOs, entities)
│       │   │   │   ├── repository/                    # ProductRepository (interface + impl)
│       │   │   │   └── worker/                        # SyncWorker (@HiltWorker)
│       │   │   └── ui/screens/                        # Compose (ScannerScreen + ViewModel)
│       │   └── res/                                   # recursos (strings, themes, mipmap, xml)
│       ├── test/                                      # ⚠️ VAZIO (dívida P6)
│       └── androidTest/                               # ⚠️ VAZIO (dívida P6)
│
├── docs/
│   ├── history/                                       # 9 docs legadas v1 (FROZEN)
│   ├── legacy/                                        # post-mortems
│   └── architecture/                                  # (reservado)
│
└── .memory/                                           # 8 docs OpenMemory + sqlite (auxiliar, NÃO canônico)
    ├── QUICK_REFERENCE.md
    ├── CONTEXT.md
    ├── ARCHITECTURE.md
    ├── API_REFERENCE.md
    ├── DECISIONS.md
    ├── DEPLOYMENT.md
    ├── TEST_GUIDE.md
    └── openmemory.sqlite
```

---

## 🎯 Funcionalidades

### O que o app faz

- 📷 **Scanner de código de barras** (CameraX + MLKit) — EAN/UPC/Code-128/QR, cooldown 2s anti-duplicado
- 🔍 **Busca multi-fallback** — barcode → item_id, com cache Room e fallback de URL
- 📊 **Edição rápida** — preço, estoque e custo por variação (cor/tamanho)
- 💾 **Offline-first** — cache local (Room v3) + fila de updates (Worker) [⚠️ fila parcialmente implementada, ver P8 em `HOLISTIC_REPORT.md`]
- 🟢🔴 **Status online/offline** — indicador no TopAppBar, health check a cada 30s
- 🎨 **Material 3 + dynamic color** — UI declarativa em Compose

### O que o app **NÃO** faz (escopo deliberado)

- ❌ Publicar/listar produtos novos → é o `ScanAddProdutos`
- ❌ Gerenciar pedidos → é o `PedidosEditProduto`
- ❌ Dashboard web → é `legacy_v1/web`
- ❌ Emissão de NF-e → é `apps/RayHub`

---

## 🔌 Backend

- **Primário:** `legacy_v1/server` (Node.js + Express, porta 3003) — acessado via tunnel ngrok
- **Endpoints:** ver [`spec.md` §6](./spec.md#6-api-contract-rest-contra-legacy_v1server)
- **Futuro:** migração para `apps/RayHub/apps/api` (NestJS) planejada para Sprint 3

---

## 🐛 Problemas conhecidos

Resumo das dívidas técnicas — detalhes em [`HOLISTIC_REPORT.md` §4](./HOLISTIC_REPORT.md#4-dívidas-técnicas-e-pontos-de-atenção):

| ID | Sev | O quê | Sprint |
|---|---|---|---|
| **P12** | 🟠 Alta | `applicationId` colide com `PedidosEditProduto` (Play Store vai rejeitar) | 1 |
| P8 | 🟡 Média | Fila offline não enfileira updates (PROMESSA NÃO CUMPRIDA no PRD) | 2 |
| P9 | 🟡 Média | Auditoria de credenciais pendente | 1 |
| P7 | 🟡 Média | `UpdateCostRequest` snake_case vs resto camelCase | 1 |
| P6 | 🟡 Média | **Zero testes unitários** | 2 |
| P5 | 🟢 Baixa | URLs hardcoded (deveria vir de BuildConfig) | 1 |
| P10 | 🟢 Baixa | R8/ProGuard desabilitado | 1 |
| P11 | 🟢 Baixa | Sem Crashlytics/Analytics | 4 |

---

## 📖 Onde ler o quê (TL;DR)

- **"O que é o app?"** → [`prd.md`](./prd.md)
- **"Como funciona tecnicamente?"** → [`spec.md`](./spec.md)
- **"O que fazer agora?"** → [`sprint.md`](./sprint.md)
- **"O que está quebrado/faltando?"** → [`HOLISTIC_REPORT.md`](./HOLISTIC_REPORT.md)
- **"Por que as decisões foram tomadas?"** → `.memory/DECISIONS.md` (auxiliar)
- **"O que era antes?"** → `docs/history/v1-2026-05-*.md` (frozen, contexto histórico)

---

## 👤 Owner

- **Projeto:** ScanEditProduto (RayShopee team)
- **Repositório:** `github.com/danieldaltio/rayshopee` (monorepo)
- **Status:** Funcional, em produção com vendedor real, **não pronto para Play Store** (ver P12 + P9 + P10)

---

**Última atualização:** 2026-07-02 (Sprint 0 — reorganização SDD completa)
