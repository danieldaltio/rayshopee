# Post-Mortem v2: Melhorias de Resiliência e Correções de Crash

## 📝 Resumo

Após a implementação das 4 fases de resiliência (Monitoramento Sentry, Offline-First Room DB, Cron Job de Token, Fallback de URLs), o aplicativo Android passou a dar crash imediato na inicialização. Além disso, os erros de rede eram tratados silenciosamente — o usuário não era informado quando os dados exibidos vinham do cache offline em vez da API ao vivo.

---

## ❌ O Que Não Funcionou e Por Quê

### 1. Crash Fatal do App na Inicialização (Sentry)

- **Sintoma:** O app abria e fechava instantaneamente no celular (SM-M356B).
- **Erro:** `java.lang.IllegalArgumentException: DSN is required. Use empty string or set enabled to false in SentryOptions to disable SDK.`
- **Causa Raiz:** A dependência `io.sentry:sentry-android:7.14.0` foi adicionada ao `build.gradle.kts`, mas **nenhuma DSN válida** foi configurada. O SDK do Sentry registra automaticamente um `ContentProvider` chamado `SentryInitProvider` no manifest mergeado. Esse provider é executado **antes** do `Application.onCreate()`, e ao encontrar um DSN nulo/ausente, lançava uma exceção fatal que matava o processo.
- **Tentativas que falharam:**
  - Colocar `android:value=""` no `<meta-data io.sentry.dsn>` → O SDK mudou o erro para "Invalid DSN scheme: null"
  - Remover o `<meta-data>` do manifest → O SDK exigia DSN obrigatório e crashava igual
  - Adicionar `io.sentry.auto-init=false` + `tools:node="remove"` no provider → Funcionou parcialmente, mas o SDK ainda estava presente no APK

### 2. Erros de Rede Silenciosos (Fallback Invisível)

- **Sintoma:** Ao escanear um código de barras sem conexão com o servidor, o app exibia dados antigos sem nenhum aviso visual.
- **Causa Raiz:** O `ProductRepositoryImpl.searchByBarcode()` capturava exceções de rede e silenciosamente retornava dados do Room DB cache com `Result.success(...)`, sem nenhum indicador de que os dados eram antigos. O `ScannerViewModel` tratava isso como um sucesso normal.
- **Consequência:** O usuário achava que os preços e estoques exibidos estavam atualizados, quando na verdade podiam estar dias desatualizados.

### 3. Backend Vercel Retornando 500 (FUNCTION_INVOCATION_FAILED)

- **Sintoma:** Todas as chamadas à API no Vercel retornavam HTTP 500.
- **Causa Raiz:** O `server/index.js` importava `sefaz-service.js` estaticamente no escopo top-level (`import { tryDownloadInvoice, ... } from './sefaz-service.js'`). Esse módulo dependia do pacote `node-mde` (para certificados digitais A1) que executava operações pesadas de filesystem (`readFileSync`) durante a inicialização. No ambiente serverless do Vercel, isso excedia o tempo de cold-start e crashava a função.
- **Tentativas que falharam:**
  - Instalar `node-mde` e `archiver` no `package.json` → Não resolveu, pois o módulo ainda travava no cold-start
  - Remover apenas o `Sentry` do backend → Não resolveu, o problema era o SEFAZ

---

## ✅ O Que Funcionou (Soluções Aplicadas)

### 1. Remoção Completa do Sentry do App Android
- **Ação:** Removida a linha `implementation("io.sentry:sentry-android:7.14.0")` do `build.gradle.kts` e todas as referências no `AndroidManifest.xml`.
- **Resultado:** App abre normalmente. APK ficou menor sem o SDK do Sentry (~2MB a menos).
- **Arquivos alterados:**
  - `apps/ScanEditProduto/app/build.gradle.kts` — removida dependência
  - `apps/ScanEditProduto/app/src/main/AndroidManifest.xml` — removidos meta-data e provider do Sentry

### 2. Tratamento Visível de Erros no App
- **Ação:** Adicionado campo `isFromCache: Boolean` ao `Product` data class. Quando o repositório faz fallback para o cache local, marca `isFromCache = true`. O `ScannerViewModel` propaga um `warning` para a UI, e o `ScannerScreen` exibe um banner laranja: "⚠️ Sem conexão — exibindo versão salva offline".
- **Resultado:** O usuário é informado claramente quando os dados são antigos.
- **Arquivos alterados:**
  - `app/data/model/Product.kt` — adicionado `@Transient isFromCache`
  - `app/data/repository/ProductRepositoryImpl.kt` — `isFromCache = true` no catch
  - `app/ui/screens/ScannerViewModel.kt` — campo `warning` no `ScannerUiState` + mensagens humanizadas
  - `app/ui/screens/ScannerScreen.kt` — banner laranja de aviso offline

