# ScanEditProduto — Sprint Plan

**Versão:** 2.2 · 2026-07-18 (fechamento da Sprint 1.5 — auto-descoberta inteligente)
**Status:** ✅ Canônico (bump sincronizado com `HOLISTIC_REPORT.md` v2.2)
**Origem:** Roadmap derivado do `HOLISTIC_REPORT.md` (P5–P12 + D1 + Sprint 1.5) + `prd.md` (escopo) + `spec.md` (riscos)

> Cada sprint tem check-in explícito do owner antes de avançar. Sem exceções.
> Métrica: **1 sprint = 1–2 semanas**, com 1 demo no fim.

---

## Regra de processo (v2.1)

> **D1 — Bump de docs no mesmo commit que toca código que aparece nos canônicos.**
> Qualquer PR que altere comportamento, API contract, dívidas, ou arquivos que aparecem em `prd.md`/`spec.md`/`HOLISTIC_REPORT.md` deve **atualizar o doc correspondente no mesmo commit** (ou no PR imediatamente seguinte, se for puramente interno). Esta regra vira item obrigatório do Definition of Done de cada sprint.
> **Por que:** entre 2026-07-02 e 2026-07-04, 4 dívidas (P5/P8/P9/P12) foram resolvidas + `:rayshopee-core` entrou em produção, mas os 4 docs canônicos ficaram 16 dias mentindo. Mesma lição da v1.x — não pode se repetir.

---

## Sprint 0 — Higienização documental ✅ CONCLUÍDA (2026-07-02)

**Objetivo:** parar de mentir sobre o estado do app. A raiz tinha 10 .md desatualizados (todos de 2026-05, falando de MVVM/Supabase hardcoded/Hilt 2.53.1 — tudo ultrapassado).

| Task | Status |
|---|---|
| Mover 9 .md antigos para `docs/history/v1-2026-05-*.md` | ✅ |
| Criar `prd.md` (canônico, reflete código vivo) | ✅ |
| Criar `spec.md` (canônico, reflete código vivo) | ✅ |
| Criar `sprint.md` (este) | ✅ |
| Criar `HOLISTIC_REPORT.md` (mapa vivo + dívidas) | ✅ |
| Atualizar `README.md` para apontar pros canônicos | ✅ |
| Criar `docs/history/README.md` (índice) | ✅ |
| Política documental: canônicos × histórico × auxiliar | ✅ |

**Saída:** 4 docs canônicos + 9 frozen + `.memory/` continua como auxiliar (auto-gerado).

---

## Sprint 0.5 — Sincronização de docs (HIDDEN) ✅ CONCLUÍDA (2026-07-18 manhã)

**Objetivo:** fechar a janela de 16 dias em que 4 dívidas foram resolvidas + `:rayshopee-core` entrou em produção sem bump dos canônicos.

| Task | Status |
|---|---|
| Bump `HOLISTIC_REPORT.md` v2.0 → v2.1 (P5/P8/P9/P12 resolvidas, D1 resolvida) | ✅ |
| Bump `sprint.md` v2.0 → v2.1 (riscar T1.1/T1.2/T1.6 feitas, ajustar tabela de dívidas) | ✅ |
| Bump `prd.md` v2.0 → v2.1 (incluir Busca por nome) | ✅ |
| Bump `spec.md` v2.0 → v2.1 (`:rayshopee-core`, `BeepPlayer`, `NetworkMonitor` reativo, `fromQueue`/`OfflineQueuedException`) | ✅ |
| Adicionar regra D1 (bump de docs no mesmo commit) | ✅ |

---

## Sprint 1.5 — Auto-descoberta inteligente ✅ CONCLUÍDA (2026-07-18 tarde)

**Objetivo:** resolver o problema "subi o server mas o app continua offline" (caso real: dev descobriu que `NetworkDiscovery` testava só 8 IPs e perdia o server em `.8`). Adicionar SSID mapping (memoriza IPs por Wi-Fi) e mDNS (server anuncia, app descobre sem precisar de IP).

