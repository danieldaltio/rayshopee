# RayShopee Android - Product Requirements Document (PRD)

## 1. Visão Geral do Projeto

**Nome do Projeto:** RayShopee Android  
**Tipo:** Aplicativo móvel nativo Android  
**Resumo:** Aplicativo Android para scanear códigos de barras de produtos da Shopee, listar variações e permitir edição de preço e estoque.  
**Usuários Alvo:** Vendedores da Shopee que precisam atualizar preços e estoque rapidamente usando o celular.

---

## 2. Escopo do Projeto

### 2.1 Funcionalidades Principais

| ID | Funcionalidade | Descrição | Prioridade |
|----|----------------|-----------|------------|
| F1 | Scanner de Código de Barras | Câmera escaneia códigos de barras EAN/UPC usando ML Kit | Alta |
| F2 | Busca de Produto | Consulta produto na API da Shopee via código de barras | Alta |
| F3 | Listagem de Variações | Exibe todas as variações (cores, tamanhos) do produto | Alta |
| F4 | Edição de Preço | Atualiza preço de cada variação via API | Alta |
| F5 | Edição de Estoque | Atualiza estoque de cada variação via API | Alta |
| F6 | Feedback Visual | Indicadores de carregamento e sucesso/erro | Média |

### 2.2 Funcionalidades Futuras (Roadmap)
- Sincronização automática periódica
- Histórico de alterações
- Busca manual por nome/ID
- Modo offline com cache local
- Relatórios de vendas

---

## 3. Arquitetura Técnica

### 3.1 Stack Tecnológico
| Componente | Tecnologia | Versão |
|-------------|------------|--------|
| Linguagem | Kotlin | 2.3.10 |
| UI Framework | Jetpack Compose | BOM 2026.03.00 |
| Build System | Gradle | 9.5.0 |
| Android Gradle Plugin | AGP | 9.0.0 |
| Target SDK | Android 15 | API 35 |
| Min SDK | Android 8.0 | API 26 |
| Injeção de Dependência | Hilt | 2.53.1 |
| Rede | Retrofit + OkHttp | 2.11.0 / 4.12.0 |
| Camera | CameraX | 1.4.1 |
| Leitura de Barras | ML Kit Barcode | 17.3.0 |
| Async | Kotlin Coroutines + Flow | 1.9.0 |
| Arquitetura | MVI (Model-View-Intent) | - |

### 3.2 Arquitetura MVI

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                            │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐  │
│  │   Composable│────▶│  ViewModel   │────▶│   Intent    │  │
│  │    (View)   │◀────│   (State)    │◀────│  (Events)   │  │
│  └──────────────┘     └──────────────┘     └─────────────┘  │
│         │                    │                              │
│         │              StateFlow                            │
│         ▼                    ▼                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    UI State                           │   │
│  │  { loading, product, error, lastBarcode, isUpdating }│   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
│  ┌──────────────┐     ┌──────────────┐     ┌────────────┐  │
│  │   Repository │────▶│   API Client │────▶│  Backend   │  │
│  │   (Interface)│     │  (Retrofit)  │     │  Server    │  │
│  └──────────────┘     └──────────────┘     └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Estrutura de Pacotes

```
com.rayshopee.app/
├── RayShopeeApplication.kt      # Application class (Hilt)
├── MainActivity.kt             # Entry point
├── di/                         # Dependency Injection
│   └── RepositoryModule.kt
├── data/
│   ├── model/
│   │   └── Product.kt          # Domain models
│   └── repository/
│       ├── ProductRepository.kt     # Interface
│       └── ProductRepositoryImpl.kt # Implementation
└── ui/
    ├── theme/
    │   └── Theme.kt            # Material3 theme
    └── screens/
        ├── ScannerScreen.kt   # UI Composable (View)
        └── ScannerViewModel.kt # MVI ViewModel
```

---

## 4. Requisitos Não-Funcionais

| Requisito | Descrição |
|-----------|-----------|
| Performance | Scanner deve responder em < 100ms após leitura |
| Confiabilidade | Taxa de sucesso de scan > 95% |
| Compatibilidade | Funciona em Android 8.0+ |
| Offline | Modo de operação básico offline com cache |
| Segurança | Dados sensíveis armazenados com criptografia |

---

## 5. Integrações

### 5.1 API Backend (Existente)
- **Endpoint Base:** `http://10.0.2.2:3001` (emulador Android)
- **Endpoints:**
  - `GET /api/products/barcode?barcode={code}` - Buscar produto
  - `POST /api/products/update-price` - Atualizar preço
  - `POST /api/products/update-stock` - Atualizar estoque

### 5.2 Supabase (Existente)
- Usado pelo backend para cache de dados da Shopee

---

## 6. Critérios de Aceitação

- [ ] App compila sem erros com `./gradlew assembleDebug`
- [ ] Câmera abre e inicia preview ao abrir o app
- [ ] Código de barras é detectado e processado
- [ ] Produto é buscado e variações são exibidas
- [ ] Preço pode ser editado e atualizado
- [ ] Estoque pode ser editado e atualizado
- [ ] Feedback visual de loading e erros funciona
- [ ] Layout segue guidelines Material3

---

## 7. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| API da Shopee instável | Alto | Cache local com Room |
| Câmera não funciona em alguns dispositivos | Médio | Verificar compatibilidade |
| Código de barras mal posicionado | Baixo | UI guidance para posicionar |
| Timeout de rede | Médio | Retry automático |

---

## 8. Glossário

| Termo | Definição |
|-------|-----------|
| MVI | Model-View-Intent - padrão de arquitetura unidirecional |
| Variação | Uma variante do produto (ex: cor, tamanho) |
| EAN/UPC | Tipos de código de barras suportados |
| AGP | Android Gradle Plugin |
| Hilt | Framework de injeção de dependência do Google |