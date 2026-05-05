# Prompt para o Frontend — Adaptação para Fábrica de Papelão

## Contexto Geral

O backend passou por uma expansão significativa para suportar o fluxo completo de uma **fábrica de papelão personalizado**. Foram adicionados 4 novos módulos (`paperboard`, `orders`, `shipments`, `financial`) e campos novos em módulos existentes (`productions`, `products`). O frontend precisa implementar todas as telas, fluxos e integrações correspondentes.

Todos os endpoints exigem autenticação via Bearer token (JWT). As rotas abaixo assumem o prefixo `/api` (ou o que estiver configurado no frontend).

---

## 1. MÓDULO: Configuração de Papelão (Paperboard Config)

### O que é
Cada orçamento (`budget`) pode ter uma configuração de papelão associada, com as dimensões físicas da caixa, gramatura, quantidade e informações sobre clichê. O backend calcula automaticamente a `area` (comprimento × largura × altura) e o `estimatedCost`.

### Regras de negócio importantes
- `outsourcedCut` (corte terceirizado) **só é permitido quando `quantity >= 500`**
- Se `isFirstPurchase = true`, os campos `clicheCost` e `clichePrice` **são obrigatórios**
- A configuração é única por orçamento (upsert — cria ou substitui)

### Endpoints

#### `GET /budgets/:budgetId/paperboard`
Retorna a configuração de papelão do orçamento. Retorna 404 se não existir.

**Resposta de sucesso (200):**
```json
{
  "id": "uuid",
  "budgetId": "uuid",
  "length": 30.5,
  "width": 20.0,
  "height": 15.0,
  "gramatura": 200,
  "quantity": 1000,
  "usesFullSheet": false,
  "outsourcedCut": true,
  "isFirstPurchase": false,
  "clicheCost": null,
  "clichePrice": null,
  "area": 9150.0,
  "estimatedCost": 1850.00,
  "createdAt": "2026-05-05T10:00:00.000Z",
  "updatedAt": "2026-05-05T10:00:00.000Z"
}
```

#### `PUT /budgets/:budgetId/paperboard`
Cria ou atualiza a configuração de papelão do orçamento.

**Body (JSON):**
```json
{
  "length": 30.5,
  "width": 20.0,
  "height": 15.0,
  "gramatura": 200,
  "quantity": 1000,
  "usesFullSheet": false,
  "outsourcedCut": true,
  "isFirstPurchase": false,
  "clicheCost": null,
  "clichePrice": null
}
```

**Campos obrigatórios:** `length`, `width`, `height`, `gramatura`, `quantity`
**Campos opcionais:** `usesFullSheet` (default `false`), `outsourcedCut` (default `false`), `isFirstPurchase` (default `false`), `clicheCost`, `clichePrice`

Retorna o objeto `PaperboardConfig` atualizado (200).

#### `DELETE /budgets/:budgetId/paperboard`
Remove a configuração. Retorna 204.

### Telas/componentes sugeridos
- Na página de **detalhes do orçamento**: adicionar uma seção "Configuração de Papelão" com formulário inline ou modal
- Exibir o `estimatedCost` calculado de forma destacada (custo estimado de produção)
- Mostrar `area` em cm² ou m² de forma legível
- Checkbox para `usesFullSheet`, `outsourcedCut`, `isFirstPurchase`
- Mostrar/ocultar campos `clicheCost` e `clichePrice` condicionalmente quando `isFirstPurchase = true`
- Desabilitar `outsourcedCut` e mostrar tooltip quando `quantity < 500`

---

## 2. MÓDULO: Pedidos (Orders)

### O que é
Um `order` representa a **confirmação de produção** de um orçamento aprovado. Ele possui itens com quantidades a produzir. As quantidades são rastreadas em três estágios: **total** (combinado), **produzido** (atualizado pela produção) e **expedido** (enviado ao cliente).

### Status do pedido
| Status | Significado |
|--------|-------------|
| `production` | Nenhum item foi totalmente expedido |
| `partial` | Pelo menos um item foi expedido, mas não todos |
| `completed` | Todos os itens foram 100% expedidos |

