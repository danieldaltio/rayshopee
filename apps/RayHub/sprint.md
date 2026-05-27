# Plano de Sprints - RayHub (Fase 1: MVP)

A Fase 1 foca em entregar o núcleo de valor indispensável do ERP: permitir o login, visualizar um dashboard básico, gerenciar cadastros vitais, manipular pedidos (com dados mockados inicialmente) e executar o fluxo de emissão da NF-e com sucesso.

## Sprint 1: Setup e Fundações (Semanas 1-2)
**Objetivo:** Estabelecer a infraestrutura do monorepo, modelar o banco de dados e garantir autenticação segura.
*   [ ] Inicializar Monorepo (Turborepo) com o app `web` (Next.js) e `api` (NestJS).
*   [ ] Configurar projeto no Supabase (Database e Auth).
*   [ ] Definir Schema no Prisma e executar as primeiras Migrations (entidades: User, Company).
*   [ ] Implementar fluxo de Login/Logout no frontend (Supabase Auth).
*   [ ] Implementar validação de Token JWT (Guard) no NestJS.
*   [ ] Configurar Tailwind CSS, shadcn/ui e temas base no frontend.

## Sprint 2: Core UX e Módulo de Cadastros (Semanas 3-4)
**Objetivo:** Permitir que o vendedor insira as informações e produtos necessários para emissão fiscal.
*   [ ] Criar Layout Base da Aplicação (Sidebar, Header de navegação).
*   [ ] Desenvolver tela de Configurações da Empresa (inserção de CNPJ, Inscrição Estadual, Endereço Fiscal, upload de Certificado A1).
*   [ ] Desenvolver CRUD de Produtos, com foco em abas fiscais (NCM, CFOP obrigatórios).
*   [ ] Implementar lógicas no frontend (Zustand) para cálculo de preço e margem de lucro na tela de cadastro.

## Sprint 3: Gestão de Pedidos e Clientes (Semanas 5-6)
**Objetivo:** Preparar os dados das vendas e entidades compradoras.
*   [ ] Desenvolver CRUD básico de Clientes (CPF/CNPJ, Endereço).
*   [ ] Desenvolver Tela de Listagem de Pedidos (Tabela complexa com filtros e paginação).
*   [ ] Criar Endpoints no backend para injeção manual de pedidos (Mock para testes do fluxo de faturamento).
*   [ ] Desenvolver Tela de Detalhes do Pedido exibindo comprador, endereço, itens e cálculos de totais.

## Sprint 4: O Coração - Emissão de NF-e (Semanas 7-8)
**Objetivo:** Completar o ciclo vital emitindo a primeira Nota Fiscal Eletrônica válida em ambiente de Homologação.
*   [ ] Integrar API do provedor de NF-e escolhido (ex: Focus NFe/NFe.io) via Adapter no NestJS.
*   [ ] Criar endpoint no backend que consolida Dados do Pedido + Dados da Empresa + Dados do Produto e envia para a SEFAZ.
*   [ ] Criar fluxo "Gerar NF-e" na UI (Tela de detalhes do pedido), com feedback visual de carregamento.
*   [ ] Implementar tratamento robusto de retornos (Sucesso vs. Rejeição da SEFAZ com erro amigável).
*   [ ] Salvar links do PDF (DANFE) e XML gerados no banco de dados e criar botões para download no frontend.
*   [ ] Conduzir testes End-to-End (E2E) do fluxo principal em homologação.
