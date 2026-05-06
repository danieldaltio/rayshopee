# Sprint.md - RayShopeeMobile

## Product Backlog

### Sprint 1: Fundamental (Semana 1)
**Meta:** MVP funcional com busca

| ID | Task | Estimativa | Status |
|----|------|-----------|----------|
| S1T1 | Configurar projeto Expo SDK 55 | 2h | Concluído |
| S1T2 | Criar estrutura de diretórios | 1h | Concluído |
| S1T3 | Implementar API client | 2h | Concluído |
| S1T4 | Criar tela de busca por SKU | 4h | Concluído |
| S1T5 | Testar integração API | 2h | ✅ |

**Definition of Done:**
- [x] Código commitado
- [x] Build compila

---

### Sprint 2: Edição (Semana 2)
**Meta:** Editar preço e estoque

| ID | Task | Estimativa | Status |
|----|------|-----------|----------|
| S2T1 | Criar VariationCard component | 3h | Feito |
| S2T2 | Implementar edição de preço | 2h | Feito |
| S2T3 | Implementar edição de estoque | 2h | Feito |
| S2T4 | Adicionar validação de input | 2h | Feito |
| S2T5 | Testes unitários | 3h | ⏳ |

**Definition of Done:**
- [x] Componente renderiza corretamente
- [x] Input valida números
- [x] Estados dirty funcionam

---

### Sprint 3: Integração (Semana 3)
**Meta:** Sincronizar com API

| ID | Task | Estimativa | Status |
|----|------|-----------|----------|
| S3T1 | Implementar bulkUpdate | 3h | ✅ |
| S3T2 | Mostrar feedback de sucesso | 1h | ✅ |
| S3T3 | Mostrar feedback de erro | 1h | ✅ |
| S3T4 | Loading states | 1h | ✅ |
| S3T5 | Teste E2E | 4h | ⏳ |

**Definition of Done:**
- [x] API retorna sucesso
- [x] API retorna erro
- [x] Loading visível

---

### Sprint 4: Release (Semana 4)
**Meta:** Build APK para produção

| ID | Task | Estimativa | Status |
|----|------|-----------|----------|
| S4T1 | Configurar Gradle 9.5 | 2h | 🔄 |
| S4T2 | Configurar Java 25 | 1h | 🔄 |
| S4T3 | Resolver conflitos build | 4h | ⏳ |
| S4T4 | Gerar APK debug | 1h | ⏳ |
| S4T5 | Revisão de código | 2h | ⏳ |

**Definition of Done:**
- [ ] APK gerar sem erros
- [ ] App instalar no Android
- [ ] Funcionalidade básica funcionar

---

## Impedimentos

### Blocado
1. **Gradle 9.5 + Java 25:** Erro JvmVendorSpec IBM_SEMERU
   - Solução: Usar Java 17 ou esperar fix

## Próximos Passos

1. ✅ Sprint 1-3: Funcionalidades completas
2. 🔄 Sprint 4: Resolver build
3. ⏳ Testes finais
4. ⏳ Publicação

---

*Atualizado: 30/04/2026*  
*Sprint atual: 4/4*