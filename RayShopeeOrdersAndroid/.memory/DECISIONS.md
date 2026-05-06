# 📝 Decision Log - RayShopeeAndroid

## 📋 Registro de Decisões Técnicas

Este documento registra todas as decisões arquiteturais e técnicas importantes tomadas durante o desenvolvimento do RayShopeeAndroid.

---

## 🗓️ Histórico de Decisões

### 2026-05-05 | Arquitetura MVVM

**Decisão:** Adotar MVVM como padrão arquitetural

**Contexto:** 
- Projeto precisava de estrutura clara
- Facilitar testes unitários
- Separação de responsabilidades

**Alternativas Consideradas:**
1. MVC - Muito acoplado
2. MVP - Mais boilerplate
3. MVVM - Melhor para Compose
4. MVI - Complexo demais para projeto atual

**Justificativa:**
- Padrão recomendado pelo Google
- Integração nativa com Jetpack Compose
- Lifecycle-aware
- Testável

**Consequências:**
- ✅ Código mais organizado
- ✅ Testes fáceis de escrever
- ✅ Manutenção facilitada
- ⚠️ Curva de aprendizado para novos devs

**Status:** ✅ Implementado

---

### 2026-05-05 | Fonte de Dados: Supabase vs Shopee API

**Decisão:** Usar Supabase para leitura, Shopee API para escrita

**Contexto:** 
- Necessidade de busca rápida
- Operações críticas de preço/estoque
- Autenticação diferente

**Alternativas Consideradas:**
1. Tudo via Shopee API - Lento para buscas
2. Tudo via Supabase - Sem controle de escrita
3. Supabase (read) + Shopee (write) - Balanceado
4. Cache local agressivo - Complexidade

**Justificativa:**
- Supabase: CDN rápido, sem auth complexa
- Shopee API: Controle, auditoria, segurança
- Separação clara de responsabilidades

**Consequências:**
- ✅ Buscas em ~200ms
- ✅ Escritas seguras
- ✅ Custo-benefício
- ⚠️ Duas fontes para manter

**Status:** ✅ Implementado

---

### 2026-05-05 | Dependency Injection: Hilt

**Decisão:** Usar Hilt para DI

**Contexto:** 
- Injetar dependências (Repository, ViewModel)
- Gerenciar lifecycle
- Facilitar testes

**Alternativas Consideradas:**
1. Manual (new) - Difícil testar
2. Dagger puro - Muito boilerplate
3. Koin - Menos suporte oficial
4. Hilt - Padrão Google

**Justificativa:**
- Suporte oficial Android
- Integração com ViewModel
- Reduz boilerplate
- Boa documentação

**Consequências:**
- ✅ Injeção simples
- ✅ Testes com mock fáceis
- ✅ Lifecycle gerenciado
- ⚠️ Tempo de build aumenta levemente

**Status:** ✅ Implementado

---

### 2026-05-05 | Network Layer: Retrofit + Kotlinx Serialization

**Decisão:** Retrofit com Kotlinx Serialization

**Contexto:** 
- Consumir APIs REST
- Serializar/deserializar JSON
- Coroutines support

**Alternativas Consideradas:**
1. Retrofit + Gson - Mais lento
2. Retrofit + Moshi - Ok
3. Retrofit + Kotlinx - Moderno
4. Ktor Client - Muda arquitetura

**Justificativa:**
- Kotlin-first
- Performance melhor
- Menos reflection
- Coroutines nativo

**Consequências:**
- ✅ Type-safe
- ✅ Performance
- ✅ Menos código
- ⚠️ Configuração inicial mais complexa

**Status:** ✅ Implementado

---

### 2026-05-05 | Persistência: Room (Configurado, não usado)

**Decisão:** Configurar Room, mas não implementar cache ainda

**Contexto:** 
- Possibilidade de cache offline
- Complexidade adicional
- MVP focado em funcionalidade

**Alternativas Consideradas:**
1. Implementar agora - Atrasar features
2. Configurar e implementar - Mais trabalho
3. Configurar só - Preparar futuro
4. Não usar - Perder funcionalidade

**Justificativa:**
- Preparar infraestrutura
- Não bloquear features
- Implementar quando necessário

**Consequências:**
- ✅ Pronto para quando precisar
- ✅ Sem atrasar features
- ⚠️ Funcionalidade offline não disponível

**Status:** ⚠️ Configurado, pendente implementação

---

### 2026-05-05 | Scanner: CameraX + MLKit

**Decisão:** CameraX com MLKit Barcode Scanning

**Contexto:** 
- Ler códigos de barras
- Integração Android
- Performance

**Alternativas Consideradas:**
1. ZXing - Legado, mais lento
2. MLKit - Moderno, Google
3. Biblioteca paga - Custo
4. Custom - Muito trabalho

**Justificativa:**
- Google mantém
- Fácil integração
- Performance boa
- Gratuito

**Consequências:**
- ✅ Fácil implementação
- ✅ Performance aceitável
- ✅ Manutenção garantida
- ⚠️ Algumas limitações de formato

**Status:** ✅ Implementado

---

### 2026-05-05 | State Management: StateFlow

**Decisão:** Usar StateFlow para estado do ViewModel

**Contexto:** 
- Gerenciar estado da UI
- Reatividade
- Lifecycle-aware

**Alternativas Consideradas:**
1. LiveData - Legacy
2. StateFlow - Moderno
3. SharedFlow - Eventos
4. RxJava - Pesado

**Justificativa:**
- Coroutines native
- Lifecycle-aware
- Testável
- Moderno

