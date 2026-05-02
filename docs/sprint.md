# RayShopee Android - Sprint Planning

## Visão Geral do Sprint

**Sprint:** 1  
**Duração:** 2 semanas  
**Meta:** MVP funcional - Scanner de códigos de barras com edição de preço/estoque

---

## User Stories

### US1: Escanear Código de Barras
**Como** vendedor da Shopee  
**Eu quero** escanear o código de barras do produto com a câmera  
**Para** encontrar rapidamente o produto no sistema  

**Critérios de Aceitação:**
- [ ] Câmera abre ao iniciar o app
- [ ] Preview da câmera é exibido em tempo real
- [ ] Código de barras EAN/UPC é detectado
- [ ] Código detectado é enviado para processamento
- [ ] Cooldown de 2 segundos entre scans

**Tarefas Técnicas:**
- [T1.1] Configurar CameraX no projeto
- [T1.2] Integrar ML Kit Barcode Scanning
- [T1.3] Implementar análise de frames em background
- [T1.4] Adicionar cooldown entre leituras

---

### US2: Visualizar Produto Encontrado
**Como** vendedor da Shopee  
**Eu quero** ver as informações do produto escaneado  
**Para** confirmar que é o produto correto  

**Critérios de Aceitação:**
- [ ] Nome do produto é exibido
- [ ] ID do item é exibido
- [ ] Lista de variações é mostrada
- [ ] Loading é shown durante busca

**Tarefas Técnicas:**
- [T2.1] Criar endpoint de busca na API Mock
- [T2.2] Implementar ProductRepository
- [T2.3] Exibir UI de produto encontrado
- [T2.4] Adicionar indicador de loading

---

### US3: Editar Preço de Variação
**Como** vendedor da Shopee  
**Eu quero** alterar o preço de uma variação do produto  
**Para** atualizar precificação rapidamente  

**Critérios de Aceitação:**
- [ ] Campo editável para preço
- [ ] Validação de valor numérico
- [ ] Requisição POST para API
- [ ] Atualização visual após sucesso
- [ ] Feedback de erro se falhar

**Tarefas Técnicas:**
- [T3.1] Criar endpoint update-price na API Mock
- [T3.2] Implementar UI de edição inline
- [T3.3] Adicionar validação de input
- [T3.4] Tratar resposta de sucesso/erro

---

### US4: Editar Estoque de Variação
**Como** vendedor da Shopee  
**Eu quero** alterar o estoque de uma variação do produto  
**Para** manter inventário atualizado  

**Critérios de Aceitação:**
- [ ] Campo editável para estoque
- [ ] Validação de número inteiro
- [ ] Requisição POST para API
- [ ] Atualização visual após sucesso
- [ ] Feedback de erro se falhar

**Tarefas Técnicas:**
- [T4.1] Criar endpoint update-stock na API Mock
- [T4.2] Implementar UI de edição inline
- [T4.3] Adicionar validação de input
- [T4.4] Tratar resposta de sucesso/erro

---

### US5: Feedback de Estados
**Como** vendedor da Shopee  
**Eu quero** ver feedback visual do status das operações  
**Para** saber se ação foi concluída com sucesso  

**Critérios de Aceitação:**
- [ ] Loading spinner durante operações
- [ ] Mensagem de erro em vermelho
- [ ] Indicador de atualização em progresso
- [ ] Botão para limpar produto atual

**Tarefas Técnicas:**
- [T5.1] Adicionar estados de loading no MVI
- [T5.2] Implementar UI de erros
- [T5.3] Adicionar indicador de updating
- [T5.4] Criar botão "Escanear Outro"

---

## Distribuição de Tarefas

| Semana | Dia | Foco |
|--------|-----|------|
| 1 | Seg-Qua | Setup projeto + CameraX + ML Kit (T1.1-T1.4) |
| 1 | Qui-Sex | Busca produto + Repository (T2.1-T2.4) |
| 2 | Seg-Qua | Edição de preço (T3.1-T3.4) |
| 2 | Qui-Sex | Edição de estoque + Refinamentos (T4.1-T5.4) |

---

## dependencies Técnicas do Sprint

```
Android Project Setup (Day 1)
  ├── gradle-wrapper (9.5.0)
  ├── Kotlin (2.3.10)
  ├── Compose BOM (2026.03.00)
  └── Hilt (2.53.1)

Camera Integration (Day 2-3)
  ├── CameraX (1.4.1)
  └── ML Kit Barcode (17.3.0)

Network (Day 4)
  ├── Retrofit (2.11.0)
  └── OkHttp (4.12.0)
```

---

## Definition of Done

- [ ] Código compila sem erros
- [ ] Todas as funcionalidades implementadas
- [ ] Teste manual de cada user story
- [ ] Sem crashes em uso normal
- [ ] Código segue convenções do projeto

---

## Risco Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| API Mock não retorna dados | Alta | Alto | Criar mock local primeiro |
| ML Kit não detecta barcode | Média | Alto | Testar com múltiplos formatos |
| Permissão camera negada | Média | Médio | Handle gracefully com UI |

---

## Próximos Passos (Post-Sprint)

1. Adicionar Room para cache offline
2. Implementar busca manual por nome
3. Adicionar sincronização periódica
4. Criar testes unitários
5. Build de release com signing