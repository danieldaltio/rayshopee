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

---

## 🚀 Melhorias Possíveis

### Prioridade Alta
1. **Migrar backend para VPS ou Render (saindo do Vercel)**
   - O Vercel Serverless não é ideal para operações que dependem de binários nativos (`node-mde`), filesystem (`readFileSync`), ou conexões persistentes. Um VPS com Node.js rodando permanentemente eliminaria problemas de cold-start.

2. **Adicionar Firebase Crashlytics em substituição ao Sentry**
   - O Crashlytics é mais leve, integra-se nativamente ao Android, e não exige configuração de DSN complexa — basta o `google-services.json`. Isso traria monitoramento de crashes sem o risco de auto-init fatal.

### Prioridade Média
3. **Timestamp no cache offline**
   - Mostrar no banner de warning há quanto tempo o dado foi salvo: "⚠️ Offline — dados de 3 dias atrás". Isso requer adicionar `lastSyncedAt: Long` ao `ProductEntity`.

4. **Retry automático com backoff exponencial**
   - O `FallbackInterceptor` atual tenta cada URL uma única vez. Implementar retry com backoff (1s, 2s, 4s) antes de desistir e ir para o cache.

5. **Health check visual na tela principal**
   - Um ícone de status (🟢 online / 🔴 offline) na TopAppBar indicando se o backend está acessível, usando o endpoint `/api/wakeup`.

### Prioridade Baixa
6. **Habilitar ProGuard/R8 no release build**
   - `isMinifyEnabled = false` está configurado no `build.gradle.kts`. Habilitar minificação pode reduzir o APK em 30-50%.

7. **Remover dependências não utilizadas**
   - Auditar se `selfsigned`, `archiver` e `node-mde` são realmente necessários no ambiente de produção.
