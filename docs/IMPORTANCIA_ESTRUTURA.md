# 📂 RayShopee — Mapa de Importância da Estrutura

> Escala: **10 = crítico / indispensável**, **0 = inútil / pode ser deletado**
> Critério: impacto na funcionalidade do sistema em produção + custo de perda.

---

## 🟥 RAIZ DO PROJETO

| Arquivo / Pasta | Nota | Tipo | Justificativa |
|---|:---:|---|---|
| `RayShopeeAndroid/` | **10** | Pasta | 🚀 **PROJETO PRINCIPAL** — App Android nativo (Kotlin) com scanner, gestão de estoque e precificação. Integração direta Supabase + APIs. |
| `server/` | **8** | Pasta | Backend Node.js (Shopee, Supabase, Google Sheets) — em manutenção/redesign |
| `src/` | **8** | Pasta | Frontend React/Vite — dashboard web (secundário) |
| `EditorProdutoSKU/` | **5** | Pasta | App mobile Expo/TypeScript — legado, migração para RayShopeeAndroid |
| `whatsapp-bot/` | **4** | Pasta | Bot WhatsApp — baixa prioridade |
| `docs/` | **6** | Pasta | Documentação técnica, requisitos e sprints |
| `cloud/` | **3** | Pasta | Código Back4App/Parse Cloud — legado |
| `RayShopeeApp/` | **1** | Pasta | Experimental/backup |
| `rayShopee/` | **1** | Pasta | Redundante — candidato a remoção |

---

## 🟥 server/ — Backend (API Principal)

| Arquivo | Nota | Justificativa |
|---|:---:|---|
| `index.js` | **10** | Lógica central da API REST. |
| `.env` | **10** | Credenciais sensíveis (Secrets). |

---

## 🟥 src/ — Frontend Web (Dashboard)

| Arquivo | Nota | Justificativa |
|---|:---:|---|
| `App.jsx` | **10** | UI principal do gerenciador web. |
| `hooks/useProducts.jsx` | **9** | Gerenciamento de estado e chamadas API. |

---

## 🟥 RayShopeeAndroid/ — PROJETO PRINCIPAL (FOCO 10/10)

**Status:** 🚀 **EM DESENVOLVIMENTO ATIVO** — Prioridade máxima

| Arquivo | Nota | Justificativa |
|---|:---:|---|
| `app/build.gradle.kts` | **10** | Configuração completa: Compose, Hilt, Retrofit, Room, CameraX, MLKit |
| `app/src/main/java/com/rayshopee/app/ui/screens/ScannerScreen.kt` | **10** | Tela principal — scanner, busca, cálculo de margem, atualização de estoque |
| `app/src/main/java/com/rayshopee/app/data/repository/ProductRepositoryImpl.kt` | **10** | Integração **Supabase** (principal) + **Back4App/Shopee API** (secundária) |
| `app/src/main/java/com/rayshopee/app/ui/screens/ScannerViewModel.kt` | **9** | Lógica de estado — busca por barcode, preço, estoque, tratamento de erros |
| `app/src/main/java/com/rayshopee/app/data/model/Product.kt` | **9** | Modelos de domínio — Product, ProductVariation, requests de atualização |
| `app/src/main/java/com/rayshopee/app/di/RepositoryModule.kt` | **8** | Injeção de dependência via Hilt |
| `app/src/main/AndroidManifest.xml` | **8** | Permissões: câmera, internet, network state |

### 🔧 Funcionalidades Implementadas

1. **Scanner de Código de Barras** (CameraX + MLKit)
   - Detecção em tempo real
   - Auto-foco e processamento contínuo

2. **Busca Multi-Fonte** (Prioridade Decrescente)
   - **Supabase** (primária): Busca por SKU → GTIN/EAN → item_id
   - **Back4App/Shopee API** (secundária): `/api/products/*` endpoints
   - Sistema de fallback com retry (3 tentativas, backoff exponencial)

