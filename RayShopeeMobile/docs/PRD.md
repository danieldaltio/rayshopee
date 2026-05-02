# PRD - RayShopeeMobile

## Product Requirements Document

### 1. Visão Geral do Produto

**Nome do Produto:** RayShopeeMobile  
**Tipo:** Aplicativo Android (Expo/React Native)  
**Resumo:** Aplicativo mobile para gestão de estoque e preços de produtos na plataforma Shopee.  
**Público-alvo:** Vendedores e gestores de lojas Shopee

### 2. Problema

Lojistas precisam alterar rapidamente preços e estoque de produtos Shopee diretamente pelo celular, sem necessidade de acessar o painel web.

### 3. Objetivos do Produto

- Permitir busca de produtos por SKU
- Visualizar variações de produtos (tamanhos, cores, etc)
- Editar preço de cada variação
- Editar estoque de cada variação
- Salvar alterações em lote via API

### 4. KPIs e Métricas

- Tempo médio para atualização de preço/estoque
- Número de atualizações por sessão
- Taxa de sucesso de sincronização com API

### 5. Requisitos Funcionais

| ID | Requisito | Prioridade |
|----|----------|----------|
| RF01 | Busca de produto por SKU | Alta |
| RF02 | Listar variações do produto | Alta |
| RF03 | Editar preço por variação | Alta |
| RF04 | Editar estoque por variação | Alta |
| RF05 | Salvar alterações em lote | Alta |
| RF06 | Feedback de sucesso/erro | Média |

### 6. Requisitos Não-Funcionais

- Tempo de resposta < 3s para busca
- Funcionar offline parcialmente
- Interface responsiva
- Suporte a Android 7+

### 7. Stack Tecnológica

- **Framework:** Expo SDK 55 / React Native 0.83
- **Linguagem:** TypeScript
- **API:** REST (Backend Express)
- **Build:** Gradle 9.5 / Java 17

### 8. Cronograma Previsto

- **Sprint 1:** UI básica + busca por SKU
- **Sprint 2:** Edição de preço/estoque
- **Sprint 3:** Integração API + testes
- **Sprint 4:** Build release APK

---

*Versão: 1.0*  
*Data: 30/04/2026*  
*Autor: Equipe de Desenvolvimento*