**Consequências:**
- ✅ Integração perfeita
- ✅ Testes fáceis
- ✅ Performance
- ⚠️ Learning curve

**Status:** ✅ Implementado

---

### 2026-05-05 | BuildConfig: URLs via BuildConfig

**Decisão:** Mover URLs para BuildConfig

**Contexto:** 
- URLs hardcoded
- Precisa de configuração por ambiente
- Segurança

**Alternativas Consideradas:**
1. Manter hardcoded - Simples mas ruim
2. BuildConfig - Configurável
3. Remote Config - Complexo
4. Environment files - Mais setup

**Justificativa:**
- Configuração por build variant
- Preparação para múltiplos ambientes
- Padrão Android

**Consequências:**
- ✅ Configurável
- ✅ Seguro
- ✅ Padrão
- ⚠️ BuildConfig.API_KEY ainda hardcoded

**Status:** ✅ Implementado (parcial)

---

### 2026-05-05 | ProGuard: Regras Completas

**Decisão:** Configurar ProGuard completo para release

**Contexto:** 
- App em produção
- Tamanho menor
- Segurança

**Alternativas Consideradas:**
1. Sem ProGuard - Simples mas inseguro
2. Regras mínimas - Meio termo
3. Regras completas - Seguro
4. R8 full - Mais agressivo

**Justificativa:**
- Segurança em produção
- Tamanho reduzido
- Obfuscação

**Consequências:**
- ✅ App menor
- ✅ Mais seguro
- ✅ Performance melhor
- ⚠️ Debug mais complexo

**Status:** ✅ Implementado

---

### 2026-05-05 | Testes: Foco em ViewModel

**Decisão:** Testar ViewModel primeiro

**Contexto:** 
- Recursos limitados
- Maior ROI
- Mais fácil de testar

**Alternativas Consideradas:**
1. Testar tudo - Demorado
2. ViewModel only - Foco
3. Repository only - Importante
4. UI tests - Frágeis

**Justificativa:**
- Lógica crítica no ViewModel
- Mais fácil de testar
- Cobertura boa
- Menos flaky

**Consequências:**
- ✅ Testes rápidos
- ✅ Cobertura boa
- ✅ Confiança
- ⚠️ Outras camadas não testadas

**Status:** ✅ Implementado

---

## 📊 Matriz de Decisões

| Decisão | Impacto | Risco | Reversibilidade |
|---------|---------|-------|-----------------|
| MVVM | Alto | Baixo | Média |
| Supabase+Shopee | Alto | Médio | Alta |
| Hilt | Médio | Baixo | Alta |
| Retrofit+Kotlinx | Médio | Baixo | Média |
| Room (config) | Baixo | Baixo | Alta |
| CameraX+MLKit | Alto | Baixo | Baixa |
| StateFlow | Médio | Baixo | Média |
| BuildConfig | Médio | Baixo | Alta |
| ProGuard | Médio | Médio | Média |
| Testes ViewModel | Médio | Baixo | Alta |

---

## 🔄 Processo de Decisão

### Como Decidimos

1. **Identificar problema**
2. **Listar alternativas**
3. **Avaliar trade-offs**
4. **Consultar time**
5. **Decidir**
6. **Documentar**
7. **Implementar**
8. **Revisitar (se necessário)**

### Critérios

- ✅ Manutenibilidade
- ✅ Testabilidade
- ✅ Performance
- ✅ Segurança
- ✅ Tempo de implementação
- ✅ Curva de aprendizado
- ✅ Comunidade/documentação

---

## 📝 Template para Novas Decisões

```markdown
### YYYY-MM-DD | Título da Decisão

**Decisão:** [O que foi decidido]

**Contexto:** 
- [Por que precisamos decidir]

**Alternativas Consideradas:**
1. [Opção 1]
2. [Opção 2]
3. [Opção 3]

**Justificativa:**
- [Por que escolhemos esta opção]

**Consequências:**
- ✅ Positivas
- ⚠️ Negativas

**Status:** [Implementado/Pendente/Cancelado]
```

---

## 🎯 Decisões Futuras

### Pendentes

1. **Cache Offline**
   - Quando implementar?
   - Estratégia de sincronização?

2. **Analytics**
   - Qual ferramenta?
   - Quais eventos?

3. **Crash Reporting**
   - Firebase Crashlytics?
   - Sentry?

4. **CI/CD**
   - GitHub Actions?
   - Fastlane?

### Em Revisão

1. **Arquitetura Multi-módulo**
   - Benefícios vs Complexidade
   - Quando fazer?

2. **Jetpack Compose 100%**
   - Migrar tudo?
   - Gradual?

---

## 📚 Aprendizados

### O Que Funcionou

1. **MVVM** - Código organizado
2. **Hilt** - DI sem dor
3. **StateFlow** - Reatividade simples
4. **Testes** - Confiança no código

### O Que Aprender

1. **Room** - Implementar quando necessário
2. **CI/CD** - Automatizar mais
3. **Analytics** - Dados para decisões
4. **Performance** - Monitorar mais

---

## 🔍 Revisão Periódica

### Quando Revisar

- [ ] A cada sprint
- [ ] Antes de features grandes
- [ ] Quando surgirem problemas
- [ ] Mudança de tecnologia

### Quem Revisar

- Tech Lead
- Arquiteto
- Time de desenvolvimento
- Stakeholders

---

## 📞 Contato

Para discutir decisões:
- Tech channel
- Code review
- Reuniões de arquitetura

---

**Documento Vivo:** Atualizar conforme novas decisões  
**Última Atualização:** 05/05/2026  
**Versão:** 1.0

--- END OF LOG ---