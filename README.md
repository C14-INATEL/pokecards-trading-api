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


### Utilização de IAs ###
Utilização de IA no Desenvolvimento
Após a escrita dos testes unitários (arquivos .spec.ts), utilizamos uma IA generativa para implementar os endpoints e serviços da aplicação.
O fluxo adotado foi o seguinte: primeiro definimos os contratos esperados por meio dos testes — cobrindo tanto o fluxo normal quanto os casos de borda — e em seguida fornecemos esses testes como contexto para a IA, que gerou a implementação correspondente dos serviços e controllers.
Essa abordagem garantiu que o código produzido pela IA nascesse orientado aos testes, reduzindo retrabalho e mantendo a cobertura desde o início do desenvolvimento.

Ian: 
Estou desenvolvendo uma API REST com NestJS + Prisma + PostgreSQL. Preciso que você gere os métodos update e delete para o WishlistService, seguindo o padrão já existente no projeto e com base nos testes abaixo:

update(id, dto): verifica se a wishlist existe com findUnique antes de atualizar. Se não existir, lança NotFoundException. Chama prisma.wishlist.update com where: { id }, include: { items: true }. Quando dto.items for fornecido, substitui todos os itens usando items: { deleteMany: {}, create: [...] }.
delete(id): verifica se a wishlist existe com findOne antes de deletar. Se não existir, lança NotFoundException. Chama prisma.wishlist.delete com where: { id } e retorna void.

Satisfação: Gostei da resposta da IA, utilizei a Claude e o deepseek, em poucas correções o código estava do meu agrado.

Gabriel Renato: 
Estou desenvolvendo uma API REST com NestJS + Prisma + PostgreSQL. Preciso que você gere os endpoints de update e delete para o módulo Wishlist, seguindo o padrão já existente no projeto e com base nos testes existentes da Wishlist, segue contexto do prisma no arquivo enviado.

Satisfação: Fiquei bastante satisfeito com a resposta fornecida pela IA. Utilizei a ferramenta Claude e, após realizar apenas algumas correções pontuais, o código passou a atender plenamente às minhas expectativas. O processo foi ágil e eficiente, exigindo poucos ajustes para alcançar o resultado desejado, o que demonstrou a qualidade e utilidade da solução apresentada.

Gabriel Baldoni:
Estou desenvolvendo uma API REST com NestJS + Prisma + PostgreSQL.
Preciso que você gere o endpoint de create para o módulo Trade Proposal,
seguindo o padrão já existente no projeto e com base nos testes existentes
da Wishlist, segue contexto do prisma no arquivo enviado.

create(dto): cria uma nova proposta de troca com status PENDING por padrão.
Recebe tradeId, proposerId, message (opcional) e offeredCards (array de
{ cardId, quantity }). Chama prisma.tradeProposal.create com data: { tradeId,
proposerId, message, status: PENDING, offeredCards: { create: [...] } } e
include: { offeredCards: true }.

Os testes unitários devem seguir o padrão InMemoryRepository da Wishlist,
com PrismaService substituído via useValue no TestingModule, beforeEach para
setup e afterEach para limpeza. Testes divididos em dois describes:
fluxo normal (happy path) e fluxo de extensão (edge cases), com entre 5 e 8
testes no total

Satisfação: O resultado foi satisfatório. A IA compreendeu corretamente o padrão do projeto e gerou o código alinhado à estrutura existente, seguindo o mesmo modelo de InMemoryRepository utilizado na Wishlist. Foram necessários pequenos ajustes, como a reorganização dos testes em dois grupos distintos (fluxo normal e fluxo de extensão), mas no geral o código gerado exigiu poucas modificações para atender aos requisitos da atividade.

## ⚙️ CI/CD Pipeline

O projeto conta com um pipeline automatizado via **GitHub Actions**, composto por quatro jobs:

- **Testes** e **Build** rodam em paralelo a cada push ou pull request nas branches `main` e `dev`. O job de testes executa a suíte com cobertura (`npm run test:cov`) e salva o relatório como artefato. O job de build compila o TypeScript para `dist/` e também salva o pacote compilado.

- **Deploy** é acionado automaticamente no Railway apenas em pushes diretos à `main`, e somente se ambos os jobs anteriores finalizarem com sucesso.

- **Notificação** sempre executa ao final do pipeline (independente do resultado), enviando um e-mail com o status de cada job via `scripts/notify.js`.

### Secrets e variáveis necessárias

Configure em **Settings → Secrets / Variables → Actions** do repositório:

| Nome | Tipo | Descrição |
|------|------|-----------|
| `RAILWAY_TOKEN` | Secret | Token de autenticação do Railway CLI |
| `RAILWAY_PROJECT_ID` | Secret | ID do projeto no Railway |
| `RAILWAY_SERVICE_ID` | Secret | ID do serviço no Railway |
| `SMTP_HOST` | Secret | Servidor SMTP (ex: `smtp.gmail.com`) |
| `SMTP_PORT` | Secret | Porta SMTP (ex: `587`) |
| `SMTP_USER` | Secret | Usuário SMTP |
| `SMTP_PASS` | Secret | App Password do SMTP |
| `NOTIFY_EMAIL` | Variable | E-mail de destino das notificações |