| Task | Status |
|---|---|
| **A1.1** Diagnosticar problema (IP do server `.8` não estava na lista do Discovery + celular tava no 4G sem NAT) | ✅ |
| **A1.2** Reescrever `NetworkDiscovery` com scan /24 em 2 fases + device IP + logs detalhados | ✅ |
| **A1.3** `NetworkMonitor.networkChanges: SharedFlow<Unit>` (reage a onAvailable/onLost) | ✅ |
| **A1.4** `NetworkConfig` re-descobre LAN automaticamente quando Wi-Fi muda | ✅ |
| **A1.5** WARP detection (adiciona `172.16.0.2` se device tem CloudflareWARP ativo) | ✅ |
| **A1.6** `SsidResolver` no `:rayshopee-core` (lê SSID, exige permissão localização) | ✅ |
| **A1.7** `SsidMapping` no app (persiste `SSID → URL`, auto-aprende, manual, forget) | ✅ |
| **A1.8** `NsdDiscovery` no `:rayshopee-core` (mDNS via `NsdManager`) | ✅ |
| **A1.9** Server anuncia `_rayshopee._tcp.local` via `bonjour` (`legacy_v1/server/package.json` + `index.js`) | ✅ |
| **A1.10** Settings dialog rico: botão Refresh, lista de SSID mappings, permissão localização, lista de candidates | ✅ |
| **A1.11** Adicionar `ACCESS_FINE_LOCATION` no manifest | ✅ |
| **A1.12** Bump `HOLISTIC_REPORT.md` → v2.2, `sprint.md` → v2.2, `prd.md` → v2.2, `spec.md` → v2.2 | ✅ |
| **A1.13** Buildar, instalar e validar em Galaxy M35 5G (Android 16) | ✅ — Fase 1 achou `192.168.15.8:3003` em ~1s |

**Saída:** 3 arquivos novos no app (`SsidMapping`), 3 no `:rayshopee-core` (`SsidResolver`, `NsdDiscovery`, mudanças em `NetworkDiscovery`/`NetworkConfig`/`NetworkMonitor`), 1 dependência no server (`bonjour`). Settings dialog com 4 seções novas.

---

## Sprint 1 — Segurança, empacotamento e P7 (próxima, 1 semana)

**Objetivo:** resolver o que sobrou para o app ser instalável em device de vendedor real (beta privado) sem quebrar nada.

### Tarefas técnicas

| ID | Tarefa | Origem | Status | Esforço |
|---|---|---|---|---|
| T1.1 | Auditar `SUPABASE_API_KEY` no código (grep + remoção se existir) | P9 | ✅ **FEITA** (2026-07-04) — zero credenciais, único hit é comentário "ILIKE no Supabase" | 1h |
| T1.2 | Mover `BASE_URL` e `FALLBACK_URLS` de constante hardcoded → configurável em runtime | P5 | ✅ **FEITA** (2026-07-04) — `SharedPrefsNetworkPreferences` + `NetworkConfig` do `:rayshopee-core` | 2h |
| T1.3 | Configurar **release signing** com keystore real (não `debug.keystore`) | R7 | 🟡 **CONFIG PRONTA** (2026-07-18) — `signingConfigs.release` lê de `keystore.properties` com fallback warning; **falta usuário commitar `keystore.properties` real** | 3h |
| T1.4 | Ativar R8 (`isMinifyEnabled = true`) + validar regras (Hilt, Retrofit, kotlinx-serialization, MLKit, CameraX, Room) | P10 | 🟡 **CONFIG PRONTA** (2026-07-18) — `isMinifyEnabled = true` + `proguard-rules.pro` com 6.0 KB de regras; **falta smoke test em device real (T1.7)** | 4h |
| T1.5 | **Resolver P7**: alinhar `UpdateCostRequest` camelCase ↔ snake_case (auditar backend, decidir) | P7 | ✅ **FEITA** (2026-07-18) — auditoria: backend lia snake_case em `update-cost` mas camelCase em price/stock. **Decisão:** alinhar tudo pra camelCase. App: `itemId, modelId`. Backend: `req.body.itemId, modelId`. Teste de regressão em `DtoSerializationTest`. | 2h |
| T1.6 | Renomear `applicationId` para `com.rayshopee.scanedit` (resolver colisão com `PedidosEditProduto`) | R5 / R8 | ✅ **FEITA** (2026-07-04) | 1h |
| T1.7 | Build release APK + instalar em 1 device real + smoke test (scan + 3 updates) | — | ⏳ **PENDENTE** (após T1.3 + T1.4 + commit do keystore.properties) | 2h |
| T1.8 🆕 | Adicionar hook/Definition of Done que valida D1 (bump de docs no mesmo commit) | D1 | ⏳ **PENDENTE** — manual por enquanto (regra escrita no `sprint.md`; falta hook automatizado) | 1h |

**Definition of Done:**
- [ ] APK release < 20 MB (após R8) — R8 ativado, falta medir
- [ ] Zero credenciais hardcoded (verificado com grep) ✅
- [ ] APK instala e roda em device de vendedor real — depende do keystore.properties
- [ ] `applicationId` único (`com.rayshopee.scanedit`) ✅
- [ ] P7 resolvido (camelCase ou snake_case em tudo) ✅ (decisão: camelCase)
- [ ] D1: Definition of Done da sprint inclui "se tocou em código que aparece em doc canônico, bump no mesmo PR" ✅ regra escrita

