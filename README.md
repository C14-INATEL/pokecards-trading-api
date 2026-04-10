# 🃏 Pokecards Trading API

API REST desenvolvida em **NestJS** para gerenciamento de trocas de cartas Pokémon. Permite que usuários criem wishlists de cartas desejadas, proponham trocas e gerenciem suas coleções.

---

## 🚀 Tecnologias

- **NestJS** — framework backend
- **Prisma ORM** — acesso ao banco de dados
- **PostgreSQL** — banco de dados relacional
- **Docker / Docker Compose** — containerização
- **Jest** — testes unitários e e2e
- **TypeScript**
- **ESLint + Prettier** — padronização de código

---

## 📁 Estrutura do Projeto

```
prisma/
├── schema.prisma
└── seed.ts

src/
├── common/
│   ├── dto/
│   │   └── pagination.dto.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── logging.interceptor.ts
├── health/
│   ├── health.controller.ts
│   └── health.module.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── trade-proposal/
│   ├── dto/
│   │   └── create-trade-proposal.dto.ts
│   ├── trade-proposal.controller.ts
│   ├── trade-proposal.module.ts
│   ├── trade-proposal.service.spec.ts
│   └── trade-proposal.service.ts
├── trades/
│   ├── trades.controller.ts
│   ├── trades.module.ts
│   └── trades.service.ts
├── wishlist/
│   ├── dto/
│   │   ├── create-wishlist.dto.ts
│   │   └── update-wishlist.dto.ts
│   ├── wishlist.controller.ts
│   ├── wishlist.module.ts
│   ├── wishlist.service.spec.ts
│   └── wishlist.service.ts
├── app.module.ts
└── main.ts

test/
├── jest-e2e.json
└── trades.e2e-spec.ts
```

---

## ⚙️ Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- npm

---

## 🛠️ Instalação e Execução

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/pokecards-trading-api.git
cd pokecards-trading-api
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações de banco de dados:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/pokecards"
```

### 3. Suba o banco com Docker

```bash
docker-compose up -d
```

### 4. Instale as dependências

```bash
npm install
```

### 5. Rode as migrations e o seed

```bash
npx prisma migrate dev
npx prisma db seed
```

### 6. Inicie a aplicação

```bash
# desenvolvimento
npm run start:dev

# produção
npm run start:prod
```

---

## 🧪 Testes

```bash
# testes unitários
npm run test

# com output detalhado
npm run test -- --verbose

# testes e2e
npm run test:e2e

# cobertura
npm run test:cov
```

Os testes unitários são organizados em **fluxo normal** (casos esperados) e **fluxo de extensão** (erros e casos de borda) para cada método dos serviços.

---

## 📦 Módulos

### Wishlist

Gerencia as listas de desejos dos usuários com dois tipos de item:

| Tipo | Descrição |
|------|-----------|
| `SPECIFIC_CARD` | Carta específica pelo ID |
| `FILTER` | Filtro por tipo e raridade |

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/wishlist` | Cria uma nova wishlist |
| GET | `/wishlist/:id` | Busca uma wishlist por ID |
| PATCH | `/wishlist/:id` | Atualiza nome ou itens |
| DELETE | `/wishlist/:id` | Remove uma wishlist |

---

### Trades

Gerencia as trocas abertas pelos usuários. Uma trade pode ser vinculada a uma wishlist, facilitando o match entre o que o dono quer e o que está sendo ofertado.

| Status | Descrição |
|--------|-----------|
| `OPEN` | Troca disponível para propostas |
| `CONCLUDED` | Troca finalizada |
| `CANCELLED` | Troca cancelada |

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/trades` | Cria uma nova trade |
| GET | `/trades` | Lista todas as trades |
| GET | `/trades/:id` | Busca uma trade por ID |
| PATCH | `/trades/:id` | Atualiza uma trade |
| DELETE | `/trades/:id` | Remove uma trade |

---

### Trade Proposal

Gerencia propostas de troca feitas por outros usuários em resposta a uma trade aberta.

| Status | Descrição |
|--------|-----------|
| `PENDING` | Aguardando resposta do dono da trade |
| `ACCEPTED` | Proposta aceita |
| `REJECTED` | Proposta recusada |
| `CANCELLED` | Proposta cancelada pelo proponente |

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/trade-proposal` | Cria uma proposta de troca |

---

## 🗄️ Modelo de Dados

### Diagrama de Relacionamentos

```
Wishlist 1 ──────────── N WishlistItem
    │
    └── N ──────────── N Trade (linkedWishlist)

Trade 1 ──────────── N TradeItem (offeredCards)
Trade 1 ──────────── N TradeItem (requestedCards)
Trade 1 ──────────── N TradeProposal

TradeProposal 1 ──── N ProposalItem
```

### Modelos

**Wishlist**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| userId | String | ID do usuário dono |
| name | String | Nome da lista |
| createdAt | DateTime | Data de criação |

**WishlistItem**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| wishlistId | UUID | Referência à wishlist |
| itemType | WishlistItemType | Tipo do item |
| cardId | String? | ID da carta (SPECIFIC_CARD) |
| filterType | String? | Tipo do filtro (FILTER) |
| filterRarity | String? | Raridade do filtro (FILTER) |

**Trade**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| ownerId | String | ID do dono da troca |
| status | TradeStatus | Status da troca |
| linkedWishlistId | UUID? | Wishlist vinculada (opcional) |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data de atualização |

**TradeItem**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| cardId | String | ID da carta |
| quantity | Int | Quantidade |
| offeredTradeId | UUID? | Trade que oferta este item |
| requestedTradeId | UUID? | Trade que solicita este item |

**TradeProposal**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| tradeId | UUID | Referência à trade |
| proposerId | String | ID do proponente |
| status | ProposalStatus | Status da proposta |
| message | String? | Mensagem opcional |
| createdAt | DateTime | Data de criação |

**ProposalItem**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| cardId | String | ID da carta ofertada |
| quantity | Int | Quantidade |
| proposalId | UUID | Referência à proposta |

### Enums

| Enum | Valores |
|------|---------|
| `TradeStatus` | `OPEN`, `CONCLUDED`, `CANCELLED` |
| `ProposalStatus` | `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED` |
| `WishlistItemType` | `SPECIFIC_CARD`, `FILTER` |