O status é calculado **automaticamente** pelo backend a cada expedição.

### Endpoints

#### `GET /orders`
Lista pedidos. Suporta filtros por query string.

**Query params opcionais:**
- `status`: `production` | `partial` | `completed`
- `budgetId`: UUID do orçamento

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "budgetId": "uuid",
    "status": "production",
    "items": [
      {
        "id": "uuid",
        "orderId": "uuid",
        "budgetItemId": "uuid-ou-null",
        "description": "Caixas 30x20x15 kraft",
        "quantityTotal": 1000,
        "quantityProduced": 400,
        "quantityShipped": 200,
        "remaining": 200,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

> **Nota:** `remaining = quantityProduced - quantityShipped` (quanto foi produzido mas ainda não expedido)

#### `GET /orders/:id`
Retorna um pedido específico com seus itens. Retorna 404 se não encontrado.

#### `POST /orders`
Cria um pedido a partir de um orçamento **aprovado**.

**Body (JSON):**
```json
{
  "budgetId": "uuid",
  "items": [
    {
      "budgetItemId": "uuid-opcional",
      "description": "Caixas 30x20x15 kraft",
      "quantityTotal": 1000
    },
    {
      "description": "Caixas pequenas 15x10x8",
      "quantityTotal": 500
    }
  ]
}
```

**Regra:** O orçamento precisa estar com status `aprovado` (ou equivalente). O backend retorna 409 caso não esteja.

Retorna o pedido criado (201).

#### `PATCH /orders/:id/items/:itemId/produced`
Atualiza a quantidade **produzida** de um item do pedido.

**Body (JSON):**
```json
{
  "quantityProduced": 600
}
```

**Regras:**
- `quantityProduced` não pode ser maior que `quantityTotal`
- `quantityProduced` não pode ser menor que `quantityShipped` (já expedido)

Retorna o item atualizado (200).

### Telas/componentes sugeridos
- **Lista de pedidos** (`/orders`): tabela com filtros por status e orçamento, barra de progresso mostrando `quantityProduced / quantityTotal`
- **Detalhe do pedido** (`/orders/:id`): lista de itens com progresso de produção e expedição, botão "Registrar Expedição"
- **Criar pedido**: modal ou página a partir da tela de detalhes do orçamento aprovado, campos para descrição e quantidade de cada item
- **Atualizar produzido**: botão/campo inline na linha de cada item do pedido

---

## 3. MÓDULO: Expedições (Shipments)

### O que é
Uma `shipment` registra **quantas unidades de cada item** de um pedido foram fisicamente despachadas ao cliente em uma determinada data. Um pedido pode ter **múltiplas expedições parciais**.

### Endpoints

#### `GET /orders/:orderId/shipments`
Lista todas as expedições de um pedido.

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "orderId": "uuid",
    "notes": "Entrega parcial - nota fiscal 12345",
    "shippedAt": "2026-05-05T14:00:00.000Z",
    "items": [
      {
        "id": "uuid",
        "shipmentId": "uuid",
        "orderItemId": "uuid",
        "quantity": 200
      }
    ],
    "createdAt": "..."
  }
]
```

#### `GET /shipments/:id`
Retorna uma expedição específica. Retorna 404 se não encontrada.

#### `POST /shipments`
Registra uma nova expedição.

**Body (JSON):**
```json
{
  "orderId": "uuid",
  "notes": "Nota fiscal 12345 — entrega parcial",
  "shippedAt": "2026-05-05T14:00:00.000Z",
  "items": [
    {
      "orderItemId": "uuid",
      "quantity": 200
    },
    {
      "orderItemId": "outro-uuid",
      "quantity": 100
    }
  ]
}
```

**Campos obrigatórios:** `orderId`, `items`
**Campos opcionais:** `notes`, `shippedAt` (se omitido usa a data/hora atual)

**Regra crítica:** Para cada item, `quantidadeJáExpedida + quantity` não pode ultrapassar `quantityProduced`. O backend retorna 422 com a mensagem de erro.

Retorna a expedição criada (201). O status do pedido é recalculado automaticamente.

### Telas/componentes sugeridos
- **Histórico de expedições** na tela de detalhes do pedido: timeline ou tabela com data, notas e itens expedidos
- **Modal "Registrar Expedição"**: para cada item do pedido, exibir um campo numérico com o máximo disponível (`remaining`). Incluir campo de data e observações
- Exibir alerta visual quando `remaining = 0` (item totalmente expedido)
- Exibir o status do pedido atualizado após cada expedição

---

## 4. MÓDULO: Financeiro (Financial)

### O que é
Gerencia as **contas a receber** de cada pedido. Após a criação de um pedido, é possível gerar parcelas (installments) e marcar cada uma como paga. Também há um endpoint de **fluxo de caixa** com visão consolidada.

### Status de parcela
| Status | Significado |
|--------|-------------|
| `pending` | Aguardando pagamento |
| `paid` | Pago |
| `overdue` | Vencido (pode ser definido manualmente ou calculado pelo frontend) |

### Endpoints

#### `GET /financial/cashflow`
Retorna o resumo financeiro consolidado.

**Resposta (200):**
```json
{
  "expectedIncome": 45000.00,
  "expectedExpenses": 28000.00,
  "cashflow": 17000.00,
  "receivablesByMonth": [
    { "month": "2026-05", "amount": 15000.00 },
    { "month": "2026-06", "amount": 30000.00 }
  ]
}
```

- `expectedIncome`: soma de todas as parcelas **pendentes** (a receber)
- `expectedExpenses`: soma de custos de orçamentos **aprovados** (a pagar)
- `cashflow`: `expectedIncome - expectedExpenses`
- `receivablesByMonth`: breakdown das parcelas pendentes por mês (`YYYY-MM`)

#### `GET /financial/orders/:orderId/receivables`
Lista todas as parcelas de um pedido.

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "orderId": "uuid",
    "amount": 5000.00,
    "dueDate": "2026-06-05",
    "paidAt": null,
    "status": "pending",
    "installment": 1,
    "notes": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

#### `POST /financial/receivables/installments`
Gera (ou regenera) as parcelas de um pedido. **Apaga as parcelas existentes e recria.**

**Body (JSON):**
```json
{
  "orderId": "uuid",
  "totalAmount": 15000.00,
  "paymentType": "parcelado",
  "installmentDays": [30, 60, 90]
}
```

- `paymentType`: `"avista"` ou `"parcelado"`
- `installmentDays`: array de números de dias a partir de hoje para cada vencimento. Ex.: `[30, 60, 90]` = 3 parcelas com vencimento em 30, 60 e 90 dias. Para à vista: `[0]`
- `amount` de cada parcela = `totalAmount / installmentDays.length`

Retorna o array de parcelas criadas (201).

#### `PATCH /financial/receivables/:id`
Atualiza uma parcela (marcar como paga, alterar vencimento, adicionar notas).

**Body (JSON — todos opcionais):**
```json
{
  "status": "paid",
  "paidAt": "2026-05-05T10:00:00.000Z",
  "dueDate": "2026-06-10",
  "notes": "Pago via PIX"
}
```

**Regra:** Ao definir `status = "paid"`, o `paidAt` é preenchido automaticamente com a data/hora atual se não informado.

Retorna a parcela atualizada (200).

### Telas/componentes sugeridos
- **Dashboard Financeiro** (`/financial`): cards com `expectedIncome`, `expectedExpenses`, `cashflow` (com sinal de +/- e cor verde/vermelha), gráfico de barras por mês com `receivablesByMonth`
- **Parcelas do pedido**: na tela de detalhe do pedido, seção "Financeiro" com tabela de parcelas, indicador de status (chip colorido), botão "Marcar como Pago"
- **Gerar parcelas**: modal com campos de valor total, tipo de pagamento e prazos (UI de chips adicionáveis para os dias, ou inputs numéricos)
- Ordenar parcelas pelo número (`installment`)

---

## 5. CAMPOS NOVOS EM PRODUTOS (Products)

O endpoint de produtos (`GET/POST /products`, `PATCH /products/:id`) agora retorna e aceita novos campos relacionados à matéria-prima de papelão:

### Novos campos na interface `Product`

```typescript
interface Product {
  id: string;
  name: string;
  stockQuantity: number;
  lowStockAlertQuantity: number;
  stockStatus: "em_estoque" | "precisa_comprar";
  // NOVOS:
  isPaperboardMaterial: boolean;   // se é matéria-prima de papelão (fardo)
  gramatura: number | null;        // gramatura em g/m²
  sheetsPerBundle: number | null;  // folhas por fardo
  createdAt: string;
  updatedAt: string;
}
```

### Ao criar/editar um produto
Aceita os campos opcionais `isPaperboardMaterial`, `gramatura`, `sheetsPerBundle`.

**Regra de negócio:** Se `isPaperboardMaterial = true`, o campo `gramatura` **é obrigatório**. O backend retorna 400 caso não seja enviado.

### Telas/componentes sugeridos
- No formulário de criação/edição de produtos: checkbox "É matéria-prima de papelão"
- Quando marcado, exibir campos `gramatura (g/m²)` e `sheetsPerBundle (folhas/fardo)`
- Na listagem de produtos: badge ou tag "Papelão" para produtos com `isPaperboardMaterial = true`
- Coluna ou tooltip com gramatura exibida nos produtos de papelão

---

## 6. CAMPOS NOVOS EM PRODUÇÕES (Productions)

O endpoint de produções (`GET /productions`, `POST /productions`, etc.) agora retorna e aceita campos adicionais:

### Novos campos na interface `Production`

```typescript
interface Production {
  // ... campos existentes ...
  // NOVOS:
  productionType: "corte" | "vinco" | null;
  productionLocation: "interno" | "terceirizado" | null;
  lossPercentage: number;  // 0 a 100, percentual de perda de material
  orderId: string | null;  // referência ao pedido vinculado
}
```

### Ao criar uma produção
Aceita os campos opcionais:

```json
{
  "productionType": "corte",
  "productionLocation": "interno",
  "lossPercentage": 5.5,
  "orderId": "uuid-do-pedido"
}
```

### Telas/componentes sugeridos
- No formulário de criação de ordem de produção: select `Tipo` (Corte / Vinco / Não definido) e select `Local` (Interno / Terceirizado / Não definido)
- Campo numérico `% de Perda` (0–100)
- Campo de seleção de pedido (`orderId`) para vincular a produção a um pedido existente
- Na listagem de produções: exibir badges para `productionType` e `productionLocation`
- Quando `lossPercentage > 0`, exibir de forma destacada (ex.: chip laranja)

---

## 7. FLUXO COMPLETO SUGERIDO

```
Orçamento aprovado
       │
       ▼
