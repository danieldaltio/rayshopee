# 🧠 MEMÓRIA PERSISTENTE DO PROJETO - RayShopeeAndroid

## 📌 Visão Geral do Sistema de Memória

**Objetivo:** Criar um mecanismo de memória de contexto persistente para evitar alucinações de IAs e manter modelos atualizados sobre o projeto.

**Público-Alvo:** 
- IAs com menos contexto (ex: minimax 2.5, Claude 3 Haiku)
- Novos desenvolvedores no projeto
- Code review automatizado
- Manutenção futura

---

## 🗂️ ESTRUTURA DE MEMÓRIA

### 1. 📄 ARQUIVOS DE CONTEXTO PRINCIPAIS

```
RayShopeeAndroid/
├── 📄 README.md                          # Documentação principal
├── 📄 IMPLEMENTACAO_CONCLUIDA.md         # Status final da implementação
├── 📄 SPRINT1_REPORT.md                  # Report da Sprint 1
├── 📄 FINAL_REPORT.md                    # Relatório final detalhado
├── 📄 CORRECOES_APLICADAS.md             # Detalhamento técnico
├── 📄 ATUALIZACAO_CONTEXTO.md            # Mudanças de contexto
├── 📄 docs/IMPORTANCIA_ESTRUTURA.md      # Prioridade dos módulos
└── 📄 .memory/                           # Diretório de memória (novo)
    ├── 📄 ARCHITECTURE.md                 # Arquitetura detalhada
    ├── 📄 API_REFERENCE.md                # Referência de APIs
    ├── 📄 TEST_GUIDE.md                   # Guia de testes
    ├── 📄 DEPLOYMENT.md                   # Processo de deploy
    ├── 📄 DECISIONS.md                    # Decisões técnicas
    └── 📄 CONTEXT.json                    # Contexto estruturado
```

---

## 🎯 ARQUIVOS DE MEMÓRIA CRIADOS

### 1. 📄 `.memory/ARCHITECTURE.md`
**Propósito:** Documentação técnica da arquitetura para IAs

```markdown
# Arquitetura do RayShopeeAndroid

## Stack Tecnológico
- **Linguagem:** Kotlin 2.3.10
- **UI:** Jetpack Compose 2026.03.00
- **DI:** Hilt 2.59.2
- **Network:** Retrofit 2.11.0 + Kotlinx Serialization
- **Persistence:** Room 2.8.4
- **Scanner:** CameraX 1.4.1 + MLKit 17.3.0

## Camadas

### 1. UI Layer (ScannerScreen.kt)
- Função: Interface do usuário
- Tecnologia: Jetpack Compose
- Estado: Observa ViewModel via StateFlow
- Ações: Dispara intents para ViewModel

### 2. ViewModel Layer (ScannerViewModel.kt)
- Função: Lógica de apresentação
- Tecnologia: Android ViewModel + Kotlin Coroutines
- Estado: ScannerUiState (StateFlow)
- Padrão: MVVM + Unidirectional Data Flow

### 3. Repository Layer (ProductRepository.kt / Impl)
- Função: Abstração de fontes de dados
- Implementação: ProductRepositoryImpl
- Fontes:
  - Supabase REST (Leitura - primário)
  - Shopee API (Escrita - secundário)

### 4. Data Sources
- **Remote:** Retrofit + OkHttp
- **Local:** Room (configurado, não implementado)

## Data Flow

```
[CameraX + MLKit] → Barcode detectado
        ↓
[ScannerScreen] → Intent (ex: BarcodeScanned)
        ↓
[ScannerViewModel] → Processa intent
        ↓
[ProductRepository] → Busca/Atualiza
        ↓
[Supabase/Shopee API] → Operação
        ↓
