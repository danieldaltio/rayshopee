# SPEC.md - RayShopeeMobile

## Technical Specification

### 1. Architecture

**Pattern:** Expo Router (file-based routing)  
**State Management:** React Hooks (useState, useCallback)  
**API Communication:** REST Fetch

```
src/
├── lib/
│   └── api.ts              # API functions
├── hooks/
│   └── useProductEditor.ts # Product editor hook
└── app/
    ├── (tabs)/
    │   ├── _layout.tsx    # Tab navigation
    │   ├── index.tsx      # Editor screen
    │   └── explore.tsx   # History (placeholder)
    └── _layout.tsx       # Root layout
```

### 2. API Integration

**Base URL:** `http://10.0.2.2:3001/api` (Android emulator)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products/search?sku={sku}` | GET | Search product by SKU |
| `/products/{itemId}` | GET | Get product details |
| `/products/bulk-update` | POST | Update price/stock |

### 3. Data Models

```typescript
interface Variation {
  model_id: number;
  name: string;
  price: number;        // em centavos (x100000)
  stock: number;
  pendingPrice?: number;
  pendingStock?: number;
  dirty?: boolean;
}

interface Product {
  item_id: number;
  item_name: string;
  variations: Variation[];
}
```

### 4. UI/UX Specification

**Color Palette:**
- Primary: #ff5722 (Laranja Shopee)
- Secondary: #4caf50 (Verde sucesso)
- Error: #c62828 (Vermelho)
- Background: #f5f5f5

**Typography:**
- Título: 24px bold
- Subtítulo: 20px bold
- Corpo: 16px regular
- Caption: 14px regular

**Components:**
- SearchInput: Campo de busca com botão
- VariationCard: Card com campos editáveis
- ActionButton: Botão de salvar

### 5. Build Configuration

| Config | Value |
|--------|-------|
| Gradle | 9.5.0 |
| Java | 17 (JDK) |
| Android SDK | 36 |
| Min SDK | 24 |
| Target SDK | 36 |

### 6. Dependencies

- expo: ~55.0.0
- react-native: 0.83.x
- expo-router: ~6.0.0
- expo-constants: ~18.0.0
- react-native-safe-area-context: ~5.6.0

### 7. Error Handling

- HTTP 4xx: Exibir mensagem de erro do servidor
- HTTP 5xx: Exibir "Erro no servidor"
- Timeout: Exibir "Conexão lenta"
- Network error: Exibir "Sem conexão"

---

*Versão: 1.0*  
*Data: 30/04/2026*