# ScanEditProduto — UX Backlog

**Versão:** 1.0 · 2026-07-02
**Status:** 📋 Documentado, **não** agendado em sprint
**Origem:** Descobertas da sessão de teste manual em device físico (`com.rayshopee.scanedit`, instalado 2026-07-02)
**Owner:** Dev solo

> Cada card tem o suficiente pra ser implementado sozinho (severidade, esforço, arquivo, porquê, "como").
> Critério de entrada em sprint: definido em `sprint.md` §"Sprint 5+".
> Dívidas técnicas curtas (P5–P12) continuam em `HOLISTIC_REPORT.md` — este doc é só UX/produto.

---

## 🔴 Quick wins (≤ 30 min, alto impacto)

### UX-01 — Confirmação antes de salvar preço/estoque/custo
- **Severidade:** 🟠 **Alta** (afeta $$ real)
- **Esforço:** ~30 min
- **Arquivo:** `app/src/main/java/com/rayshopee/app/ui/screens/ScannerScreen.kt` (callbacks `onUpdatePrice`/`onUpdateStock`/`onUpdateCost`, passados ao `ProductCard` por volta da linha 229)
- **Por quê:** Toque acidental → alteração de preço em produção sem aviso nem undo.
- **Como:** `AlertDialog` ("Confirmar alteração? R$ XX → R$ YY?") antes do `Intent.UpdateX`. Snackbar "Alteração salva" no sucesso.

### UX-02 — Tratar `200 OK + variations: []` como NOT_FOUND
- **Severidade:** 🟠 **Alta** (cobre o caso real do backend)
- **Esforço:** ~5 min
- **Arquivo:** `ScannerViewModel.kt`, em `handleBarcodeScanned` e `handleItemIdSearch` (bloco `onSuccess`)
- **Por quê:** O backend `legacy_v1/server` provavelmente devolve `200 OK` com `variations: []` quando o produto não existe (mais barato que 404, padrão REST mal-feito). Hoje cai em "produto carregado, sem variações" — UI confusa.
- **Como:** Se `p.variations.isEmpty()` → cair no mesmo caminho do 404 (`error = ScannerErrorKind.NOT_FOUND`, limpar `product`).

### UX-03 — Toast de sucesso após update
- **Severidade:** 🟡 Média (ansiedade do vendedor)
- **Esforço:** ~15 min
- **Arquivo:** `ScannerViewModel.kt`, `handleUpdatePrice/Stock/Cost` (bloco `onSuccess`)
- **Por quê:** Update silencioso → vendedor não sabe se salvou. Pior offline (P8): acha que sincronizou e não sincronizou.
- **Como:** Disparar Toast no `onSuccess`. VM precisa de `Context` → injetar via Hilt `@ApplicationContext` no construtor.

### UX-04 — Manifest hygiene: desligar `allowBackup` e `usesCleartextTraffic`
- **Severidade:** 🟡 Média (vetores baratos de fechar)
- **Esforço:** ~5 min
- **Arquivo:** `app/src/main/AndroidManifest.xml` linhas 13 e 21
- **Por quê:**
  - `allowBackup="true"` → cache Room (preços editados) sincroniza via Google Backup. Em app de edição de preço, vazamento de histórico.
  - `usesCleartextTraffic="true"` → aceita HTTP em **qualquer** host, não só no ngrok de dev.
- **Como:** Mudar ambos pra `false`. Verificar `network_security_config.xml` — provavelmente ele restringe cleartext via `domain`, então o `usesCleartextTraffic` é redundante e pode sair.

### UX-05 — Manual input aceita barcode, não só Item ID
- **Severidade:** 🟡 Média (UX crua)
- **Esforço:** ~15 min
- **Arquivo:** `ScannerScreen.kt` (TextField + `onManualInput`, por volta da linha 156)
- **Por quê:** Vendedor escaneou errado → tem que re-escanear a câmera. Aceitar barcode dá rota de escape quando a câmera falha ou codebar rasura.
- **Como:** Detectar heurística: string 8–14 dígitos numéricos → tratar como barcode; senão → item ID. Repassar para `searchByBarcode` ou `searchByItemId` respectivamente.

