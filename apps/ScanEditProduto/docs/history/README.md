# docs/history/ — Documentação legada (FROZEN)

> **Estas 9 docs são históricas e NÃO devem ser editadas.** Foram escritas em 2026-05-05 e refletem o estado do app naquela data (MVVM simples, Supabase hardcoded, 8 testes do ViewModel, sem Room/offline-first, sem fallback de URL).
>
> O app evoluiu bastante desde então (MVI, Room v3, WorkManager, fallback, status indicator). O estado **vivo e correto** está nos 4 docs canônicos da raiz:
>
> - [`../prd.md`](../prd.md)
> - [`../spec.md`](../spec.md)
> - [`../sprint.md`](../sprint.md)
> - [`../HOLISTIC_REPORT.md`](../HOLISTIC_REPORT.md)
>
> **Quando ler estas docs:** só se precisar de contexto histórico, arqueologia de decisão, ou para entender o que mudou.

---

## Índice (na ordem em que foram escritas, 2026-05-05)

| Arquivo | O que era | Por que foi substituído |
|---|---|---|
| [`v1-2026-05-sprint1-report.md`](./v1-2026-05-sprint1-report.md) | Relatório da Sprint 1 (BuildConfig, 8 testes, ProGuard) | Tudo foi superado pelo estado v2 (MVI, Room) |
| [`v1-2026-05-resumo-executivo.md`](./v1-2026-05-resumo-executivo.md) | Sumário executivo do "projeto finalizado" 1.0 | App continuou evoluindo após esta data |
| [`v1-2026-05-relatorio-final.md`](./v1-2026-05-relatorio-final.md) | Relatório final de fechamento do ciclo 1.0 | Idem |
| [`v1-2026-05-final-report.md`](./v1-2026-05-final-report.md) | "FINAL REPORT" (em inglês) | Idem |
| [`v1-2026-05-implementacao.md`](./v1-2026-05-implementacao.md) | Status de implementação 100% concluída | Idem |
| [`v1-2026-05-projeto-finalizado.md`](./v1-2026-05-projeto-finalizado.md) | "PROJETO FINALIZADO" (palavras finais) | Idem |
| [`v1-2026-05-correcoes.md`](./v1-2026-05-correcoes.md) | Detalhamento técnico de 5 correções (MVVM, dup code, imports, fontes, API keys) | As 4 primeiras foram superadas pela v2; a 5ª (API keys) virou P9 do HOLISTIC_REPORT |
| [`v1-2026-05-atualizacao-contexto.md`](./v1-2026-05-atualizacao-contexto.md) | Atualização de IMPORTANCIA_ESTRUTURA.md | Substituída pelo `prd.md` + `HOLISTIC_REPORT.md` |
| [`v1-2026-05-memory-integration.md`](./v1-2026-05-memory-integration.md) | Guia de uso do OpenMemory (`.memory/`) | Continua válido para `.memory/`, mas a "verdade" saiu de `.memory/` para os 4 canônicos |

---

## Lição aprendida (registrada em 2026-07-02)

> **Não acumular 9 docs na raiz.**
> A v1.x terminou "100% concluída, projeto finalizado" — e 2 meses depois, **toda essa documentação estava mentindo**. A reorg SDD (Sprint 0 de 2026-07-02) blinda isso com:
>
> 1. **4 docs canônicos curados e revisados** (em vez de "documentei tudo, fim")
> 2. **Política explícita** (ver `../prd.md` §10) — canônico × histórico × auxiliar
> 3. **Trigger de releitura** — `HOLISTIC_REPORT.md` tem data de "próxima releitura" obrigatória ao fim de cada sprint

Para que serve isto na prática: **se uma decisão técnica sua esbarra com algo nestas 9 docs, ganhe 5 minutos e releia os 4 canônicos antes de confiar.**
