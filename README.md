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
prisma/
├── schema.prisma            # Modelos do banco de dados
└── seed.ts                  # Seed de dados iniciais
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

Edite o `.env` com suas configurações de banco de dados.

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

### Trade Proposal

Gerencia propostas de troca entre usuários.

**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/trade-proposal` | Cria uma proposta de troca |

As propostas são criadas com status `PENDING` por padrão.

---

### Trades

Módulo responsável por listar e gerenciar as trocas realizadas entre usuários.

---

## 🗄️ Modelo de Dados

```prisma
model Wishlist {
  id        String         @id @default(uuid())
  userId    String
  name      String
  createdAt DateTime       @default(now())
  items     WishlistItem[]
}

model WishlistItem {
  id           String           @id @default(uuid())
  wishlistId   String
  itemType     WishlistItemType
  cardId       String?
  filterType   String?
  filterRarity String?
  wishlist     Wishlist         @relation(fields: [wishlistId], references: [id])
}

enum WishlistItemType {
  SPECIFIC_CARD
  FILTER
}