### 3. Import Dinâmico do SEFAZ no Backend
- **Ação:** Substituído o `import` estático de `sefaz-service.js` por `import()` dinâmico assíncrono. Todas as chamadas a `tryDownloadInvoice` e `getXmlsFromSefazByPeriod` agora verificam `if (sefazModule)` antes de executar.
- **Resultado:** O backend não trava mais no cold-start do Vercel. As funções SEFAZ só são usadas quando disponíveis.
- **Arquivos alterados:**
  - `server/index.js` — 6 blocos modificados

### 4. Timestamp no Cache Offline (Data de Sincronismo)
- **Ação:** Adicionado o campo `lastSyncedAt: Long` ao `ProductEntity` (Room DB versão 3) e mapeado no `Product` domain model. Ao salvar dados da API no cache local, armazena o timestamp atual. Se o app estiver offline, o `ScannerViewModel` calcula e mostra o tempo relativo (ex: "dados de há 15 minutos") no banner.
- **Resultado:** O usuário sabe o quão atualizada está a informação offline na tela.
- **Arquivos alterados:**
  - `app/data/local/ProductEntity.kt` — adicionada coluna e mapeamento
  - `app/data/local/AppDatabase.kt` — versão incrementada para 3
  - `app/data/model/Product.kt` — adicionado `@Transient lastSyncedAt`
  - `app/data/repository/ProductRepositoryImpl.kt` — gravação e leitura do timestamp
  - `app/ui/screens/ScannerViewModel.kt` — cálculo de tempo relativo `formatTimeAgo`

### 5. Interceptor de Fallback com Retry e Backoff Exponencial
- **Ação:** Atualizado o `FallbackInterceptor` no OkHttp para tentar cada URL (Vercel e secundária) até 3 vezes caso ocorra falha de timeout/rede ou retorne códigos HTTP de erro de servidor (502, 503, 504), aplicando delays exponenciais (1s, 2s, 4s). Se não houver internet (ex: `UnknownHostException`), o loop para imediatamente para evitar lentidão.
- **Resultado:** Maior resiliência contra oscilações de rede e cold starts da hospedagem sem prejudicar o tempo de resposta offline.
- **Arquivos alterados:**
  - `app/data/repository/ProductRepositoryImpl.kt` — retentativas com backoff no interceptor

### 6. Health Check Periódico e Indicador Visual na TopAppBar
- **Ação:** Implementado `checkHealth(): Boolean` que consulta `/api/wakeup` e configurada uma rotina periódica no `ScannerViewModel` a cada 30 segundos. A UI exibe na TopAppBar um badge colorido (`🟢 Online`, `🔴 Offline` ou `🟡...`) de acordo com a saúde do backend, que também responde em tempo real a ações de busca.
- **Resultado:** O lojista visualiza instantaneamente no cabeçalho do app se o backend está respondendo.
- **Arquivos alterados:**
  - `app/data/repository/ProductRepository.kt` & `ProductRepositoryImpl.kt` — declaração e implementação de `checkHealth`
  - `app/ui/screens/ScannerViewModel.kt` — rotina em background e gestão de estado `isOnline`
  - `app/ui/screens/ScannerScreen.kt` — indicador visual de status na TopAppBar

---

## 🚀 Melhorias Possíveis

### Prioridade Alta
1. **Migrar backend para VPS ou Render (saindo do Vercel)**
   - O Vercel Serverless não é ideal para operações que dependem de binários nativos (`node-mde`), filesystem (`readFileSync`), ou conexões persistentes. Um VPS com Node.js rodando permanentemente eliminaria problemas de cold-start.

2. **Adicionar Firebase Crashlytics em substituição ao Sentry**
   - O Crashlytics é mais leve, integra-se nativamente ao Android, e não exige configuração de DSN complexa — basta o `google-services.json`. Isso traria monitoramento de crashes sem o risco de auto-init fatal.

### Prioridade Média
3. **[CONCLUÍDO] Timestamp no cache offline**
   - Mostrar no banner de warning há quanto tempo o dado foi salvo (ex: "⚠️ Sem conexão — dados de há 15 minutos"). Implementado adicionando `lastSyncedAt: Long` ao `ProductEntity` (Room DB versão 3), `Product` e calculando o tempo relativo no `ScannerViewModel`.

4. **[CONCLUÍDO] Retry automático com backoff exponencial**
   - O `FallbackInterceptor` tenta cada URL com tentativas consecutivas (máximo 3 por URL) e backoff exponencial (1s, 2s, 4s) para contornar falhas intermitentes de rede ou cold start do servidor antes de ir para o cache offline.

5. **[CONCLUÍDO] Health check visual na tela principal**
   - Adicionado indicador visual de status (🟢 Online / 🔴 Offline / 🟡...) na TopAppBar da tela principal, realizando checagens a cada 30 segundos ou dinamicamente com base nas interações de busca do usuário.

### Prioridade Baixa
6. **Habilitar ProGuard/R8 no release build**
   - `isMinifyEnabled = false` está configurado no `build.gradle.kts`. Habilitar minificação pode reduzir o APK em 30-50%.

7. **Remover dependências não utilizadas**
   - Auditar se `selfsigned`, `archiver` e `node-mde` são realmente necessários no ambiente de produção.
