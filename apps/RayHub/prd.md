# Product Requirements Document (PRD) - RayHub

## 1. Visão Geral e Objetivo
O **RayHub** é um sistema ERP (Enterprise Resource Planning) moderno, focado em vendedores que operam na **Shopee Brasil**. O sistema visa resolver a dor da gestão descentralizada, unificando pedidos, controle de estoque, cálculo de margens de lucro e, principalmente, automatizando a emissão de Notas Fiscais (NF-e, NFS-e, CF-e) em conformidade com a legislação brasileira.

## 2. Público-Alvo e Personas
*   **Público-Alvo:** Vendedores de e-commerce no Brasil com faturamento médio mensal entre R$ 5.000 e R$ 200.000.
*   **Persona Principal (O Empreendedor):** Gerencia a loja, cuida das finanças e precisa saber exatamente quanto está lucrando após taxas da Shopee e impostos. Precisa de um sistema que emita notas fiscais em lote com poucos cliques.
*   **Persona Secundária (O Operador de Expedição):** Focado na tela de pedidos. Precisa ver o que foi vendido, separar o estoque, gerar a NF-e e imprimir a etiqueta de envio rapidamente.

## 3. Escopo e Módulos Principais

### 3.1. Dashboard
*   **Métricas-chave:** Vendas do dia/semana/mês, lucro bruto/líquido estimado.
*   **Operacional:** Pedidos pendentes de NF, pendentes de envio.
*   **Alertas:** Produtos com estoque abaixo do mínimo configurado.

### 3.2. Gestão de Produtos
*   Cadastro com dados fiscais completos (NCM, CFOP, CST/CSOSN).
*   Cálculo automático de margem de lucro (Preço Venda - Preço Custo - Taxas Estimadas).
*   Controle de estoque e vinculação com `item_id` / `SKU` da Shopee.

### 3.3. Gestão de Pedidos
*   Sincronização via API Oficial da Shopee.
*   Funil de status: Novo → Confirmado → NF Emitida → Enviado → Entregue → Concluído.
*   Seleção em lote para emissão de NF-e.

### 3.4. Emissão de Notas Fiscais (Core)
*   Integração com provedor de NF-e (ex: NFe.io, Focus NFe ou Tecnospeed).
*   Geração e armazenamento de XML e PDF (DANFE).
*   Validação prévia de dados (NCM, CPF/CNPJ).
*   Suporte a cancelamento e carta de correção dentro dos prazos legais.

### 3.5. Integração Shopee (OAuth 2.0)
*   Sincronização de pedidos e produtos.
*   Atualização de status de logística.
*   Suporte a múltiplas contas/lojas conectadas.

### 3.6. Clientes e Relatórios
*   Base de clientes extraída automaticamente dos pedidos.
*   Relatórios de faturamento, impostos e comissões pagas à Shopee.

## 4. Regras de Negócio Críticas
1.  **Relação NF-e x Pedido:** 1:1 rigorosa. Um pedido confirmado não pode ter duas notas válidas.
2.  **Gatilho de Emissão:** A NF-e só é habilitada para pedidos com status "Confirmado" (pagamento aprovado na Shopee).
3.  **Baixa de Estoque:** Automática no momento em que o pedido é sincronizado e validado como pago.
4.  **Comissões Shopee:** Devem ser provisionadas e descontadas dos relatórios de lucro bruto.
5.  **Compliance Fiscal:** Bloqueio rígido de emissão se NCM do produto ou CPF/CNPJ do cliente for inválido.

## 5. Estratégia de Lançamento (Roadmap)
*   **Fase 1 (MVP):** Autenticação, Dashboard, Gestão de Pedidos (Mock/Manual), Emissão Manual de NF-e, Configurações de Empresa.
*   **Fase 2:** Integração Real API Shopee (OAuth), Sincronização automática, Gestão de Produtos e Clientes.
*   **Fase 3:** Relatórios financeiros, Emissão de NF em lote, Suporte Multi-loja.
*   **Fase 4:** Refinamentos de UX, automações avançadas, testes de carga e deploy de alta disponibilidade.
