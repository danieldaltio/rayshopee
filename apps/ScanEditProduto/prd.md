# ScanEditProduto — Product Requirements Document (PRD)

**Versão:** 2.2 · 2026-07-18 (fechamento da Sprint 1.5 — auto-descoberta inteligente)
**Status:** ✅ Canônico (bump sincronizado com `HOLISTIC_REPORT.md` v2.2 — ver `sprint.md` v2.2)
**Application ID:** `com.rayshopee.scanedit` (renomeado de `com.rayshopee.app` em 2026-07-04 — **P12 resolvido**)
**Owner:** RayShopee team (dev solo)

---

## 1. Resumo executivo

O **ScanEditProduto** é o app Android nativo do ecossistema RayShopee focado em **scanner de bolso de alta disponibilidade**: o vendedor aponta a câmera para o código de barras do produto Shopee, o app consulta a API (com fallback de URL + cache local Room + fila offline de updates), exibe variações (cor/tamanho/SKU), e permite editar **preço, estoque e custo** mesmo sem internet — as edições são enfileiradas e sincronizadas depois via WorkManager.

É deliberadamente **menor e mais robusto** que o `ScanAddProdutos` (que é o canivete suíço de publicação). O ScanEditProduto é o **scanner de edição rápida do dia-a-dia** — o que o vendedor usa 50× por dia no estoque.

### Diferencial vs `ScanAddProdutos` e `PedidosEditProduto`

| App | Foco | Quando o vendedor usa |
|---|---|---|
| **ScanEditProduto** (este) | **Scan + edição rápida** com offline-first | No balcão, varrendo prateleira |
| `ScanAddProdutos` | Publicar/listar produtos novos com IA + scraping | Cadastrando SKU novo |
| `PedidosEditProduto` | Editar pedidos prontos para envio | Despachando pedidos |

> Decisão de manter os 3 separados foi confirmada no `PLANO.md` (D2): apps diferentes, divergência real (hash 68.8% / Jaccard 82% vs `PedidosEditProduto`, 6–16% vs `ScanAddProdutos`).

---

## 2. Persona e casos de uso

### Persona primária

**Vendedor Shopee solo** que gerencia 200–2000 SKUs, fica o dia todo no celular, perde sinal 4G várias vezes por hora em depósito/loja, e precisa atualizar preço/estoque em segundos — não em minutos.

### User stories

| ID | Como… | Eu quero… | Para… | Prioridade |
|---|---|---|---|---|
| US1 | vendedor | escanear código de barras com a câmera | abrir o produto sem digitar ID | 🔴 Crítica |
| US2 | vendedor | ver todas as variações (cor/tamanho) do produto | editar a variação certa | 🔴 Crítica |
| US3 | vendedor | editar **preço** de uma variação | reajustar promoção rapidamente | 🔴 Crítica |
| US4 | vendedor | editar **estoque** de uma variação | evitar vender o que não tem | 🔴 Crítica |
| US5 | vendedor | editar **custo** (margem de lucro) | recalcular rentabilidade | 🟡 Alta |
| US6 | vendedor (offline) | continuar editando sem internet | trabalhar em depósito sem 4G | 🔴 Crítica |
| US7 | vendedor (offline→online) | saber que o app sincronizou sozinho | confiar que edição não se perdeu | 🟡 Alta |
| US8 | vendedor | ver indicador 🟢/🔴/🟡 de status online | saber se tô consumindo 4G ou não | 🟢 Média |
| US9 | vendedor | ver **cache de produto** quando servidor cai | não perder tempo em 2ª tentativa | 🟡 Alta |
| US10 | vendedor | buscar por `item_id` (digitando) | casos sem código de barras legível | 🟢 Média |
| US10b 🆕 | vendedor | **buscar por nome / SKU / EAN parcial** | achar produto quando não lembro o ID e o código de barras está ilegível | 🟡 Alta |
| US11 🆕 | vendedor | configurar **URL do backend** pelo app (Settings) | apontar pra ngrok novo, IP local, ou cloudflare sem rebuild | 🟡 Alta |
| US12 🆕 | vendedor (offline) | ver aviso "**salvo offline, vai sincronizar**" em vez de erro quando edita sem rede | confiar que a edição não se perdeu | 🟡 Alta |
| US13 🆕 | vendedor | **ouvir bip** (scan/edit/erro) e poder **silenciar** | feedback auditivo sem olhar tela; mute em ambiente silencioso | 🟢 Média |
| US14 🆕 | vendedor | ver mudança de pill online/offline **instantânea** quando wifi do device cai/volta | saber em < 1s se tá online (não esperar 30s) | 🟡 Alta |
| US15 🆕🆕 | vendedor | **botão "Refresh" no Settings** força re-descoberta (LAN scan /24 + mDNS + health-check) | resolver "app diz offline mas server tá de pé" | 🔴 Crítica |
| US16 🆕🆕 | vendedor | app **memoriza URL por Wi-Fi** (VivoDM → .8, Casa → .50) e aplica automaticamente quando reconecta | não reconfigurar toda vez que muda de Wi-Fi | 🟡 Alta |
| US17 🆕🆕 | vendedor | app descobre server **via mDNS/Bonjour** (zero-config, sem precisar de IP) | funcionar em qualquer Wi-Fi sem saber IP do server | 🟡 Alta |
| US18 🆕🆕 | vendedor | **re-descoberta automática** quando troca de Wi-Fi (sem precisar abrir app) | funcionar sem ação manual ao mudar de rede | 🟢 Média |

