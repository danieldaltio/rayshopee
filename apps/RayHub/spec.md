# Software Design Document (SDD) - RayHub

## 1. Arquitetura do Sistema
O RayHub adotará uma arquitetura de Monorepo utilizando **Turborepo** para acomodar o Frontend e o Backend de forma modular, permitindo o compartilhamento de código (ex: tipos, interfaces e validações Zod).

### 1.1. Stack Tecnológica Recomendada (Padrão 2026 Gratuito/Moderno)
*   **Monorepo:** Turborepo
*   **Frontend:** Next.js 14/15+ (App Router), React, TypeScript.
*   **Estilização:** Tailwind CSS + shadcn/ui (Componentes acessíveis, customizáveis e modernos).
*   **Gerenciamento de Estado:** Zustand (Global) + TanStack Query v5 (Data Fetching, Caching).
*   **Backend:** NestJS (Framework Node.js fortemente tipado, modular, ideal para regras de negócio de ERPs complexos).
*   **Banco de Dados:** PostgreSQL hospedado no **Supabase** (Alto desempenho, tier gratuito generoso).
*   **Autenticação:** Supabase Auth (Suporta JWT nativo, RBAC, RLS e integração fluida com PostgreSQL).
*   **ORM:** Prisma ORM (Tipagem segura, migrações facilitadas e DX excelente).
*   **Hospedagem:**
    *   Frontend: Vercel (Gratuito, otimizado nativamente para Next.js).
    *   Backend: Railway ou Render (Tier inicial gratuito/barato, excelente para NestJS via Docker).

## 2. Modelo de Dados Relacional (Prisma Schema Reference)
As entidades principais mapeadas para o banco:
*   **User:** id, email, password_hash, role (ADMIN, OPERATOR).
*   **Company (Tenant):** id, razao_social, cnpj, dados fiscais, url_certificado (criptografado/seguro).
*   **Product:** id, name, sku, barcode, ncm, cfop, price, cost, stock, shopee_item_id.
*   **Order:** id, shopee_sn, status, subtotal, total, shopee_comissao, customer_id.
*   **Invoice:** id, order_id, status, xml_url, pdf_url, access_key, sefaz_message.
*   **Customer:** id, name, cpf_cnpj, shopee_username, address fields.

## 3. Design de APIs e Integrações
*   **Comunicação Frontend-Backend:** API RESTful construída no NestJS e documentada via Swagger (OpenAPI).
*   **Segurança (Auth):** Rotas protegidas por JWT Validator (AuthGuard) verificando o token originado do Supabase no cabeçalho das requisições.
*   **Integração Shopee:**
    *   Serviço isolado dentro do NestJS gerenciando limites de requisição (Rate Limiters).
    *   Fila de processamento em background (via BullMQ + Redis) para sincronização automática de pedidos e webhook handling.
*   **Integração NF-e (Módulo Adaptável):**
    *   Uso do padrão Adapter (Adapter Pattern) para facilitar a troca de provedores de emissão no futuro (ex: NFe.io, Emitesoft, Focus NFe). Foco inicial em uma API REST simples que lide com JSON.

## 4. Requisitos Não Funcionais e Segurança
*   **Conformidade LGPD:** Logs de deleção de usuários, ofuscação de dados inativos após um período predeterminado.
*   **Certificados:** Certificados digitais A1 (.pfx) não devem ser persistidos abertamente; devem ser armazenados em buckets seguros (ex: Supabase Storage com RLS) ou criptografados a nível de banco.
*   **Tratamento de Erros SEFAZ:** Repasse claro de erros descritivos da SEFAZ para o frontend evitar retrabalho de suporte.
