# RayShopee / RayHub — Monorepo

Sistema de gestão de estoque, preços e emissão de NF-e para vendedores Shopee Brasil.

> **Dois produtos convivem aqui:**
> - **`apps/RayHub/`** — ERP novo (NestJS + Next.js 16 + Prisma + Supabase + Focus NFe)
> - **`legacy_v1/`** — RayShopee legado em produção (Express + Vite + Kotlin/Compose + Back4app)

---

## 🚀 Quick start

```bash
# 1. Iniciar TUDO (RayHub + Legado)
iniciar.bat

# OU separadamente:
cd apps/RayHub
npm install
npm run dev          # sobe api (3001) + web (3000) em paralelo

cd legacy_v1
npm install
npm run dev          # sobe server (3003) + vite (5173) + ngrok
```

URLs locais:

| Serviço | URL |
|---|---|
| RayHub Web | http://localhost:3000 |
| RayHub API | http://localhost:3001 |
| Legacy API | http://localhost:3003 |
| Legacy Dashboard | http://localhost:5173 |
| Ngrok Tunnel | https://unpaining-transcriptionally-patrick.ngrok-free.dev |

---

## 📁 Estrutura

```
.
├── apps/
│   └── RayHub/                    ★ ERP novo (próxima geração)
│       ├── apps/api/                NestJS backend
│       ├── apps/web/                Next.js 16 frontend
│       ├── prd.md, spec.md, sprint.md
│       └── turbo.json
│
├── legacy_v1/                     ★ RayShopee antigo (em produção)
│   ├── server/                      Express backend (porta 3003)
│   ├── web/                         Vite dashboard (porta 5173)
│   ├── RayShopeeAndroid/            App Android (Kotlin/Compose)
│   ├── whatsapp-bot/                Bot WhatsApp
│   ├── cloud/                       Back4app / Parse config
│   ├── package.json                 Manifest do legado
│   └── Dockerfile, vite.config.js, vercel.json
│
├── archive/                       Subprojetos descontinuados (a investigar)
│   ├── rayShopee/
│   ├── RayShopeeApp/
│   ├── RayShopeeMobile/
│   ├── RayShopeeOrdersAndroid/
│   ├── mobile-dash/                (era "mobile-")
│   ├── mobile-app/
│   ├── EditorProdutoSKU/
│   ├── ShopeeLister/
│   └── misc/                       (scripts one-off, debug.keystore)
│
├── scripts/                       Utilitários pontuais
│   ├── dev/
│   │   ├── iniciar_tudo.bat        Inicia RayHub + Legado
│   │   ├── iniciar_servidores.bat  (legado)
│   │   ├── new-app.ps1
│   │   └── wait_for_render.ps1
│   ├── apk/                        Build/distribuição do Android
│   │   ├── create-qr.py
│   │   ├── generate_qr.py
│   │   ├── serve_apk.py
│   │   └── install_apk.sh
│   ├── deploy/                     Patches de deploy
│   │   ├── patch_vercel.cjs
│   │   ├── patch_vercel2.cjs
│   │   ├── tunnel.ps1
│   │   └── config-b4a.ps1
│   ├── oauth/                      Helpers OAuth Shopee
│   │   ├── oauth.cjs
│   │   ├── get-oauth.js
│   │   └── fix_try.cjs
│   └── scratch/                    Scripts experimentais
│
├── docs/                          Documentação consolidada
│   ├── architecture/
│   │   ├── PROJECT_OVERVIEW.md
│   │   ├── PROJECT_SUMMARY.md
│   │   ├── BEST_PRACTICES.md
│   │   ├── DEPLOYMENT_HANDBOOK_V3.md
│   │   ├── MAPA_DE_IMPORTANCIA.md
│   │   └── TOKEN_OPTIMIZATION.md
│   ├── build/
│   │   ├── BUILD_REPORT.md
│   │   ├── IMPLEMENTATION_SUMMARY.md
│   │   └── FIX_INSTALLATION.md
│   ├── network/
│   │   ├── NETWORK_DEBUG_GUIDE.md
│   │   ├── QR_CODE_PROCEDURE.md
│   │   └── QR_CODE_README.md
│   ├── mcp/
│   │   ├── MCP_CONFIGURATION.md
│   │   ├── MCP_QUICK_REFERENCE.md
│   │   ├── ANTIGRAVITY_MCP_CONFIG.md
│   │   ├── ANTIGRAVITY_OPENCODE_INTEGRATION.md
│   │   ├── OPENCODE_MCP_CONFIG.md
│   │   ├── README_MCP.md
│   │   └── antigravity.mcp.config.json
│   └── legacy/                    Docs históricas do RayShopee v1
│       ├── FINAL_SUMMARY.md
│       ├── v1_bug_post_mortem.md
│       ├── v2_resilience_post_mortem.md
│       ├── SHOPEE_LISTER_PROGRESS.md
│       ├── MEMORIES_AI_TITLE_AND_PRICE_FIX.md
│       └── ... (outros)
│
├── .memory/                      Estado, rascunhos, memória IA (gitignored)
│   ├── .oi_memory.md
│   ├── .env.memory
│   ├── openmemory.db
│   ├── memory_service.py
│   ├── memory_wrapper.py
│   ├── OPENMEMORY_*.md
│   └── PROGRESS_2026-05-11.md
│
├── logs/                         Logs de execução (gitignored)
│
├── debug/                        QRCodes, respostas JSON one-shot (gitignored)
│
├── iniciar.bat                   Atalho → scripts/dev/iniciar_tudo.bat
├── .gitignore                    Reforçado
├── .env.example
└── .python-version
```

---

## 🔐 Configuração (envs)

Cada app tem seu próprio `.env` (não comitar):

| App | Arquivo | O que tem |
|---|---|---|
| RayHub API | `apps/RayHub/apps/api/.env` | Supabase, Shopee, Focus NFe |
| RayHub Web | `apps/RayHub/apps/web/.env.local` | `NEXT_PUBLIC_*` (URL, anon key, API URL) |
| Legacy | `legacy_v1/.env` | Supabase, Shopee |

Copie de `.env.example` em cada um e preencha.

---

## 🏗️ Roadmap

- **Curto prazo:** conectar `FocusNfeService` real no `InvoicesService` (NF-e ainda é mock)
- **Médio prazo:** deploy RayHub (Vercel + Railway/Render)
- **Longo prazo:** migrar usuários do `legacy_v1` para o `RayHub`, descontinuar legado

---

## 📖 Documentação

- **Visão holística do RayHub:** peça um `/status` ou `/overview` ao Mavis
- **PRD do RayHub:** `apps/RayHub/prd.md`
- **SDD do RayHub:** `apps/RayHub/spec.md`
- **Sprint plan:** `apps/RayHub/sprint.md`
- **Histórico do legado:** `docs/legacy/`

---

**Owner:** danieldaltio · **Repo:** github.com/danieldaltio/rayshopee
