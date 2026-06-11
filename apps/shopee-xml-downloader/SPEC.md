# Shopee-Baixador-de-XML-devolucoes-e-cancelados

## 1. Concept & Vision

App web para baixar todas as XMLs de notas fiscais de pedidos **devolvidos** ou **cancelados** da Shopee. O usuário clica em "Buscar Pedidos" e recebe uma lista de pedidos com NF-e gerada (mesmo que cancelados/devolvidos), com botão para baixar o XML. Interface minimalista, focada em eficiência.

## 2. Design Language

- **Aesthetic**: Dark mode, mesmo tema do RayShopee (tons escuros com accent cyan/green)
- **Colors**: `#06060f` bg, `#10b981` accent (sucesso), `#ef4444` danger (cancelados), `#f59e0b` warning (devoluções)
- **Typography**: Inter, system-ui fallback
- **Components**: Botões com ícones, cards para pedidos, modal de download

## 3. Layout & Structure

```
/apps/shopee-xml-downloader/
├── SPEC.md
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── api.js          # chamadas ao backend
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── OrderList.jsx
│   │   ├── OrderCard.jsx
│   │   └── LoadingSpinner.jsx
│   └── utils/
│       └── format.js   # formatação de data/valor
└── server/
    └── index.js        # rotas Express para Shopee API
```

## 4. Features & Interactions

### 4.1 Busca de Pedidos (CANCELLED + RETURNED)
- **Input**: data inicial + data final (padrão: últimos 30 dias)
- **Botão "Buscar Pedidos"**: GET /api/xml-downloader/orders?time_from=&time_to=
- **Filtros**: status (CANCELLED/RETURNED/ALL), buscador por order_sn
- **Resultado**: lista de pedidos com informações da NF-e

### 4.2 Download de XML
- **Botão "Baixar XML"**: GET /api/xml-downloader/orders/:orderSn/xml
- **Retorno**: arquivo XML como attachment (Content-Disposition)
- **Feedback**: spinner durante download, toast de sucesso/erro

### 4.3 Bulk Download
- **Checkbox em cada card**: selecionar pedidos
- **Botão "Baixar Selecionados (ZIP)"**: GET /api/xml-downloader/zip?orders=sn1,sn2,sn3
- **Retorno**: arquivo .zip com múltiplos XMLs

## 5. Component Inventory

| Component | States | Description |
|-----------|--------|-------------|
| Header | default | Título do app, status da API Shopee |
| OrderCard | default, selected, loading, error | Card com info do pedido + status badge |
| OrderList | loading, empty, populated | Lista de OrderCards |
| DateRangePicker | default | Inputs de data inicial e final |
| FilterBar | default | Select de status + input de busca |
| LoadingSpinner | spinning | Spinner SVG animado |
| Toast | success, error, info | Notificações temporárias |

## 6. Technical Approach

### Backend (Express)

#### GET /api/xml-downloader/orders
Busca pedidos com status específicos através da Shopee API.

**Query params**:
- `time_from` (unix timestamp)
- `time_to` (unix timestamp)
- `status` (CANCELLED | RETURNED | ALL, padrão: ALL)

**Response**:
```json
{
  "orders": [
    {
      "orderSn": "string",
      "status": "CANCELLED | RETURNED",
      "createTime": 1700000000000,
      "totalAmount": 99.90,
      "items": [{ "name": "...", "quantity": 1, "price": 99.90 }],
      "invoiceData": {
        "invoiceNumber": "123456",
        "serie": "001",
        "nfeId": "NFe123456"
      },
      "hasXml": true
    }
  ],
  "total": 50,
  "hasMore": true
}
```

#### GET /api/xml-downloader/orders/:orderSn/xml
Faz download do XML da NF-e.

**Response**: `Content-Type: application/xml` com `Content-Disposition: attachment; filename="NFe{orderSn}.xml"`

#### GET /api/xml-downloader/zip
Faz download de múltiplos XMLs em um ZIP.

**Query params**: `orders` (lista de order_sn separada por vírgula)

**Response**: `Content-Type: application/zip`

### API da Shopee a serem usadas

1. **`/api/v2/order/get_order_list`** - Lista pedidos por período
   - Parâmetro `order_status_list`: filtrar CANCELLED, COMPLETED (retorna/devolvido)
   
2. **`/api/v2/order/get_order_detail`** - Detalhes do pedido
   - `response_optional_fields`: `item_list,total_amount,invoice_data`
   
3. **`/api/v2/invoice/get_invoice_data`** ou **`/api/v2/invoice/download_invoice`** - Obter XML da NF-e
   - Verificar endpoint correto na documentação Shopee

### Frontend (React + Vite)

- **State**: orders[], selectedOrders[], isLoading, dateRange, statusFilter, searchQuery
- **Effects**: fetchOrders ao clicar em buscar, fetchXml ao baixar
- **Styling**: CSS modules ou styled-components (追随 existing web app style)

## 7. Data Flow

```
User clicks "Buscar Pedidos"
    → React: POST /api/xml-downloader/orders
    → Express: shopeeGet /api/v2/order/get_order_list (status=CANCELLED,COMPLETED)
    → Express: shopeeGet /api/v2/order/get_order_detail (por batch de order_sn)
    → Express: filtra apenas os que têm invoice_data
    → React: exibe lista de OrderCards
    → User clica "Baixar XML"
    → React: GET /api/xml-downloader/orders/:orderSn/xml
    → Express: shopeePost /api/v2/invoice/download_invoice
    → Express: retorna arquivo XML
    → Browser: download trigger
```

## 8. Edge Cases

- **Token Shopee expirado**: Server faz auto-refresh (já existe no index.js)
- **Nenhum pedido encontrado**: mostrar empty state com mensagem
- **XML não disponível**: mostrar badge "XML não disponível" no card
- **Download falhou**: toast de erro com mensagem
- ** Muitos pedidos**: paginação no backend (hasMore + next_offset)
