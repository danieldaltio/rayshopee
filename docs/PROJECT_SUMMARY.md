# RayShopee Ecosystem - v1.1.0

Este documento descreve a arquitetura e funcionalidades do ecossistema RayShopee, composto por um backend centralizador e dois aplicativos Android específicos.

## 1. Arquitetura Geral
O sistema utiliza um backend Node.js que atua como ponte entre a **API da Shopee (v2)** e o banco de dados **Supabase**. A conexão móvel é garantida através de um túnel **Ngrok** com domínio estático.

- **Servidor:** Node.js (Porta 3003)
- **Túnel:** Ngrok (`unpaining-transcriptionally-patrick.ngrok-free.dev`)
- **Banco de Dados:** Supabase (PostgreSQL) para custos, estoques e EANs.

---

## 2. Componentes do Sistema

### 📦 RayShopee Backend (`/server`)
O cérebro do sistema. Gerencia autenticação OAuth, refresh de tokens e agregação de dados financeiros.
- **Endpoints Chave:**
  - `GET /api/orders/to-ship`: Retorna pedidos prontos para envio com lucro previsto e códigos de barras.
  - `POST /api/products/update-cost`: Atualiza o preço de custo no Supabase.
  - `POST /api/products/update-stock`: Atualiza o estoque diretamente na Shopee.
  - `POST /api/products/update-price`: Atualiza o preço de venda na Shopee.
  - `POST /api/products/sync-ean`: Sincroniza produtos da Shopee com o banco local.

### 📱 PedidosEditProduto Android (`/apps/PedidosEditProduto`)
Aplicativo focado na gestão de pedidos e expedição.
- **Funcionalidades:**
  - Listagem de pedidos em tempo real.
  - Exibição de produtos, variações e quantidades.
  - Visualização de **Código de Barras (EAN)** com função de copiar.
  - **Edição Rápida:** Alteração de custo, estoque e preço com um toque.
  - Cálculo de lucro previsto baseado em taxas configuráveis.

### 📱 RayShopee Android (Scanner) (`/RayShopeeAndroid`)
Aplicativo original focado na conferência de estoque via scanner.
- **Funcionalidades:**
  - Leitura de códigos de barras para identificação de produtos.
  - Consulta rápida de estoque e preço.

---

## 3. Configuração e Execução

### Servidor
```bash
npm run dev
```
Este comando inicia o servidor Express, o Vite (frontend) e o túnel Ngrok simultaneamente.

### Aplicativos Android
- Ambos utilizam **Jetpack Compose**.
- A URL do servidor deve ser configurada no ícone de engrenagem dentro de cada app.
- **ID de Aplicativo:** 
  - Scanner: `com.rayshopee.app`
  - Orders: `com.rayshopee.app.orders` (Permite instalação paralela)

---

## 4. Histórico de Versões
- **v1.0.0:** Lançamento inicial do Scanner.
- **v1.1.0:** 
  - Lançamento do **RayShopee Orders**.
  - Adição de Códigos de Barras e Edição Rápida.
  - Estabilização do túnel Ngrok e persistência Supabase.

---
*Última atualização: 06 de Maio de 2026*