---

## 3. Escopo

### 3.1 Funcionalidades do MVP (já entregues)

- ✅ Scanner de código de barras (CameraX + MLKit, EAN/UPC/Code-128/QR)
- ✅ Busca por barcode (via REST do backend `legacy_v1/server` ou fallback ngrok)
- ✅ Busca por `item_id`
- ✅ **Busca por nome / SKU / EAN parcial** 🆕 (US10b — endpoint `/api/products/search?q=...`)
- ✅ Listagem de variações com edição inline
- ✅ Update de preço/estoque/custo (POST)
- ✅ **Cache local Room** (v3, 2 entities: `products` + `pending_actions`)
- ✅ **Fila offline de updates funcional** (`pending_actions` + `SyncWorker` + `OfflineQueuedException`) — **P8 resolvido**
- ✅ **Fallback de URL** automático (interceptor OkHttp com retry + backoff)
- ✅ **URL configurável em runtime** 🆕 (US11 — Settings dialog persiste em SharedPrefs, antes era constante hardcoded — **P5 resolvido**)
- ✅ **Auto-LAN discovery** 🆕 (`NetworkConfig` do `:rayshopee-core` varre rede local e prepende IPs candidatos)
- ✅ **Status indicator online/offline** (🟢/🔴/🟡) no TopAppBar
  - **NetworkMonitor reativo** 🆕 (US14) — atualiza em < 1s quando wifi do device muda (via `NetworkCallback`)
  - Health check periódico de **2min** (era 30s na v2.0 — reduzido porque NetworkMonitor reage ao device, o que sobra é "servidor caiu sem rede cair" — raro)
- ✅ **Aviso "salvo offline, vai sincronizar"** 🆕 (US12) em vez de erro quando update falha de rede mas fila pegou
- ✅ **Bip de feedback** 🆕 (US13) — TONE_PROP_BEEP no scan, ACK no edit, NACK no erro, com toggle de mute persistido
- ✅ **Cooldown 2s** entre scans (anti-trigger duplicado)
- ✅ **MVVM/MVI** com `StateFlow` + `sealed interface ScannerIntent` (11 intents)
- ✅ **Hilt DI** completo (Application + Activity + ViewModel + Worker + BeepPlayer + 3 módulos: Repository, Database, AppNetwork)
- ✅ **Network security config** com cleartext para dev (10.0.2.2, localhost, IPs locais)
- ✅ **`applicationId` único** `com.rayshopee.scanedit` 🆕 — **P12 resolvido** (não colide mais com `PedidosEditProduto`)
- ✅ **Zero credenciais hardcoded** 🆕 — **P9 resolvido** (auditoria grep: 1 hit só, comentário "ILIKE no Supabase")
- ✅ **Módulo compartilhado `:rayshopee-core`** 🆕 (composite build via `includeBuild("../rayshopee-core")` — provê `NetworkConfig`, `NetworkMonitor`, `NetworkDiscovery`, `FallbackUrlInterceptor`, `NetworkPreferences`, **+ SsidResolver, NsdDiscovery**)
- ✅ **Auto-descoberta inteligente** 🆕🆕 (Sprint 1.5) — `NetworkDiscovery` scan /24 em 2 fases (10 candidatos comuns → 254 IPs em paralelo), inclui próprio IP do device, re-descobre automaticamente quando Wi-Fi muda, detecta WARP
- ✅ **SSID → URL mapping** 🆕🆕 (Sprint 1.5) — app memoriza qual IP funciona em cada Wi-Fi (ex: `VivoDM → 192.168.15.8`), aplica automaticamente quando reconecta
- ✅ **mDNS / DNS-SD discovery** 🆕🆕 (Sprint 1.5) — server anuncia `_rayshopee._tcp.local` via `bonjour` no Node.js, app descobre via `NsdManager` do Android (zero-config, sem IP)
- ✅ **Settings dialog rico** 🆕🆕 (Sprint 1.5) — botão "🔄 Refresh" (re-scan LAN + mDNS + health-check), SSID atual + permission status, lista de SSID mappings (com forget), lista de candidates

