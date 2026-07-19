# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-05-04] ALWAYS use spec-driven approach for new features**
   Do instead: Before writing code, define the spec (input → output) first. Keep it simple: "Function X takes Y, returns Z".

## Shopee API Gotchas
1. **[2026-07-18] get_item_detail returns error_not_found for ALL items**
   Do instead: Use get_item_base_info (returns gtin_code, item_sku, etc). Never use get_item_detail.
2. **[2026-07-18] get_item_base_info returns gtin_code — ALWAYS extract it**
   Do instead: When calling get_item_base_info, read item.gtin_code and sync to Supabase GTIN_EAN_BarCode. This is the ONLY way to get GTIN from Shopee API.
3. **[2026-07-18] search_product and get_item_list(gtin_list) are broken**
   Do instead: Use get_item_base_info + get_model_list only. GTIN search must iterate items and check gtin_code.
4. **[2026-07-18] Backend endpoints MUST accept both snake_case and camelCase**
   Do instead: Always destructure with fallback: `const { item_id, itemId } = req.body; const id = item_id || itemId;`. Android sends camelCase, legacy code used snake_case.

## Backend Naming Convention
1. **[2026-07-18] Android app sends camelCase (itemId, modelId, variationId)**
   Do instead: All new endpoints use camelCase. Legacy endpoints that break: update-cost was the only one with snake_case destructuring.

## Server Management
1. **[2026-07-18] TWO server files: RayShopee/server/ (running) vs legacy_v1/server/ (repo)**
   Do instead: Always edit RayShopee/server/index.js when fixing live issues. legacy_v1 is a different version with extra features (XML downloads, order classification).
2. **[2026-07-18] Cloudflare tunnel URLs change every restart**
   Do instead: Start tunnel with `cloudflared tunnel --url http://localhost:3003`, update NetworkConfig.DEFAULT_CLOUDFLARE_URL, rebuild app.
3. **[2026-07-18] Legacy server needs manual sync of backend fixes**
   Do instead: After fixing RayShopee/server/, also apply same fixes to legacy_v1/server/. Key paths: update-cost camelCase, GTIN extraction, barcode item_id lookup, GTIN search loop.

## Connection & Caching Patterns
1. **[2026-07-18] warmUp() before every API call wastes 45s on flaky networks**
   Do instead: Remove warmUp() from search methods. FallbackUrlInterceptor handles connectivity. checkHealth() still uses /api/wakeup for status indicator.
2. **[2026-07-18] Cache-first background refresh must update UI**
   Do instead: Repository returns cached data immediately. ViewModel launches separate fetchFreshByBarcode/fetchFreshByItemId coroutine that updates UI state when fresh data arrives. Don't use fire-and-forget scope.launch in repository.
3. **[2026-07-18] isOnline must use networkMonitor, not isFromCache**
   Do instead: `isOnline = networkMonitor.isOnline.value` — cache state != network state. A cached product shows `isFromCache=true` even when device is online.

## Shell & Command Reliability
1. **[2026-05-04] Android build always runs from ScanEditProduto/ directory**
   Do instead: cd apps/ScanEditProduto && ./gradlew assembleDebug
2. **[2026-07-18] taskkill on Windows needs // not /**
   Do instead: `taskkill //PID <pid> //F` (Git Bash requires double slash)

## Domain Behavior Guardrails
1. **[2026-05-04] Supabase free tier - keep API key in .oi_memory.md**
   Do instead: Use key from memory, never hardcode. Format: sb_publishable_*

## User Directives
1. **[2026-05-04] Always use spec-driven approach**
   Do instead: Define input/output spec before code.
