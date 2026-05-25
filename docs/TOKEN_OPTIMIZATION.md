# Token Optimization — Padrão do Projeto

> Guia de melhores práticas para economizar tokens sem perder qualidade.  
> **Data:** 2026-05-20 | **Economia estimada:** ~9.300 tokens/sessão

---

## 1. MCP Management — Sistema de Tiers

| Tier | Comportamento | Quando Usar |
|:---|:---|:---|
| 🟢 **Always-On** | Carrega no boot, sempre disponível | MCPs usados em >50% das sessões |
| 🟡 **Lazy/Disabled** | Desabilitado por padrão, ativar manualmente | MCPs usados <20% das sessões |
| 🔴 **Removido** | Não existe na config | MCPs nunca usados ou sem API key |

### Configuração Atual

| MCP | Tier | Antigravity | Cursor | OpenCode |
|:---|:---|:---|:---|:---|
| `openmemory` | 🟢 Always-On | ✅ | ✅ | ✅ |
| `sequential-thinking` | 🟢 Always-On | ✅ | ✅ | ✅ |
| `notebooklm` | 🟡 Lazy | — | disabled | enabled:false |
| `openspec` | 🟡 Lazy | — | disabled | enabled:false |
| `linear` | 🔴 Removido | — | — | — |

### Como Ativar MCPs Lazy

```bash
# Via script
python scripts/util/setup_mcp.py --enable notebooklm
python scripts/util/setup_mcp.py --disable notebooklm
python scripts/util/setup_mcp.py --status

# Manual (Cursor): editar .cursor/mcp.json → "disabled": false
# Manual (OpenCode): editar .opencode/mcp.json → "enabled": true
```

### Regra dos 3 MCPs
> Máximo **3 MCPs ativos** simultaneamente para manter contexto limpo.

---

## 2. Context Engineering — Prompts Eficientes

### ✅ Faça
- **Prompts diretos**: "Adicione validação no campo email" vs ~~"Poderia por favor adicionar uma validação..."~~
- **1 tarefa por prompt**: chunks atômicos são mais baratos e precisos
- **Referenciar arquivos**: "no arquivo `CloudinaryService.kt`" vs colar código inteiro
- **Formato estruturado**: listas e tabelas > parágrafos longos

### ❌ Evite
- Colar blocos de código grandes no prompt (referencie o arquivo)
- Acumular >20 mensagens por sessão
- Repetir instruções que já estão no system prompt
- Filler words: "por favor", "gostaria que", "seria possível"

---

## 3. Memory Files — Regras de Armazenamento

| Regra | Limite |
|:---|:---|
| Tamanho máximo por arquivo | **2KB** (~50 linhas) |
| Credenciais | **Nunca em plain text** → referenciar `.env` |
| Código-fonte | **Nunca inline** → referenciar caminho do arquivo |
| Atualizações | Comprimir mensalmente |

### Estrutura Padrão

```markdown
# [Título] — Resumo

## Contexto (2-3 linhas)
## Arquivos Envolvidos (lista de paths)
## Status & Próximos Passos
## Referências (links para .env, docs/)
```

---

## 4. Conversation Hygiene — Sessões Limpas

| Prática | Impacto |
|:---|:---|
| Nova sessão a cada mudança de contexto | Alto |
| Resumir a cada ~10 mensagens | Médio |
| Não reabrir sessões antigas | Médio |
| Usar `/handover` para transferir estado | Alto |

---

## 5. Model Routing — Modelo Certo para Tarefa Certa

| Tarefa | Modelo Recomendado |
|:---|:---|
| Raciocínio complexo, arquitetura | Claude Opus / GPT-4o |
| Código rotineiro, refactoring simples | Claude Sonnet / GPT-4o-mini |
| Formatação, renaming, fixes triviais | Claude Haiku / Flash |

---

## 6. Checklist Mensal de Otimização

- [ ] Revisar MCPs: algum novo que deveria ser lazy? Algum lazy que virou frequente?
- [ ] Verificar arquivos de memória: tamanho < 2KB?
- [ ] Limpar credenciais expostas em qualquer arquivo
- [ ] Atualizar este guia se novas práticas surgirem