[PUT /budgets/:id/paperboard]  ← configurar dimensões, gramatura, clichê
       │
       ▼
[POST /orders]  ← criar pedido a partir do orçamento
       │
       ├──► [PATCH /orders/:id/items/:itemId/produced]  ← produção registra progresso
       │
       ├──► [POST /shipments]  ← expedição parcial ou total
       │         └──► status do pedido atualizado automaticamente
       │
       ├──► [POST /financial/receivables/installments]  ← gerar parcelas
       │
       └──► [PATCH /financial/receivables/:id]  ← marcar parcelas como pagas
```

---

## 8. RESUMO DE TODAS AS ROTAS NOVAS

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/budgets/:budgetId/paperboard` | Buscar config de papelão | admin, gerente |
| `PUT` | `/budgets/:budgetId/paperboard` | Criar/atualizar config | admin, gerente |
| `DELETE` | `/budgets/:budgetId/paperboard` | Remover config | admin, gerente |
| `GET` | `/orders` | Listar pedidos | admin, gerente |
| `GET` | `/orders/:id` | Buscar pedido | admin, gerente |
| `POST` | `/orders` | Criar pedido | admin, gerente |
| `PATCH` | `/orders/:id/items/:itemId/produced` | Atualizar qtd produzida | admin, gerente |
| `GET` | `/orders/:orderId/shipments` | Listar expedições do pedido | admin, gerente |
| `GET` | `/shipments/:id` | Buscar expedição | admin, gerente |
| `POST` | `/shipments` | Registrar expedição | admin, gerente |
| `GET` | `/financial/cashflow` | Resumo financeiro | admin, gerente |
| `GET` | `/financial/orders/:orderId/receivables` | Parcelas do pedido | admin, gerente |
| `POST` | `/financial/receivables/installments` | Gerar parcelas | admin, gerente |
| `PATCH` | `/financial/receivables/:id` | Atualizar parcela | admin, gerente |