### UX-06 — `wakeUp()` só quando faz sentido
- **Severidade:** 🟢 Baixa (custo de request)
- **Esforço:** ~10 min
- **Arquivo:** `ProductRepositoryImpl.kt`, `warmUp()` chamado em `searchByBarcode`/`searchByItemId`
- **Por quê:** Hoje **toda busca** bate em `/api/wakeup` antes do GET real. Free ngrok aguenta mas polui log e desperdiça request.
- **Como:** Mais simples: mover warm-up para o `checkHealthPeriodically()` da VM (já roda a cada 30s) e tirar dos endpoints de busca. Alternativa: cachear `lastWokeUpAt` no repo e só re-warm-up se passou > 5min.

### UX-09 — "Não mentir sobre update" (distinguir offline salvo de erro real)
- **Severidade:** 🟠 **Alta** (vendedor pensa que salvou e não salvou, OU salva sem feedback)
- **Esforço:** ~15 min
- **Status:** ✅ **Done 2026-07-02** (build #1m17s, APK em `app/build/outputs/apk/debug/app-debug.apk`)
- **Arquivo:** `ScannerViewModel.kt` — refatoração dos 3 `handleUpdateX` em torno de `handleUpdate(...)` helper privado + `handleUpdateFailure(...)` que distingue 3 caminhos.
- **Por quê:** O bug diagnosticado em sessão ("alterei o estoque e do nada ficou offline") tinha **2 sintomas opostos** com a mesma causa raiz — `onFailure` mapeava TUDO pra `UPDATE_FAILED` (erro vermelho), sem distinguir:
  - `OfflineQueuedException` (fila local absorveu, sincroniza depois) → deveria ser **warning amarelo**, não erro
  - Erro real do servidor (5xx, 4xx) → erro vermelho, mantém UI original (vendedor vê número antigo voltar)
- **Diagnóstico da causa raiz:** `OfflineQueuedException`, `PendingActionEntity`, `SyncWorker.fromQueue=true` e o `Result.failure(OfflineQueuedException(e))` no `ProductRepositoryImpl` **já existiam e estavam certos**. O bug era só na ViewModel — `onFailure = { _ -> ... UPDATE_FAILED }` ignorava o tipo da exception.
- **Como ficou:**
  ```kotlin
  // Sucesso real: aplica otimístico, limpa warning
  onSuccess → applyOptimisticUpdate(...) ; warning=null, error=null
  // OfflineQueuedException: aplica otimístico + warning amarelo (fila local OK)
  onFailure e is OfflineQueuedException → applyOptimisticUpdate(...)
      + warning = "💾 Salvo no dispositivo — sincroniza quando voltar online"
  // Erro real: NÃO aplica UI + erro vermelho
  else → error = ScannerErrorKind.UPDATE_FAILED
  ```
- **Bonus feito junto:** `warning = null` ao iniciar nova busca (evita leak do warning de um produto no próximo).
- **Sinergia:** complemento do UX-03 (toast de sucesso). Aqui a UX é "fala o que aconteceu" via warning amarelo persistente até o próximo scan — não some em 2s.
- **Próximos da fila (não feitos):** UX-02.1 (NetworkCallback p/ reagir a wifi on/off sem polling 30s), UX-06.1 (warmUp timeout curto). Ficam pra próxima rodada.

### UX-02.1 — Reagir a mudanças de rede em tempo real (NetworkCallback)
- **Severidade:** 🟠 **Alta** (sintoma "vira e mexe fica offline" — pill só atualizava a cada 30s)
- **Esforço:** ~20 min
- **Status:** ✅ **Done 2026-07-02** (build #31s incremental)
- **Arquivos:**
  - novo `data/network/NetworkMonitor.kt` (~70 linhas, `@Singleton`, expõe `StateFlow<Boolean>`)
  - `ScannerViewModel.kt` — injeta `NetworkMonitor`, adiciona `observeNetworkState()`, reduz periodic de 30s → 120s
- **Por quê:** O pill "🟢 Online" / "🔴 Offline" no TopAppBar era controlado por um `while(true) { checkHealth(); delay(30s) }`. Se o wifi do vendedor caísse e voltasse em 3s, o pill ficava errado por 27s. **Pior:** se o ngrok/Render caísse, a primeira indicação só aparecia 30s depois.
- **Como ficou:** 2 fontes combinadas em `_uiState.isOnline`:
  - **NetworkMonitor (imediato):** `ConnectivityManager.NetworkCallback` reage a wifi on/off, handoff 4G↔wifi, airplane mode. Quando device volta online → dispara `checkHealth()` IMEDIATO; quando perde → marca offline IMEDIATO.
  - **checkHealthPeriodically (backup):** cada 2min verifica se servidor responde (caso raro de servidor cair sem rede cair).
- **Limitação conhecida:** o `NetworkMonitor` emite `true` em `onAvailable`, mesmo que a rede seja captive portal. Pra evitar "🟢 mas não navega", a próxima chamada de `checkHealth` confirma em ~200ms. **Trade-off aceito:** melhor reagir rápido a wifi on/off do que esperar o usuário fazer check manual.
- **Não testado via adb** (sem root pra mexer em wifi/airplane pelo shell). **Você precisa testar manualmente**: ligar modo avião → pill vira 🔴 na hora; desligar → pill vira 🟢 + checkHealth roda na hora.
- **Pequeno desperdício de request no init:** `observeNetworkState.collect` + `registerNetworkCallback.onAvailable` podem disparar 2 wakeUps no startup. Aceitável (1-2 requests), polir depois se incomodar.
- **Próximo:** UX-06.1 (timeout curto no warmUp pra não pagar 45s de cold start na UX).

---

## 🟡 Médio prazo (> 30 min, mas cabem numa sprint)

### UX-07 — Audit trail no Room
- **Severidade:** 🟡 Média ("quem mudou esse preço?")
- **Esforço:** ~2 h (entidade + DAO + tela de consulta)
- **Arquivos:**
  - novo `data/local/AuditLogEntity.kt` + `data/local/AuditDao.kt`
  - `ProductRepositoryImpl.kt`, em cada `updateX()` bem-sucedido
  - nova tela `ui/screens/AuditScreen.kt` (acessível via menu/botão)
- **Por quê:** Vendedor A mudou preço às 14h, B estranha às 16h. Sem rastro → briga. Com rastro → "foi A, 14:32, de R$X pra R$Y".
- **Como:** Cada `updateX()` insere `AuditLogEntity(action, itemId, variationId, oldValue, newValue, timestamp)`. Tela nova lista as últimas N entradas com `filter` por item/vendedor.
- **Sinergia:** Reaproveita infra do Room já existente (P8, Sprint 2).

### UX-08 — Botão "Reportar problema" no card de erro (em vez de "Copiar")
- **Severidade:** 🟢 Baixa (canal de feedback)
- **Esforço:** ~30 min
- **Arquivo:** `ScannerScreen.kt` (~linha 213, Button "Copiar" no error card)
- **Por quê:** `Copiar` copia a mensagem — útil pra dev, **inútil pro vendedor**. Trocar por "Reportar" abre Intent de email com mensagem + device + versão pré-preenchidos.
- **Como:**
  ```kotlin
  val intent = Intent(Intent.ACTION_SENDTO).apply {
      data = Uri.parse("mailto:suporte@rayshopee.com")
      putExtra(Intent.EXTRA_SUBJECT, "ScanEditProduto — ${errorKind}")
      putExtra(Intent.EXTRA_TEXT, buildString {
          appendLine(errorMsg)
          appendLine()
          appendLine("Device: ${Build.MANUFACTURER} ${Build.MODEL}")
          appendLine("Android: ${Build.VERSION.RELEASE} (SDK ${Build.VERSION.SDK_INT})")
          appendLine("App: ${context.packageManager.getPackageInfo(...).versionName}")
      })
  }
  context.startActivity(intent)
  ```

---

## 💭 Cosmético / roadmap (Sprint 5+ candidatos)

| ID  | Item                                              | Origem       | Por que esperar |
|-----|---------------------------------------------------|--------------|------------------|
| COS-01 | Dark mode (`darkColorScheme`)                  | —            | Vendedor em depósito escuro agradece; Material3 default light funciona |
| COS-02 | Confirmação em massa "Salvar todas pendentes"  | P8           | Depende da Sprint 2 fechar a fila offline primeiro |
| COS-03 | Layout responsivo tablet (`WindowSizeClass`)  | PRD §3.3     | Já no sprint 4 (atrás de Crashlytics e i18n) |

---

## Como usar este doc

1. Quando abrir sprint futura, **copiar o(s) card(s)** que quiser atacar como DoD dela.
2. Ao fechar: mover para `sprint.md` da sprint correspondente e remover daqui.
3. Mudança de prioridade → editar a **severidade** aqui (não em outros docs — fonte única).
4. **Não duplicar** com `HOLISTIC_REPORT.md` (que tem dívidas técnicas) nem com `sprint.md` "Sprint 5+" (que tem itens PRD-driven). Se um item volar pra sprint, ele sai daqui.