3. **Gestão de Estoque e Preços**
   - `updatePrice(itemId, variationId, price)` → API Shopee
   - `updateStock(itemId, variationId, stock)` → API Shopee
   - Atualização otimista na UI

4. **Cálculo de Rentabilidade**
   - Taxas: 2% transação + 6% governo
   - Comissões escalonadas (7 faixas: 0.25% a 0.08%)
   - Taxa fixa: R$ 4.00 a R$ 46.00
   - Subsídio PIX: 0% a 2% (acima de R$ 80)
   - Margem = (Preço - Custo - Comissão - Impostos)

### 🌐 Integração Back4App/Shopee API

**Status:** 🔧 **EM MANUTENÇÃO** — Endpoints sendo reconfigurados

- **Base URL:** `https://rayshopeeapi-8ivucqzy.b4a.run`
- **Endpoints disponíveis:**
  - `GET /api/wakeup` — health check
  - `GET /api/products/barcode?barcode={}` — busca por código de barras
  - `GET /api/products/item/{itemId}` — busca por item ID
  - `GET /api/products/sku/{modelSku}` — busca por SKU de variação
  - `POST /api/products/update-price` — atualiza preço
  - `POST /api/products/update-stock` — atualiza estoque

**Problema Conhecido:** 
- Back4App/Shopee API pode estar instável (timeout/CORS)
- **Solução implementada:** Supabase como fonte primária (mais estável)
- App funciona 100% via Supabase mesmo sem Back4App

### 📊 Fluxo de Dados

```
ScannerScreen (UI)
    ↓
searchItemById() → Supabase REST (público)
    ↓
parseSupabaseResult() → Extrai variações
    ↓
calculateProfit() → Margem líquida
    ↓
[Opcional] ProductRepository → Back4App/Shopee API
    ↓
updatePrice/updateStock → Persistência
```

### 🎯 Próximos Passos (Prioridade)

1. ✅ **Conectar ScannerViewModel à UI** — Hoje ScannerScreen não usa o ViewModel
2. ✅ **Unificar fontes de dados** — Usar Repository em toda a UI
3. ✅ **Testar Back4App/Shopee API** — Verificar status dos endpoints
4. ✅ **Adicionar cache local (Room)** — Persistência offline
5. ✅ **Migrar lógica de Supabase para Repository** — Clean Architecture

### ⚠️ Observações Críticas

- **API Keys expostas:** `SUPABASE_API_KEY` hardcoded no ScannerScreen.kt
- **Arquitetura híbrida:** Parte usa Clean Arch (Repository/DI), parte procedural na UI
- **Back4App secundário:** Supabase é a fonte primária de dados hoje
- **ViewModel não integrado:** ScannerViewModel implementado mas não usado na ScannerScreen

### 🔄 Relação com Outros Projetos

- **EditorProdutoSKU/** (Expo/TS): Será descontinuado → migração para este app
- **server/** (Node.js): API complementar → este app é standalone via Supabase
- **src/** (Web): Dashboard admin → complementar, não concorrente

### ⚡ Histórico de Limpeza Executada

1.  🗑️ **Deletado:** `mobile-app/` (Removido por ser obsoleto e conter erros).
2.  🔄 **Renomeado:** `RayShopeeMobile` ➡️ `EditorProdutoSKU`.
3.  🧹 **Junk Cleanup:** Removidos arquivos `nul`, arquivos temporários e caches de linter na raiz.

### 🔴 RECOMENDAÇÃO DE MANUTENÇÃO:
Focar todo o desenvolvimento mobile na pasta **`RayShopeeAndroid/`**, pois é o projeto principal (10/10) com arquitetura moderna, suporte completo a Kotlin e integração nativa. O `EditorProdutoSKU/` será descontinuado após migração. O `server/` passa a ser suporte secundário para operações de escrita via API Shopee, enquanto o RayShopeeAndroid atua como cliente principal via Supabase.