**Risco:** se R8 quebrar release, validar regras em `proguard-rules.pro` (T1.4) — pode ser preciso ajustar 1-2 regras (Hilt ou MLKit costumam dar surpresa). Smoke test T1.7 é validador final.

---

## Sprint 2 — Testes e resiliência offline (1–2 semanas)

**Objetivo:** parar de rezar para não ter regressão. P6 (zero testes) é o maior gap atual.

> **Nota:** P8 (fila offline) **já está resolvido** desde v2.1 (Sprint 0.5), portanto T2.4/T2.5 originais foram cumpridas. Sprint 2 agora foca em **P6 (testes)** + smoke test da fila plugada.

### Tarefas técnicas

| ID | Tarefa | Origem | Status | Esforço |
|---|---|---|---|---|
| T2.1 | Suite JVM-pura para `ScannerViewModel` (cooldown 2s, dedupe, error mapping, tratamento de `OfflineQueuedException`) | P6 | 🟡 **PARCIAL** (test file criado 18/07, depois removido por causa de `open class` que não propaga aos membros — pendente decisão: A) `open` em cada método OU B) MockK 1.13.16+) | 4h |
| T2.2 ✅ | Suite JVM para parsers de `ProductResponse` / `VariationResponse` / `ProductSearchListResponse` | P6 | ✅ **FEITA** (2026-07-18 — `DtoSerializationTest` 8/8 passando) | 3h |
| T2.3 | Suite para `FallbackUrlInterceptor` (mock de OkHttp `Chain`) | P6 | ⏳ PENDENTE (depende de T2.1 — escolha A/B) | 3h |
| T2.4 ✅ | **Conectar fila offline** (P8): em `updateX()` falha de rede → enfileirar `PendingActionEntity` | P8 | ✅ **FEITA** (2026-07-04, ver v2.1) | — |
| T2.5 ✅ | Agendar `SyncWorker` (OneTimeWorkRequest) quando há falha | P8 | ✅ **FEITA** (2026-07-04, ver v2.1) | — |
| T2.6 | CI no GitHub Actions: `assembleDebug` + `testDebugUnitTest` em PR | R4 | ⏳ PENDENTE | 3h |
| T2.7 | Script `run-jvm-tests.ps1` (mesmo padrão do `PedidosEditProduto`) | consistência | ⏳ PENDENTE | 1h |
| T2.8 🆕 | Smoke test manual: airplane mode → 5 updates → tirar airplane mode → verificar que 5 updates sincronizaram (valida a fila plugada) | validação P8 | ⏳ PENDENTE | 30min |

**Definition of Done:**
- [ ] ≥ 20 testes JVM passando
- [ ] Fila offline **realmente funciona** (T2.8 verde) ✅ já em código, falta teste
- [ ] CI verde em PR de exemplo
- [ ] Cobertura: `ScannerViewModel` ≥ 80%, parsers ≥ 90%

**Métrica de sucesso:** posso desligar o servidor, editar 5 produtos, religar o servidor, e os 5 updates aparecem — **isso já é possível em código, falta validar com teste automatizado**.

---

## Sprint 3 — Migração RayHub (2–3 semanas) 🟡 DEPENDÊNCIA EXTERNA

**Objetivo:** trocar a dependência do `legacy_v1/server` (Node.js, em EOL) pelo `apps/RayHub/apps/api` (NestJS).

### Pré-condição (NÃO deste sprint, é da RayHub)
- [ ] `RayHub/apps/api` tem endpoints equivalentes: `/products/barcode`, `/products/item/{id}`, `/products/search`, `/products/update-*`
- [ ] Auth do RayHub é compatível com app atual (OAuth Shopee ou service account)

### Tarefas técnicas

| ID | Tarefa | Origem | Esforço |
|---|---|---|---|
| T3.1 | Adicionar `RayHubApiService` (Retrofit interface nova) | R1 | 4h |
| T3.2 | Feature flag `useRayHub: Boolean` (default false até RayHub validar) | R1 | 2h |
| T3.3 | Implementar `RayHubProductRepository implements ProductRepository` | R1 | 6h |
| T3.4 | DI: `RepositoryModule` decide qual implementação baseado na flag | R1 | 2h |
| T3.5 | Smoke test com RayHub apontando para staging + comparar respostas com `legacy_v1/server` | R1 | 4h |
| T3.6 | Remover flag → RayHub é única fonte | R1 | 1h |
| T3.7 | Deprecar `legacy_v1/server` endpoits usados só pelo ScanEditProduto | R1 | (comunicação) |

**Definition of Done:**
- [ ] App roda 100% contra RayHub, sem fallback para legacy
- [ ] Latência comparável (< 200ms de regressão aceitável)
- [ ] `legacy_v1/server` pode ser desligado para o fluxo do ScanEditProduto

