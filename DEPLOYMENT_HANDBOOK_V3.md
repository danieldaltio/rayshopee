# 🚀 RayShopee - Deployment Handbook (v3.0)

Este documento registra a arquitetura e as configurações da versão estável atual, onde o aplicativo Android comunica-se de forma independente com o servidor em nuvem.

## 🏗️ Arquitetura do Sistema
O ecossistema RayShopee agora funciona em uma arquitetura de nuvem híbrida:

1.  **Android App (Mobile):** Atua como o scanner de hardware. Está configurado para apontar diretamente para a API no Render via HTTPS.
2.  **Backend (Render.com):** Servidor Node.js que processa a lógica de negócio, autenticação Shopee e integração com o banco de dados.
3.  **Database (Supabase):** Armazena os custos dos produtos e metadados adicionais que não existem na Shopee.
4.  **API Shopee (Live):** Fonte oficial de preços e estoque.

---

## 🌐 Endereços Oficiais
-   **API (Produção):** `https://rayshopee.onrender.com`
-   **Frontend (Dashboard):** `https://rayshopee.onrender.com` (após build)
-   **Repositório GitHub:** `https://github.com/danieldaltio/rayshopee`

---

## ⚙️ Variáveis de Ambiente (Configuradas no Render)
Para o sistema funcionar, as seguintes chaves devem estar presentes no painel do Render:
- `SHOPEE_PARTNER_ID`: ID do desenvolvedor Shopee.
- `SHOPEE_PARTNER_KEY`: Chave secreta da API Shopee.
- `SHOPEE_SHOP_ID`: ID da sua loja.
- `SHOPEE_REFRESH_TOKEN`: Token para renovação automática da sessão.
- `SUPABASE_URL` / `SUPABASE_KEY`: Credenciais do banco de dados.

---

## 📱 Informações do Aplicativo Android
-   **Versão Atual:** `v3` (versionCode: 3)
-   **Configuração de Rede:** Permite tráfego HTTP para testes locais, mas utiliza HTTPS por padrão para o Render.
-   **Dependência:** O app **não depende mais do PC ligado**. Ele funciona via 4G/5G de qualquer lugar.

---

## 💡 Observações de Operação (Importante!)
1.  **Cold Start (Modo Soneca):** Como estamos no plano gratuito do Render, o servidor "dorme" após 15 minutos parado. A primeira bipagem do dia pode demorar **~40 segundos**. As bipagens seguintes são instantâneas.
2.  **Renovação de Token:** O servidor renova o `Access Token` da Shopee automaticamente a cada 4 horas. Caso o `Refresh Token` expire (após 30 dias), basta acessar a URL da API no navegador e refazer o login OAuth.
3.  **Logs de Erro:** Você pode acompanhar o que está acontecendo em tempo real pelo painel do Render em "Logs".

---

## 🛠️ Como Atualizar no Futuro
Para subir mudanças novas:
1.  Faça as alterações no código localmente.
2.  Rode `git add .`, `git commit` e `git push origin master`.
3.  O Render detectará o novo código e fará o deploy automático.

---
**Status da Versão:** ✅ Operacional | ✅ Produção | ✅ Estável
**Data:** 06/05/2026