---

## 9. TRATAMENTO DE ERROS

O backend retorna erros no formato:
```json
{
  "message": "Descrição do erro"
}
```

| HTTP | Situação |
|------|----------|
| `400` | Dados inválidos (validação Zod) ou regra de negócio simples |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex.: orçamento não aprovado, nome duplicado) |
| `422` | Regra violada (ex.: tentar expedir mais do que foi produzido) |
| `500` | Erro interno |

---

## 10. TIPOS TYPESCRIPT COMPLETOS PARA O FRONTEND

```typescript
// ── Paperboard ──────────────────────────────────────
interface PaperboardConfig {
  id: string;
  budgetId: string;
  length: number;
  width: number;
  height: number;
  gramatura: number;
  quantity: number;
  usesFullSheet: boolean;
  outsourcedCut: boolean;
  isFirstPurchase: boolean;
  clicheCost: number | null;
  clichePrice: number | null;
  area: number;         // calculado pelo backend (C×L×A)
  estimatedCost: number; // calculado pelo backend
  createdAt: string;
  updatedAt: string;
}

// ── Orders ───────────────────────────────────────────
type OrderStatus = "production" | "partial" | "completed";

interface OrderItem {
  id: string;
  orderId: string;
  budgetItemId: string | null;
  description: string;
  quantityTotal: number;
  quantityProduced: number;
  quantityShipped: number;
  remaining: number;   // = quantityProduced - quantityShipped
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  budgetId: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ── Shipments ────────────────────────────────────────
interface ShipmentItem {
  id: string;
  shipmentId: string;
  orderItemId: string;
  quantity: number;
}

interface Shipment {
  id: string;
  orderId: string;
  notes: string | null;
  shippedAt: string;
  items: ShipmentItem[];
  createdAt: string;
}

// ── Financial ────────────────────────────────────────
type ReceivableStatus = "pending" | "paid" | "overdue";

interface AccountReceivable {
  id: string;
  orderId: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: ReceivableStatus;
  installment: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CashflowSummary {
  expectedIncome: number;
  expectedExpenses: number;
  cashflow: number;
  receivablesByMonth: Array<{ month: string; amount: number }>;
}

// ── Products (campos adicionados) ────────────────────
interface Product {
  id: string;
  name: string;
  stockQuantity: number;
  lowStockAlertQuantity: number;
  stockStatus: "em_estoque" | "precisa_comprar";
  isPaperboardMaterial: boolean;   // NOVO
  gramatura: number | null;        // NOVO
  sheetsPerBundle: number | null;  // NOVO
  createdAt: string;
  updatedAt: string;
}

// ── Productions (campos adicionados) ─────────────────
type ProductionType = "corte" | "vinco";
type ProductionLocation = "interno" | "terceirizado";

interface Production {
  // ... campos existentes mantidos ...
  productionType: ProductionType | null;       // NOVO
  productionLocation: ProductionLocation | null; // NOVO
  lossPercentage: number;                      // NOVO (0–100)
  orderId: string | null;                      // NOVO
}
```
