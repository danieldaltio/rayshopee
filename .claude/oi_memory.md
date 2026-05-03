# RayShopee - Projeto Summary

## O que é
- App Android (Scanner de código de barras para Shopee)
- Backend Node.js/Express
- Supabase para Database

## Stack
- Frontend: Android (Kotlin/Jetpack Compose + CameraX)
- Backend: Node.js + Express
- Database: Supabase
- API: Shopee Partner API

## Ficheiros Important:
- `RayShopeeAndroid/` - App Android
- `server/index.js` - Backend
- `Dockerfile` - Para deployment
- `.env` - Credenciais (NÃO commitar)

## Credenciais Atuais (não Commitar!)
- SHOPEE_PARTNER_ID: 2033681
- SHOPEE_PARTNER_KEY: shpk4a6252796a70685050567067776267416d6168655744716772694f4c794c
- SHOPEE_SHOP_ID: 263124677
- SHOPEE_ACCESS_TOKEN: eyJhbGciOiJIUzI1NiJ9.CJGQfBABGMXtu30gASiE39jPBjDShJzsBzgBQAFICQ.9qrMLDi5bxfOGggYALEmHmJFA0j83__5EzUxtlu0bcE
- SHOPEE_REFRESH_TOKEN: eyJhbGciOiJIUzI1NiJ9.CJGQfBABGMXtu30gAiiE39jPBjCw8N6_AzgBQAFICQ.GdBNv0iganfZGMUprTwu1E-kcF9nQp4_D__8oAtg4BI
- SUPABASE_URL: https://xcvazbfjkiddzlxwynni.supabase.co
- SUPABASE_KEY: sb_publishable_RTWk8m9hY8S6KAhFBCY3rw_d9Kw3-Fw

## Back4app (não funciona ainda)
- App: rayshopee api (Container)
- URL: rayshopeeapi-0ts7mvyr.b4a.run
- Problema: Health check retorna 404 mesmo servidor iniciando

## GitHub
- Repo: https://github.com/danieldaltio/rayshopee

## To-Do:
1. Resolver problema Back4app (health check 404)
   - Ativar Web Hosting?
   - Contactar suporte?
2. alternativa: Render, Fly.io, Railway

## Comandos Úteis:
```bash
# Build Android
cd RayShopeeAndroid && gradlew.bat assembleDebug

# Servidor local
npm run dev:server

# Deploy manual (seResolver)
git add . && git commit -m "fix: ..." && git push origin master
```