### 3.2 Fora do escopo (não é objetivo deste app)

- ❌ Publicar/listar produtos novos → é o `ScanAddProdutos`
- ❌ Gerenciar pedidos → é o `PedidosEditProduto`
- ❌ Dashboard web → é `legacy_v1/web` (Vite/React)
- ❌ Emissão de NF-e → é `apps/RayHub`
- ❌ Notificações push, multi-idioma, Wear OS, tablets

### 3.3 Roadmap (próximas sprints — ver `sprint.md`)

- 🟡 **Sprint 1 (próxima):** P7 (camelCase vs snake_case em `UpdateCostRequest`), P10 (R8), T1.3 (release signing config), T1.8 (regra D1 como Definition of Done)
- 🟡 **Sprint 2:** P6 (testes JVM — `ScannerViewModel` + parsers + `FallbackUrlInterceptor`)
- 🟡 **Sprint 3:** Migração para `RayHub` API (NestJS) — descontinuar `legacy_v1/server`
- 🟢 **Sprint 4:** Crashlytics + Analytics (P11), multi-idioma (i18n), suporte a tablet
- 🟢 **Sprint 5+:** Wear OS, widget home screen, backup cloud automático, notificações push

> **Item removido (v2.0 → v2.1):** "Android Keystore para `SUPABASE_API_KEY`" — resolvido em P9 (auditoria de 2026-07-04: zero credenciais hardcoded no app; o que era Supabase migrou pro backend `legacy_v1/server`).

---

## 4. Critérios de aceitação (do MVP atual)

- [x] App compila (`./gradlew assembleDebug` exit 0)
- [x] Câmera abre ao iniciar
- [x] Barcode EAN-13 detectado em <500ms após enquadrar
- [x] Produto retornado com todas variações visíveis
- [x] Edição de preço/estoque/custo persiste visualmente
- [x] Se servidor cair, app continua mostrando cache com aviso "Sem conexão — dados de X min atrás"
- [x] Se servidor cair durante um update, ação entra na fila e sincroniza depois
- [x] Indicador 🟢/🔴 reflete estado real (NetworkCallback reativo em < 1s + health check 2min)
- [x] Cooldown 2s impede 5 scans seguidos do mesmo código
- [x] APK debug < 30 MB
- [x] Vendedor pode configurar URL do backend pelo app (Settings → URL → persistida) 🆕
- [x] Busca por nome/SKU/EAN parcial retorna lista de até 100 resultados 🆕
- [x] Update offline mostra aviso "salvo offline, vai sincronizar" em vez de erro 🆕
- [x] Bip toca no scan/edit/erro, com toggle de mute 🆕
- [x] `applicationId` é `com.rayshopee.scanedit` (não colide com outros apps RayShopee) 🆕

---

## 5. Métricas de sucesso (operacional)

| Métrica | Alvo | Atual |
|---|---|---|
| Taxa de detecção de barcode (1ª tentativa) | > 95% | (não medido) |
| Latência scanner→UI (rede OK) | < 1.5s | ~500ms scan + ~500ms API |
| Latência scanner→UI (offline, cache hit) | < 200ms | <100ms (Room) |
| Updates sincronizados após reconectar | 100% (sem perda) | ✅ (fila `pending_actions`) |
| Crashes em uso normal | 0 | (não medido — falta Crashlytics) |
| Tamanho APK debug | < 30 MB | ~25 MB |

---

## 6. Restrições e premissas

### Restrições técnicas (inegociáveis)

- **Min SDK 26** (Android 8.0+) — vendor target
- **Target SDK 35** (Android 15) — Play Store atual
- **compileSdk 36** — bleeding edge (Compose 2026.03 funciona)
- **Network**: precisa funcionar via **ngrok tunnel** (não tem domínio próprio nem VPS) — restrição operacional, não técnica
- **Backend**: depende do `legacy_v1/server` (Node.js Express na porta 3003) — **risco de EOL** quando RayHub estabilizar

### Premissas

- Vendedor tem câmera e internet 4G/Wi-Fi (com quedas esperadas)
- Loja tem 1 vendedor por turno (uso single-user)
- Dados da Shopee estão disponíveis via `legacy_v1/server` (consulta Supabase + Shopee Open Platform)

### Riscos (ver `spec.md` § Riscos para mitigação)