[Result] → Atualiza UI
```

## Estados Principais

### ScannerUiState
```kotlin
data class ScannerUiState(
    val isLoading: Boolean = false,
    val product: Product? = null,
    val error: String? = null,
    val lastScannedBarcode: String? = null,
    val isUpdating: Boolean = false
)
```

### Intents Disponíveis
```kotlin
sealed interface ScannerIntent {
    data class BarcodeScanned(val barcode: String) : ScannerIntent
    data class ItemIdSearch(val itemId: String) : ScannerIntent
    data class UpdatePrice(val variationId: String, val price: Double) : ScannerIntent
    data class UpdateStock(val variationId: String, val stock: Int) : ScannerIntent
    data object ClearError : ScannerIntent
    data object ClearProduct : ScannerIntent
}
```

## Decisões Arquiteturais

### Por que MVVM?
- Separação clara de responsabilidades
- Testabilidade (ViewModel testável sem Android)
- Ciclo de vida gerenciado
- Padrão recomendado pelo Google

### Por que Supabase para leitura?
- Mais rápido (cache CDN)
- Sem autenticação complexa
- Escalável
- Custo-benefício

### Por que Shopee API para escrita?
- Autenticação OAuth necessária
- Operações críticas (preço/estoque)
- Controle de acesso
- Auditoria

### Por que Repository Pattern?
- Abstração de fontes de dados
- Facilidade de teste (mock)
- Troca de implementação transparente
- Single Source of Truth

## Convenções de Código

### Nomenclatura
- **Classes:** PascalCase (ProductRepository)
- **Funções:** camelCase (searchByBarcode)
- **Variáveis:** camelCase (productList)
- **Constantes:** UPPER_SNAKE_CASE (MAX_RETRIES)

### Testes
- **Padrão:** Given-When-Then
- **Mocks:** MockK
- **Coroutines:** StandardTestDispatcher
- **Assertions:** JUnit + Kotlin assertions

### Commits
- **Tipos:** feat, fix, docs, refactor, test, chore
- **Formato:** tipo: descrição curta
- **Exemplo:** `fix: resolve duplicate code in repository`

## Padrões de Projeto

### Usados
- **MVVM:** Arquitetura principal
- **Repository:** Abstração de dados
- **Dependency Injection:** Hilt
- **Builder:** Configuração de objetos complexos
- **Factory:** ViewModel (Hilt)

### Evitados
- **Singleton:** Exceto Repository (Hilt gerencia)
- **Static:** Dificulta testes
- **God Objects:** Divisão por camadas
- **Spaghetti Code:** Mantido organizado

## Métricas de Qualidade

### Código
- **Duplicação:** 0%
- **Cobertura:** ~60% (ViewModel)
- **Complexidade Ciclomática:** < 10 (média)
- **Linhas por Classe:** < 200 (média)

### Build
- **Tempo:** ~56s
- **Erros:** 0
- **Warnings:** 4 (não bloqueantes)

### Testes
- **Unitários:** 8 (100% passing)
- **Integração:** 0 (planejado)
- **UI:** 0 (planejado)

## Checklist para Novos Devs

### Antes de Codar
- [ ] Ler README.md
- [ ] Entender arquitetura (este arquivo)
- [ ] Configurar ambiente
- [ ] Rodar build local
- [ ] Rodar testes existentes

### Durante o Desenvolvimento
- [ ] Seguir padrões de código
- [ ] Escrever testes para nova lógica
- [ ] Manter MVVM
- [ ] Documentar mudanças
- [ ] Atualizar este arquivo se necessário

### Antes de Commit
- [ ] Build passing
- [ ] Testes passing
- [ ] Code review (se aplicável)
- [ ] Documentação atualizada
- [ ] Commits semânticos

## Links Úteis

- **Documentação Android:** https://developer.android.com/
- **Jetpack Compose:** https://developer.android.com/jetpack/compose
- **Hilt:** https://dagger.dev/hilt/
- **Retrofit:** https://square.github.io/retrofit/
- **Kotlin Coroutines:** https://kotlinlang.org/docs/coroutines-overview.html

## Contato

Para dúvidas sobre arquitetura:
- Revisar este documento
- Ver README.md
- Consultar código existente
- Perguntar ao time

---

**Última Atualização:** 05/05/2026  
**Versão:** 1.0  
**Manutenção:** Atualizar conforme mudanças arquiteturais