**Risco:** se RayHub não tiver os endpoints na data planejada, Sprint 3 vira Sprint 4. Tudo bem.

---

## Sprint 4 — Observabilidade e crescimento (1 semana)

**Objetivo:** saber o que está acontecendo em produção (sem Crashlytics é vidente) e preparar terreno para multi-idioma.

| ID | Tarefa | Origem | Esforço |
|---|---|---|---|
| T4.1 | Integrar **Firebase Crashlytics** | P11 | 2h |
| T4.2 | **Firebase Analytics** com eventos-chave (scan, update_price, cache_hit, offline_action) | P11 | 3h |
| T4.3 | Logger estruturado (Timber + tags por módulo) | P11 | 2h |
| T4.4 | `strings.xml` em inglês (i18n) | PRD §3.3 | 3h |
| T4.5 | Suporte a tablet (layout responsivo com `WindowSizeClass`) | PRD §3.3 | 6h |

**Definition of Done:**
- [ ] Crash reporta em < 1 min após o crash
- [ ] Eventos de scan visíveis no Analytics dashboard
- [ ] App em inglês sem warnings de `MissingTranslation`
- [ ] Tela principal usável em tablet 10"

---

## Sprint 5+ — Roadmap aberto (ordem de prioridade)

| Item | Origem | Por quê |
|---|---|---|
| Migração para `ScanAddProdutos` (fundir apps) | decisão de produto | se ficar claro que ScanEditProduto = subconjunto de ScanAddProdutos, simplificar |
| Wear OS companion | PRD §3.3 | nice-to-have, baixa prioridade |
| Widget home screen | PRD §3.3 | nice-to-have |
| Backup cloud automático | PRD §3.3 | nice-to-have |
| Notificações push (estoque crítico) | feedback de usuário | quando houver base de usuários pedindo |
| Mover SharedPrefs → Android Keystore (criptografado em repouso) | evolução de P5 | hardenizar prefs de URL |

> Itens do roadmap **NÃO entram em sprint** sem critério de aceitação escrito e validação do owner.

---

## Como usar este sprint.md

1. **A cada sprint, copiar a tabela de Definition of Done** para o topo e marcar conforme avança
2. **Ao fechar sprint:** atualizar `HOLISTIC_REPORT.md` (remover dívidas resolvidas, adicionar novas)
3. **Ao abrir sprint:** revisar se as premissas da `prd.md` ainda valem
4. **Se um task bloquear:** mover para próxima sprint com nota, não esticar a atual
5. **D1 (regra nova):** se o commit/PR toca código que aparece em `prd.md`/`spec.md`/`HOLISTIC_REPORT.md`, bumpar o doc correspondente **no mesmo PR**.

---

## Dívidas conhecidas (atualizado v2.1)

| ID | Severidade | Descrição | Sprint alvo | Status |
|---|---|---|---|---|
| P5 | 🟢 Baixa | `BASE_URL` hardcoded em constante | Sprint 1 | ✅ **RESOLVIDA** 2026-07-04 |
| P6 | 🟡 Média | Zero testes unitários | Sprint 2 | 🟡 **PARCIAL** (DtoSerializationTest 8/8 ✅, ScannerViewModelCooldownTest removido — pendente escolha: `open` em cada membro OU MockK 1.13.16+) |
| P7 | 🟡 Média | `UpdateCostRequest` snake_case vs resto camelCase | Sprint 1 | ✅ **RESOLVIDA** 2026-07-18 (alinhado em app + backend, teste de regressão) |
| P8 | 🟡 Média | Fila offline não enfileirava (só o Worker existia) | Sprint 2 | ✅ **RESOLVIDA** 2026-07-04 |
| P9 | 🟡 Média | Possível credencial hardcoded (auditar) | Sprint 1 | ✅ **RESOLVIDA** 2026-07-04 (grep limpo) |
| P10 | 🟢 Baixa | R8 (`isMinifyEnabled`) desabilitado | Sprint 1 | 🟡 **CONFIG PRONTA** 2026-07-18 (regras em proguard-rules.pro, falta smoke test em device) |
| P11 | 🟢 Baixa | Sem Crashlytics / Analytics | Sprint 4 | ⏳ PENDENTE |
| P12 | 🟠 Alta | `applicationId` colidia com `PedidosEditProduto` | Sprint 1 | ✅ **RESOLVIDA** 2026-07-04 |
| D1 | 🟡 Média | Bump de docs no mesmo commit | Sprint 1 (T1.8) | ✅ **RESOLVIDA** 2026-07-18 (regra escrita; falta hook automatizado) |