| Risco | Probabilidade | Impacto | Mitigação | Status |
|---|---|---|---|---|
| `legacy_v1/server` descontinuado (migração RayHub) | 🟡 Alta | 🔴 Crítico | API isolada em `ProductRepository`; troca = 1 classe | Sprint 3 |
| Tunnel ngrok cair | 🔴 Certo | 🟠 Médio | URL configurável runtime + auto-LAN + retry + fila offline | ✅ **endurecido em v2.1** |
| `SUPABASE_API_KEY` ainda em algum lugar do código | 🟢 Baixa | 🔴 Crítico | Auditar + mover pra backend | ✅ **RESOLVIDO** (auditoria 2026-07-04: zero credenciais) |
| Sem testes = regressão silenciosa | 🔴 Certo | 🟠 Médio | Sprint 2 adicionar testes JVM | Sprint 2 (P6) |
| `UpdateCostRequest` snake_case diverge do resto camelCase (P7) | 🟡 Alta | 🟠 Médio | Auditar backend, alinhar | Sprint 1 (T1.5) |

---

## 7. Integrações

### Backend primário: `legacy_v1/server` (Node.js + Express, porta 3003)

| Endpoint | Método | Usado em |
|---|---|---|
| `/api/wakeup` | GET | Health check (ping a cada 2min) |
| `/api/products/barcode?barcode=X` | GET | Scanner → produto |
| `/api/products/item/{itemId}` | GET | Busca manual por ID |
| `/api/products/search?q=X` 🆕 | GET | Busca ampla por nome/SKU/EAN parcial (até 100 resultados) |
| `/api/products/update-price` | POST | Update preço |
| `/api/products/update-stock` | POST | Update estoque |
| `/api/products/update-cost` | POST | Update custo (Supabase) |

> Acessado via tunnel ngrok (`unpaining-transcriptionally-patrick.ngrok-free.dev`) com **URL configurável em runtime** pelo vendedor (Settings → URL → `SharedPrefsNetworkPreferences`). `NetworkConfig` do `:rayshopee-core` compõe a lista final de candidatos: `[userUrl, lanUrl (auto-descoberta), cloudflareUrl (fallback final)]` e o `FallbackUrlInterceptor` testa cada um com retry+backoff.

### Backend secundário: `apps/RayHub/apps/api` (NestJS, porta 3001)

Planejado para substituir `legacy_v1/server` quando estabilizar (Sprint 3+). Por enquanto **não usado** em runtime.

### Supabase (camada de cache do `legacy_v1/server`)

Tabela `products` (campos: `item_id`, `model_id`, `name`, `sku`, `variation_name`, `shopee_price`, `shopee_stock`, `cost`, `GTIN_EAN_BarCode`, `is_active`).

---

## 8. Glossário

| Termo | Significado |
|---|---|
| **Variation** | SKU filho (cor/tamanho) de um produto pai |
| **EAN / GTIN** | Código de barras — 8 ou 13 dígitos |
| **Item ID** | ID numérico gigante do produto na Shopee (vem como `String` no JSON) |
| **Variation ID** (`model_id`) | ID numérico gigante da variação |
| **Fallback URL** | URL alternativa quando o tunnel primário cai |
| **Pending action** | Update que ficou na fila por falta de rede |
| **MVI** | Model-View-Intent — arquitetura com `sealed interface Intent` + `StateFlow` |
| **Cooldown** | Tempo mínimo entre 2 scans (anti-trigger duplicado) |
| **Cold start** | Primeira requisição a uma instância Render gratuita dormindo (~50s) |
| **Hilt-Work** | Extensão do Hilt para injetar dependências em `WorkManager` Workers |

---

## 9. Onde está cada coisa (referência rápida)

- **Estado vivo do código:** ver `HOLISTIC_REPORT.md` (lido linha-a-linha do código)
- **Arquitetura técnica, contratos, modelos:** ver `spec.md`
- **Próximas iterações:** ver `sprint.md`
- **Histórico (docs antigas):** `docs/history/` (9 docs de 2026-05, mantidas para referência)
- **Contexto rápido para IA:** `.memory/` (8 arquivos: `QUICK_REFERENCE`, `CONTEXT`, `ARCHITECTURE`, etc — gerados pelo OpenMemory, **NÃO canônicos**, ver §10)

---

## 10. Política documental

**Canônicos (verdade única — atualizados a cada release):**
- `README.md` (ponto de entrada)
- `prd.md` (este)
- `spec.md`
- `sprint.md`
- `HOLISTIC_REPORT.md`

**Histórico (NÃO atualizar — frozen):**
- `docs/history/v1-2026-05-*.md` (9 docs da v1 do app)
- `docs/legacy/` (post-mortems e docs pré-SDD)

**Auxiliar (auto-gerado, sem garantia de atualidade):**
- `.memory/*.md` e `.memory/openmemory.sqlite` (gerados pelo OpenMemory — usar como cache de contexto, **sempre validar contra canônicos**)
