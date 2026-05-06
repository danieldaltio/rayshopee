# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-05-04] ALWAYS use spec-driven approach for new features**
   Do instead: Before writing code, define the spec (input → output) first. Keep it simple: "Function X takes Y, returns Z".

## Shell & Command Reliability
1. **[2026-05-04] Android build always runs from RayShopeeAndroid/ directory**
   Do instead: cd RayShopeeAndroid && ./gradlew assembleDebug

## Domain Behavior Guardrails
1. **[2026-05-04] Supabase free tier - keep API key in .oi_memory.md**
   Do instead: Use key from memory, never hardcode. Format: sb_publishable_*

## User Directives
1. **[2026-05-04] Always use spec-driven approach**
   Do instead: Define input/output spec before code.