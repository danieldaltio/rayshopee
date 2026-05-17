# RayShopee - AI Title Optimization & Price Cents Precision Fix

**Date**: May 17, 2026  
**Status**: ✅ COMPLETE & STABLE

---

## 🎯 Goal
1. **Otimização de Títulos com IA (SEO)**: Integrar um botão de melhoria automática no formulário de títulos utilizando modelos de IA (Gemini / Groq) seguindo boas práticas de e-commerce, aplicando Title Case nas palavras e fornecendo feedback visual de carregamento na UI.
2. **Correção de Precisão de Ponto Flutuante nos Preços**: Solucionar o problema onde preços digitados como `19.90` apareciam na Shopee como `19.89` por conta de imprecisões decimais na conversão em centavos.

---

## 🛠️ What WORKED

### 1. AI SEO Title Optimization (Melhoria com IA)
- **AiRepository interface**: Adicionado método `improveTitle(title: String, category: String?): String` permitindo reutilizar o desacoplamento de IAs.
- **Implementações**:
  - `GeminiService.kt`: Implementado prompt refinado com regras de SEO para e-commerce no Brasil (Formato: `[Produto] + [Marca] + [Característica Principal] + [Benefício]`). Estrito limite de 120 caracteres, sem emojis ou caixa alta excessiva.
  - `GroqAiRepositoryImpl.kt`: Adicionada implementação compatível de redundância com Llama 3 via Groq API.
- **Kotlin Post-Transformation**: Adicionada higienização de aspas extras e transformação para **Title Case** forçada no próprio app Android:
  ```kotlin
  cleanText.split(" ").joinToString(" ") { word -> 
      word.lowercase().replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() } 
  }
  ```
  Isso garante que todas as palavras comecem com letra maiúscula mesmo se a IA ignorar a instrução no prompt.
- **Visual Feedback & UI/UX**:
  - `EditorViewModel.kt`: Adicionado o StateFlow `isImprovingTitle` e a rotina assíncrona executada no `viewModelScope`.
  - `EditorScreen.kt`: Campo de título (`OutlinedTextField`) ganha um botão com ícone `Icons.Default.AutoAwesome`. Ao processar, exibe um `CircularProgressIndicator` de loading e desabilita cliques repetitivos.

### 2. Price Cents Precision Fix (Correção do Ponto Flutuante)
- **O Problema**: A digitação de `19.90` (ou outros centavos) sofria perdas de precisão na multiplicação por 100 em ponto flutuante binário (`19.90 * 100 = 1989.9999999999998`). Fazer o cast direto para Long `.toLong()` descartava a parte decimal, deixando o valor em `1989` centavos (`19.89`).
- **A Solução**: Substituído o cast truncado pelo arredondamento matemático preciso `kotlin.math.round(...)` nos seguintes pontos:
  - **`EditorViewModel.kt`** (Preço Principal):
    ```kotlin
    val cents = kotlin.math.round(doubleValue * 100).toLong()
    ```
  - **`EditorScreen.kt`** (Preços de Variações):
    ```kotlin
    val cents = kotlin.math.round((clean.toDoubleOrNull() ?: 0.0) * 100).toLong()
    ```
- O valor agora é arredondado com precisão impecável (e.g. `1990` centavos), refletindo perfeitamente `R$ 19,90` na Shopee.

### 3. OpenMemory Persistence
- Aprovada a integração da biblioteca `openmemory-py`.
- **`scratch/save_session_memories.py`** foi executado com sucesso gravando as decisões de arquitetura e histórico de correções de bugs diretamente no banco de dados local SQLite (`openmemory.sqlite`).

---

## ⚠️ What DIDN'T WORK / Warnings (Pendente)

- **Avisos de Ícones Depreciados**: 
  - Durante o Gradle Build, o compilador Kotlin ainda emite avisos (*warnings*) de depreciação quanto à migração de ícones herdados (`Icons.Filled.ArrowBack`, `Icons.Filled.RotateLeft` e `Icons.Filled.RotateRight`) para a biblioteca `Icons.AutoMirrored`. 
  - *Status:* O app compila perfeitamente sem erros, mas futuramente é recomendado atualizar esses imports específicos nas demais telas.
- **Moshi Kapt deprecation**:
  - Warning avisando que o Moshi Kotlin CodeGen com Kapt será descontinuado na versão 2.0, recomendando migração futura para KSP.

---

## 📂 Files Modified
1. **`ShopeeLister/app/.../domain/repository/AiRepository.kt`**: Definição do método do contrato.
2. **`ShopeeLister/app/.../data/remote/gemini/GeminiService.kt`**: Chamada ao Gemini e transformação do título em Title Case.
3. **`ShopeeLister/app/.../data/repository/AiRepositoryImpl.kt`**: Encaminhamento Hilt do repositório de IA principal.
4. **`ShopeeLister/app/.../data/repository/GroqAiRepositoryImpl.kt`**: Implementação secundária Groq compatível.
5. **`ShopeeLister/app/.../ui/editor/EditorViewModel.kt`**: Controle de estado do loader e lógica de arredondamento de preços.
6. **`ShopeeLister/app/.../ui/editor/EditorScreen.kt`**: Adição de botões da IA de Título e arredondamento nas Variações de Preço.

---

## 💾 Stored in OpenMemory Database
- **Memory 1:** `Feature: SEO Title Improvement using Generative AI (Gemini & Groq)` -> *Category: `code_patterns`*
- **Memory 2:** `Bug: Floating point precision issue where price of 19.90 was saved/shown in Shopee as 19.89.` -> *Category: `bug_fixes`*
