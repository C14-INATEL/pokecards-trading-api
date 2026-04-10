# 🃏 Pokecards Trading API

API REST desenvolvida em **NestJS** para gerenciamento de trocas de cartas Pokémon. Permite que usuários criem wishlists de cartas desejadas, proponham trocas e gerenciem suas coleções.

---

## 🚀 Tecnologias

- **NestJS** — framework backend
- **Prisma ORM** — acesso ao banco de dados
- **PostgreSQL** — banco de dados relacional
- **Docker / Docker Compose** — containerização
- **Jest** — testes unitários
- **TypeScript**
- **ESLint + Prettier** — padronização de código

---

## 📁 Estrutura do Projeto
src/
├── health/                  # Health check da aplicação
├── prisma/                  # Módulo e serviço do Prisma
├── trades/                  # Módulo de propostas de troca
│   └── trade-proposal/
├── wishlist/                # Módulo de lista de desejos
│   ├── dto/
│   │   ├── create-wishlist.dto.ts
│   │   └── update-wishlist.dto.ts
│   ├── wishlist.controller.ts
│   ├── wishlist.module.ts
│   ├── wishlist.service.ts
│   └── wishlist.service.spec.ts
├── app.module.ts
└── main.ts

---

## ⚙️ Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- npm

---

## 🛠️ Instalação e execução

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

### 5. Rode as migrations

```bash
npx prisma migrate dev
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
# todos os testes
npm run test

# com output detalhado
npm run test -- --verbose

# cobertura
npm run test:cov
```

Os testes são organizados em **fluxo normal** (casos esperados) e **fluxo de extensão** (casos de erro e borda) para cada método do serviço.

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

## 🗄️ Modelo de dados

```prisma
model Wishlist {
  id        String         @id @default(uuid())
  userId    String
  name      String
  createdAt DateTime       @default(now())
  items     WishlistItem[]
}

model WishlistItem {
  id            String            @id @default(uuid())
  wishlistId    String
  itemType      WishlistItemType
  cardId        String?
  filterType    String?
  filterRarity  String?
  wishlist      Wishlist          @relation(fields: [wishlistId], references: [id])
}

enum WishlistItemType {
  SPECIFIC_CARD
  FILTER
}