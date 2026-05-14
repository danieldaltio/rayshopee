# 📊 VISÃO HOLÍSTICA - RayShopee Project Overview

## Última Atualização: 2026-05-13

---

## 🎯 PROJETOS NO ECOSSISTEMA

| Projeto | Tipo | Status | Descrição |
|---------|------|--------|-----------|
| **ShopeeLister** | Android App | ✅ Ativo | Scanner + Publicação produtos Shopee |
| **android-orders** | Android App | ✅ Estável | Gerenciamento de pedidos |
| **android-scanner** | Android App | ✅ Estável | Scanner standalone |
| **raycast-extension** | Extension | 🔄 Dev | Extensão Raycast (WIP) |
| **whatsapp-bot** | Bot | 🔄 Dev | Bot WhatsApp |
| **web** | Web Dashboard | ✅ Ativo | Dashboard React |
| **server** | Backend | ✅ Ativo | API Node.js |

---

## 🔗 ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIO                               │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         ▼                 ▼                 ▼               │
│    ┌─────────┐      ┌─────────┐      ┌─────────┐           │
│    │ Shopee  │      │  Web    │      │ Android │           │
│    │Lister   │      │Dashboard│      │  Apps   │           │
│    └────┬────┘      └────┬────┘      └────┬────┘           │
│         │                │                │                │
└─────────┼────────────────┼────────────────┼────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVER (Node.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Products │  │  Orders  │  │  Scrape  │   │
│  │  & Token │  │   API    │  │   API    │  │  Service │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         ▼                 ▼                 ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Shopee    │  │  Supabase   │  │    Groq     │        │
│  │   Open      │  │  Database   │  │     AI      │        │
│  │   Platform  │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 SHOPEELISTER - APP ANDROID

### Stack Tecnológico
| Componente | Tecnologia |
|------------|------------|
| Linguagem | Kotlin |
| UI | Jetpack Compose |
| Arquitetura | Clean Architecture |
| DI | Hilt |
| Network | Retrofit + OkHttp |
| Serialização | Moshi (KSP) |
| Scanner | CameraX + ML Kit |
| Local Storage | DataStore Preferences |
| Build | Gradle Kotlin DSL |
| compileSdk | 35 (Android 16) |

### Estrutura de Pastas
```
ShopeeLister/app/src/main/java/com/shopeelister/
├── data/
│   ├── local/
│   │   └── ConfigStore.kt          # Preferences (tokens, logística)
│   ├── remote/shopee/
│   │   ├── ShopeeApiService.kt     # Retrofit interface
│   │   ├── ShopeeAuthInterceptor.kt # HMAC-SHA256 auth
│   │   └── ShopeeModels.kt         # Moshi data classes
│   └── repository/
│       └── ShopeeRepositoryImpl.kt # Implementação repository
├── domain/
│   ├── model/                       # Domain models
│   └── repository/                  # Repository interfaces
├── di/
│   └── AppModule.kt                # Hilt dependency injection
├── ui/
│   ├── scanner/                    # Scanner screen (câmera)
│   ├── editor/                     # Editor de produto
│   ├── settings/                   # Configurações
│   └── theme/                      # Cores, Tipografia
└── util/
    └── Constants.kt               # Endpoints, constantes
```

### Funcionalidades Implementadas

#### 1. Scanner de Código de Barras ✅
- CameraX para preview da câmera
- ML Kit para reconhecimento de EAN/GTIN
- Feedback visual (vibração + som)

#### 2. Busca de Produto (Scraper) ✅
- Integração com `scraper_service.py` (server-side)
- Usa DuckDuckGo Lite para buscar marketplaces
- Prioriza Shopee, Mercado Livre, Amazon
- Extrai título, preço, descrição

#### 3. IA Groq para Descrições ✅
- Gera títulos e descrições profissionais
- Usa modelo Llama 3.3 70B
- Prompt otimizado para e-commerce

#### 4. Remoção de Fundo ✅
- Integração nativa com Cloudinary SDK (Upload Assinado)
- Usa inteligência artificial (e_background_removal)
- Processamento assíncrono com auto-retry no app

#### 5. Edição de Produto ✅
- Campos editáveis: título, descrição, preço, estoque
- Seleção de categoria
- SKU automático
- Preview da imagem

#### 6. Seleção de Logística ✅
- Configuração nas Settings
- Canais: Normal Delivery, Shopee Express, Pick-up
- Fallback automático se API falhar

#### 7. Publicação na Shopee ✅
- Upload de imagem
- Criação de produto (variations support)
- Update de preço/estoque

### Configurações nas Settings
```
⚙️ Configurações
├── Linkar Loja (OAuth)
│   └── Abre navegador para autorização
├── Código de Autorização (manual)
├── Partner ID (readonly)
├── Partner Key (readonly)
├── Access Token (readonly)
├── Métodos de Envio
│   ├── ☑ Normal Delivery (100006)
│   ├── ☑ Shopee Express (100005)
│   └── ☐ Pick-up at Store (100007)
└── Remoção de Fundo
    └── ☑ Ativar remoção automática
```

---

## 🖥️ SERVER (BACKEND NODE.JS)

### Stack Tecnológico
| Componente | Tecnologia |
|------------|------------|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | HMAC-SHA256 |
| SSL | selfsigned (auto-gerado) |
| HTTP Client | fetch (native) |

### Portas e Endpoints

#### HTTP Server (Porta 3003)
```
GET  /                          # Health check
GET  /api/health                # Status completo
GET  /api/wakeup                # Prevent cold start
GET  /api/config                # Export config para app
```

#### Auth Endpoints
```
GET  /api/auth/url              # Gera URL OAuth Shopee
GET  /api/auth/callback        # OAuth callback (Shopee redirect)
POST /api/auth/refresh          # Refresh token manual
```

#### Products Endpoints
```
GET  /api/products              # Lista produtos (paginado)
GET  /api/products/search       # Busca por SKU/nome
GET  /api/products/barcode      # Busca por EAN/GTIN
GET  /api/products/item/:id     # Detalhes de item específico
POST /api/products/sync-full    # Sync completo (Shopee → Supabase)
POST /api/products/sync-item/:id # Sync item único
POST /api/products/sync-skus    # Sync SKUs
POST /api/products/sync-ean     # Sync com EAN/GTIN
POST /api/products/update-cost  # Atualiza custo (Supabase)
POST /api/products/update-price # Atualiza preço (Shopee)
POST /api/products/update-stock # Atualiza estoque (Shopee)
POST /api/products/bulk-update  # Bulk update (preço + estoque)
```

#### Orders Endpoints
```
GET  /api/orders/to-ship        # Pedidos prontos para envio
```

#### Scrape Endpoint
```
GET  /api/scrape?query=X&ean=X  # Scraper de produto
```

### Token Management
```javascript
// Estrutura de tokens
accessToken = process.env.SHOPEE_ACCESS_TOKEN
refreshToken = process.env.SHOPEE_REFRESH_TOKEN
tokenExpiresAt = Date.now() + 4 * 60 * 60 * 1000  // 4 horas

// Auto-refresh logic
async function ensureValidToken() {
  if (Date.now() > tokenExpiresAt - 5 * 60 * 1000) {
    return await refreshAccessToken()
  }
  return true
}

// Refresh endpoint
async function refreshAccessToken() {
  // POST /api/v2/auth/access_token/get
  // Usa refresh_token para obter novo access_token
  // Persiste em .env
}
```

### Fee Calculation (Orders)
```javascript
const TAXA_TRANSACAO = 0.02    // 2%
const IMPOSTO_GOVERNO = 0.06    // 6%

const FEE_TIERS = [
  { minPrice: 0.0,   commission: 0.25, fixedFee: 4.00,  pixSubsidy: 0.00 },
  { minPrice: 12.0,  commission: 0.20, fixedFee: 4.00,  pixSubsidy: 0.00 },
  { minPrice: 80.0,  commission: 0.14, fixedFee: 16.00, pixSubsidy: 0.01 },
  { minPrice: 100.0, commission: 0.14, fixedFee: 16.00, pixSubsidy: 0.01 },
  { minPrice: 150.0, commission: 0.12, fixedFee: 22.00, pixSubsidy: 0.01 },
  { minPrice: 300.0, commission: 0.10, fixedFee: 36.00, pixSubsidy: 0.02 },
  { minPrice: 500.0, commission: 0.08, fixedFee: 46.00, pixSubsidy: 0.02 },
]

function calculateItemProfit(price, cost) {
  const tier = FEE_TIERS.find(t => price >= t.minPrice)
  const commission = price * tier.commission
  const fixedFee = tier.fixedFee
  const pixSubsidy = price * tier.pixSubsidy
  const transacao = price * TAXA_TRANSACAO
  const taxaShopee = commission + fixedFee + transacao - pixSubsidy
  const imposto = price * IMPOSTO_GOVERNO
  return price - cost - taxaShopee - imposto
}
```

---

## 🌐 WEB DASHBOARD

### Stack Tecnológico
| Componente | Tecnologia |
|------------|------------|
| Framework | React 18 |
| Build | Vite 5.4 |
| Styling | CSS custom |
| Scanner | html5-qrcode |
| State | React hooks |

### Features
- ✅ Lista produtos com tabela (paginação)
- ✅ Edição inline (preço/estoque)
- ✅ Seleção múltipla para bulk updates
- ✅ Busca por nome/variação/SKU
- ✅ Scanner código de barras (câmera)
- ✅ Configuração de taxas (cálculo lucro)
- ✅ OAuth Shopee integration
- ✅ Feedback visual (toasts)

### Estrutura de Componentes
```
web/src/
├── App.jsx                 # Componente principal
├── main.jsx               # Entry point
├── index.css              # Estilos globais
├── components/
│   ├── ProductTable.jsx   # Tabela de produtos
│   ├── ScannerModal.jsx   # Modal scanner
│   └── EditableCell.jsx   # Célula editável
├── hooks/
│   └── useProducts.jsx    # Hook com estado + API
└── utils/
    └── profitCalc.js      # Cálculos de lucro
```

### Scripts npm
```json
"start": "node server/index.js"
"dev": "concurrently server + vite + ngrok"
"tunnel": "ngrok http 3003"
```

---

## 🔌 SCRAPER SERVICE (scraper_service.py)

### Fluxo
```
1. Recebe query (EAN ou nome)
2. Busca DuckDuckGo Lite por marketplaces
3. Extrai links de Shopee, ML, Amazon
4. Tenta scraping em ordem de prioridade
5. Extrai título, preço, descrição
6. Fallback: busca em snippets DDG
```

### Prioridade de Selectors (Preço)
```python
price_selectors = [
    '.ui-pdp-price__part .andes-money-amount__fraction',  # ML Product
    '.a-price-whole',                                      # Amazon
    '[itemprop="price"]::attr(content)',                   # Schema.org
    '.shopee-product-notification__price::text',           # Shopee
    '.ui-search-price__part .andes-money-amount__fraction', # ML Search
    '.price-tag-fraction::text',
    '.a-offscreen::text',
]
```

---

## 🗄️ SUPABASE DATABASE

### Tabela: products
```sql
CREATE TABLE products (
  item_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  name TEXT,
  variation_name TEXT,
  sku TEXT,
  GTIN_EAN_BarCode TEXT,
  shopee_price NUMERIC,
  shopee_stock INTEGER,
  cost NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (item_id, model_id)
);

-- OnConflict target para upserts
ON CONFLICT (item_id, model_id) DO UPDATE;
```

### Campos
| Campo | Tipo | Descrição |
|-------|------|-----------|
| item_id | TEXT | ID do produto na Shopee |
| model_id | TEXT | ID da variação (0 = sem variação) |
| name | TEXT | Nome do produto |
| variation_name | TEXT | Nome da variação |
| sku | TEXT | SKU (pode conter EAN) |
| GTIN_EAN_BarCode | TEXT | Código de barras EAN |
| shopee_price | NUMERIC | Preço atual na Shopee |
| shopee_stock | INTEGER | Estoque atual na Shopee |
| cost | NUMERIC | Custo do produto |
| is_active | BOOLEAN | Se está ativo |
| last_sync | TIMESTAMP | Última sincronização |

---

## 🔑 CREDENCIAIS E CONFIGURAÇÃO

### .env (Raiz do Projeto)
```env
# Shopee Open Platform (LIVE)
SHOPEE_PARTNER_ID=2033681
SHOPEE_PARTNER_KEY=shpk4a6252796a70685050567067776267416d6168655744716772694f4c794c
SHOPEE_SHOP_ID=263124677
SHOPEE_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9.CJGQfBABGMXtu30gASilo4nQBjDA38_gAzgBQAFICQ.eqZnjm_1OwRwnG6d-dmmnZbA_eViVSVDwyzezSTKavY
SHOPEE_REFRESH_TOKEN=eyJhbGciOiJIUzI1NiJ9.CJGQfBABGMXtu30gAiilo4nQBjDgxsCpBzgBQAFICQ.hYleTxaqtaBTWEXllTsuSCfPIO6__MmQTJpNPzNOfA8
SHOPEE_API_URL=https://partner.shopeemobile.com

# Server
PORT=3003
HTTPS_PORT=443

# AI
GROQ_API_KEY=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

# Database
SUPABASE_URL=https://xcvazbfjkiddzlxwynni.supabase.co
SUPABASE_KEY=sb_publishable_RTWk8m9hY8S6KAhFBCY3rw_d9Kw3-Fw
```

### gradle.properties (ShopeeLister)
```properties
SHOPEE_PARTNER_ID=2033681
SHOPEE_PARTNER_KEY=shpk4a6252796a70685050567067776267416d6168655744716772694f4c794c
SHOPEE_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9.CJGQfBABGMXtu30gASilo4nQBjDA38_gAzgBQAFICQ.eqZnjm_1OwRwnG6d-dmmnZbA_eViVSVDwyzezSTKavY
SHOPEE_REFRESH_TOKEN=eyJhbGciOiJIUzI1NiJ9.CJGQfBABGMXtu30gAiilo4nQBjDgxsCpBzgBQAFICQ.hYleTxaqtaBTWEXllTsuSCfPIO6__MmQTJpNPzNOfA8
SHOPEE_SHOP_ID=263124677
GROQ_API_KEY=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
CLOUDINARY_CLOUD_NAME=dcudjmopb
CLOUDINARY_API_KEY=155269687562979
CLOUDINARY_API_SECRET=2cY-BoGl30u2DruWAsBthZuePlE
```

---

## 📦 OUTROS APPS

### android-orders
- Gerenciamento de pedidos
- Lista pedidos prontos para envio
- Cálculo de lucro por pedido
- Sync com Supabase

### android-scanner
- Scanner standalone
- Leitura de código de barras
- Busca produto por EAN

### raycast-extension
- Extensão Raycast (macOS)
- Busca rápida de produtos
- WIP

### whatsapp-bot
- Bot WhatsApp (Baileys)
- Notificações de pedidos
- WIP

---

## ⚠️ STATUS E PROBLEMAS

### Funcionando ✅
- Scanner código de barras
- Scraping de produtos
- IA Groq para descrição
- Remoção de fundo
- Edição de produto
- Seleção de logística
- Dashboard web
- Sync Supabase
- Token refresh automático

### Problemas Conhecidos ⚠️

1. **OAuth Callback HTTPS desabilitado**
   - Causa: Não há domínio configurado
   - Solução: Configurar HTTPS com domínio válido

2. **Token pode expirar durante uso**
   - Causa: Shopee token expira em ~4h
   - Solução: Auto-refresh no server, reautorizar se necessário

3. **Porta 443 não configurada**
   - Causa: HTTPS callback requer porta 443
   - Solução: Usar ngrok ou configurar Cloudflare Tunnel

---

## 🐛 BUGS CORRIGIDOS

1. ✅ Moshi KSP - Classes duplicadas
2. ✅ condition/item_status - String → Int
3. ✅ Logística - Fallback para canais padrão
4. ✅ Android 16 - backup_rules.xml e data_extraction_rules.xml
5. ✅ compileSdk 35 - Compatibilidade Android 16
6. ✅ SSL auto-gerado para callback OAuth

---

## 📝 COMANDOS ÚTEIS

```bash
# Server
npm start                              # Iniciar server
curl http://localhost:3003/api/health  # Health check
node server/index.js                   # Executar direto

# Ngrok
npx ngrok http 3003 --domain unpaining-transcriptionally-patrick.ngrok-free.dev

# Android
cd ShopeeLister && ./gradlew assembleDebug    # Build APK
adb install -r app/build/outputs/apk/debug/app-debug.apk  # Install
adb logcat -s ShopeeRepo:V ShopeeAuth:V       # Logs
adb shell pm clear com.shopeelister            # Limpar dados

# Supabase
node sync-supabase.js                        # Sync manual
```

---

## 📚 DOCUMENTAÇÃO

| Arquivo | Descrição |
|---------|-----------|
| `docs/SHOPEE_LISTER_PROGRESS.md` | Progresso completo do app |
| `docs/FINAL_SUMMARY.md` | Instalação APK Android 16 |
| `docs/PROGRESS_2026-05-11.md` | Resumo do dia |
| `docs/BUILD_REPORT.md` | Relatório de build |
| `docs/OPENMEMORY_INTEGRATION.md` | Integração OpenMemory |
| `docs/DEPLOYMENT_HANDBOOK_V3.md` | Manual de deploy |
| `.oi_memory.md` | Memória de contexto |
| `.claude/napkin.md` | Quick reference |

---

## 🚀 PRÓXIMOS PASSOS

1. [ ] Testar refresh token automático
2. [ ] Configurar domínio para HTTPS callback
3. [ ] Implementar logs persistentes
4. [ ] Adicionar testes unitários
5. [ ] Configurar CI/CD (GitHub Actions)
6. [ ] Migrar para Cloudflare Workers
7. [ ] Adicionar webhook para notificações

---

**Versão:** 1.1.0  
**Última Atualização:** 2026-05-13  
**Manutenção:** RayShopee Team