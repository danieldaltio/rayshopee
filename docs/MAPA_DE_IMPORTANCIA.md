# 🗺️ MAPA DE IMPORTÂNCIA DO PROJETO - RayShopee

Este documento serve como um guia para entender a estrutura do projeto e o nível de criticidade de cada pasta e arquivo.

## 📊 Classificação (Score 1-10)

| Pasta / Arquivo | Score | Descrição | Importância |
| :--- | :---: | :--- | :--- |
| **`server/`** | **10** | **Backend Principal (Node.js)**. Contém toda a lógica de API, autenticação Shopee e integração com banco de dados. | **CRÍTICA** |
| **`apps/ScanAddProdutos/`** | **10** | **App Android Principal**. O aplicativo de listagem e scanner que você usa no celular. | **CRÍTICA** |
| **`.env`** | **10** | **Segredos e Credenciais**. Arquivo com todas as chaves de API. Nunca delete ou perca. | **CRÍTICA** |
| **`web/`** | **9** | **Dashboard Web (React)**. Interface para gestão massiva de produtos e lucros via navegador. | **ALTA** |
| **`scraper_service.py`** | **8** | **Serviço de Scraping**. Script responsável por buscar informações de produtos em marketplaces externos. | **ALTA** |
| **`EditorProdutoSKU/`** | **4** | **App Legado (Expo/TS)**. Versão antiga em React Native/Expo. Sendo substituída pelo ScanAddProdutos. | **BAIXA** |
| **`docs/`** | **7** | **Documentação do Projeto**. Manuais de instalação, guias de build e histórico de progresso. | **MÉDIA** |
| **`apps/`** | **7** | **Suite de Aplicativos**. Contém bots, extensões e apps secundários (Scanner Standalone, Orders, etc). | **MÉDIA** |
| **`scripts/`** | **5** | **Utilitários**. Ferramentas para gerar QR Code, instalar APKs e automações de dev. | **MÉDIA** |
| **`.planning/`** | **3** | **Contexto de IA**. Pastas usadas pelo assistente para entender a estrutura e histórico. | **BAIXA** |
| **`legacy/`** | **1** | **Arquivo Histórico**. Pasta para arquivos obsoletos, correções de bugs antigas e rascunhos. | **NULA** |

---

## 📂 Estrutura de Pastas Organizada

### 1. Núcleo (Core)
- **`server/`**: Código do servidor Express.
- **`web/`**: Código do frontend React (Vite).
- **`apps/ScanAddProdutos/`**: Projeto Android nativo (Kotlin/Compose).
- **`scraper_service.py`**: Lógica de extração de dados.

### 2. Ecossistema (`apps/`)
- **`PedidosEditProduto/`**: Gestão de pedidos.
- **`ScanEditProduto/`**: Scanner de bolso.
- **`whatsapp-bot/`**: Notificações automatizadas.
- **`raycast-extension/`**: Atalhos para produtividade.

### 3. Utilitários (`scripts/`)
- **`util/`**: Contém `generate_qr.py`, `serve_apk.py` e scripts de sincronização de banco de dados.

### 4. Backup e Histórico (`legacy/`)
- **`archive/`**: Local para onde foram movidos os arquivos `fix*.cjs`, `recover*.cjs` e outros rascunhos que acumulavam na raiz.

---

## ⚠️ Avisos de Manutenção

1. **Nunca altere o `.env`** sem fazer um backup.
2. **Ao atualizar o ScanAddProdutos**, lembre-se de conferir se o `SERVER_BASE_URL` no `Constants.kt` coincide com o túnel ativo do Ngrok.
3. **Limpeza Periódica**: A pasta `legacy/archive/` pode ser limpa uma vez por mês se o sistema estiver estável.
