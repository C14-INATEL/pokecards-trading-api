# 🃏 Pokecards Trading API

API REST desenvolvida em **NestJS + Prisma + PostgreSQL** para gerenciar **trocas de cartas Pokémon** entre treinadores. Um usuário monta sua **wishlist** (lista de cartas desejadas), abre uma **troca** (`trade`) oferecendo cartas em troca de outras, e outros usuários enviam **propostas** (`trade proposals`). Quando o dono aceita uma proposta, a troca é concluída e as demais propostas pendentes são canceladas automaticamente.

> 📚 **Documentação interativa (Swagger):** https://pokecards-trades.onrender.com/docs

Projeto desenvolvido para a disciplina **C14 — Engenharia de Software (INATEL)**, organização [`C14-INATEL`](https://github.com/C14-INATEL).

---

## 📑 Índice

- [Visão geral do domínio](#-visão-geral-do-domínio)
- [Tecnologias](#-tecnologias)
- [Arquitetura e decisões técnicas](#-arquitetura-e-decisões-técnicas)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Modelo de dados](#-modelo-de-dados)
- [Funcionalidades e regras de negócio](#-funcionalidades-e-regras-de-negócio)
- [Documentação da API (endpoints)](#-documentação-da-api-endpoints)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e execução](#-instalação-e-execução)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Testes](#-testes)
- [CI/CD (CircleCI)](#-cicd-circleci)
- [Convenções de código](#-convenções-de-código)
- [Fluxo de versionamento e contribuição](#-fluxo-de-versionamento-e-contribuição)
- [Documentação de Engenharia de Software (NP2)](#-documentação-de-engenharia-de-software-np2)
- [Uso de IA](#-uso-de-ia)
- [Equipe](#-equipe)

---

## 🎯 Visão geral do domínio

O sistema modela o ciclo completo de uma **troca de cartas colecionáveis Pokémon**:

| Conceito | O que representa |
|----------|------------------|
| **Wishlist** | Lista de cartas que um usuário deseja. Cada item pode ser uma **carta específica** (`SPECIFIC_CARD`) ou um **filtro** (`FILTER`) por tipo/raridade. |
| **Trade (troca)** | Um anúncio aberto por um usuário, contendo cartas **oferecidas** e cartas **solicitadas**. Pode ser vinculada a uma wishlist para facilitar o *match*. |
| **Trade Proposal (proposta)** | Uma oferta que outro usuário envia em resposta a uma trade aberta, listando as cartas que ele oferece. |
| **Aceite de proposta** | Ao aceitar uma proposta, a trade é marcada como `CONCLUDED` e **todas as outras propostas pendentes da mesma trade são canceladas** automaticamente. |

O escopo é **backend (API REST)**, sem interface gráfica própria — o consumo é feito via Swagger UI ou qualquer cliente HTTP (Postman, `curl`, frontend externo).

---

## 🚀 Tecnologias

| Camada | Ferramenta | Papel no projeto |
|--------|-----------|------------------|
| Framework | **NestJS 11** | Estrutura modular (módulos, controllers, services, DI) |
| ORM | **Prisma 6** | Modelagem do schema, migrations e acesso ao banco |
| Banco | **PostgreSQL 16** | Persistência relacional |
| Documentação | **Swagger / OpenAPI** (`@nestjs/swagger`) | Documentação interativa em `/docs` |
| Validação | **class-validator + class-transformer** | Validação e transformação de DTOs |
| Testes | **Jest + ts-jest** | Testes unitários e e2e |
| Containerização | **Docker / Docker Compose** | Banco e aplicação em containers |
| CI/CD | **CircleCI** | Pipeline de lint, testes, build e deploy |
| Qualidade | **ESLint + Prettier** | Padronização de código |
| Linguagem | **TypeScript 5** | Tipagem estática em todo o projeto |

> 🔧 **Gerenciador de dependências:** `npm` (com `package-lock.json` versionado, garantindo build reprodutível).

---

## 🏗️ Arquitetura e decisões técnicas

O projeto segue a **arquitetura modular do NestJS**, com separação clara de responsabilidades:

```
Controller  →  Service  →  PrismaService  →  PostgreSQL
   (HTTP)      (regras)      (ORM)            (dados)
```

- **Controllers** — expõem os endpoints HTTP, documentam o Swagger e delegam a lógica para os services. Não contêm regra de negócio.
- **Services** — concentram as regras de negócio (validações de domínio, exceções, efeitos colaterais do aceite de proposta).
- **DTOs** — definem o contrato de entrada (`Create*`, `Update*`) e de saída (`*ResponseDto`), com validação via `class-validator` e documentação via `@ApiProperty`.
- **PrismaModule / PrismaService** — encapsula o cliente Prisma, injetado nos services.
- **Camada comum (`src/common`)** — filtros de exceção, interceptor de logging e DTOs de resposta padronizados (`NotFoundResponseDto`, `ValidationErrorResponseDto`).

### Decisões relevantes

- **Validação global rígida** ([`main.ts`](src/main.ts)): `ValidationPipe` com `whitelist`, `forbidNonWhitelisted` e `transform` — rejeita payloads com campos não declarados no DTO.
- **Erros de domínio explícitos**: recurso inexistente lança `NotFoundException` (HTTP 404) em vez de retornar `null` com 200; atualizar uma proposta que não está `PENDING` lança `ConflictException` (HTTP 409).
- **Integridade referencial no banco** ([`schema.prisma`](prisma/schema.prisma)): `onDelete: Cascade` nos itens filhos e `onDelete: SetNull` na wishlist vinculada a uma trade, além de índices nas colunas de busca (`status`, `ownerId`, `tradeId`, etc.).
- **Status codes corretos por verbo**: `201` (POST), `200` (GET/PATCH), `204` (DELETE), `404` (não encontrado), `409` (conflito de estado).

---

## 📁 Estrutura do projeto

```
prisma/
├── schema.prisma            # modelos, enums, índices e relações
├── seed.ts                  # dados de exemplo (wishlists, trades, proposals)
└── migrations/              # migrations versionadas

src/
├── common/                  # infraestrutura compartilhada
│   ├── dto/                 # NotFound / ValidationError / Pagination DTOs
│   ├── filters/             # http-exception.filter.ts
│   └── interceptors/        # logging.interceptor.ts
├── health/                  # endpoint de health-check
│   ├── health.controller.ts
│   └── health.module.ts
├── prisma/                  # wrapper do Prisma Client
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── wishlist/                # módulo de wishlists (CRUD completo)
│   ├── dto/
│   ├── wishlist.controller.ts
│   ├── wishlist.service.ts
│   └── wishlist.service.spec.ts
├── trades/                  # módulo de trocas (CRUD completo)
│   ├── dto/
│   ├── trades.controller.ts
│   ├── trades.service.ts
│   └── trades.service.spec.ts
├── trade-proposal/          # módulo de propostas (CRUD + aceite/recusa)
│   ├── dto/
│   ├── trade-proposal.controller.ts
│   ├── trade-proposal.service.ts
│   └── trade-proposal.service.spec.ts
├── app.module.ts            # módulo raiz
└── main.ts                  # bootstrap + Swagger + ValidationPipe

test/
├── jest-e2e.json
└── trades.e2e-spec.ts       # teste end-to-end

.circleci/
└── config.yml               # pipeline CI/CD (5 jobs: lint, test, build, deploy, notify)

docs/                                   # documentação de Engenharia de Software (NP2)
├── historias-de-usuario.md             # histórias de usuário + rastreabilidade
├── development-methodology.md          # metodologia (Kanban assíncrono)
└── Dynamic tradition of development.md  # dinâmica, lições e decisões
```

---

## 🗄️ Modelo de dados

### Diagrama de relacionamentos

```
Wishlist 1 ───< N WishlistItem
   │
   └──< N Trade            (linkedWishlist — opcional, SetNull ao apagar)

Trade 1 ───< N TradeItem    (offeredCards)
Trade 1 ───< N TradeItem    (requestedCards)
Trade 1 ───< N TradeProposal

TradeProposal 1 ───< N ProposalItem
```

### Modelos (`prisma/schema.prisma`)

**Trade** — uma troca aberta por um usuário.
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| ownerId | String | Usuário dono da troca |
| status | TradeStatus | `OPEN` por padrão |
| linkedWishlistId | UUID? | Wishlist vinculada (opcional) |
| offeredCards | TradeItem[] | Cartas oferecidas |
| requestedCards | TradeItem[] | Cartas solicitadas |
| proposals | TradeProposal[] | Propostas recebidas |
| createdAt / updatedAt | DateTime | Auditoria |

**TradeItem** — uma carta dentro de uma trade (oferecida ou solicitada).
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| cardId | String | ID da carta |
| quantity | Int | Quantidade |
| offeredTradeId / requestedTradeId | UUID? | Vínculo com a trade (Cascade) |

**TradeProposal** — proposta feita por um usuário a uma trade.
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tradeId | UUID | Trade alvo (Cascade) |
| proposerId | String | Usuário que propõe |
| status | ProposalStatus | `PENDING` por padrão |
| message | String? | Mensagem opcional |
| offeredCards | ProposalItem[] | Cartas oferecidas na proposta |

**ProposalItem** — carta oferecida dentro de uma proposta.
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| cardId | String | ID da carta |
| quantity | Int | Quantidade |
| proposalId | UUID | Vínculo com a proposta (Cascade) |

**Wishlist** — lista de desejos de um usuário.
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| userId | String | Dono da lista |
| name | String | Nome da lista |
| items | WishlistItem[] | Itens desejados |

**WishlistItem** — item desejado (carta específica ou filtro).
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| wishlistId | UUID | Vínculo com a wishlist (Cascade) |
| itemType | WishlistItemType | `SPECIFIC_CARD` ou `FILTER` |
| cardId | String? | Carta (quando `SPECIFIC_CARD`) |
| filterType / filterRarity | String? | Critérios (quando `FILTER`) |

### Enums

| Enum | Valores |
|------|---------|
| `TradeStatus` | `OPEN`, `CONCLUDED`, `CANCELLED` |
| `ProposalStatus` | `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED` |
| `WishlistItemType` | `SPECIFIC_CARD`, `FILTER` |

---

## ⚙️ Funcionalidades e regras de negócio

### Wishlist — `src/wishlist`
CRUD completo de listas de desejos. Na atualização, quando o campo `items` é enviado, **a lista de itens é totalmente substituída** (`deleteMany` + `create`). Buscar uma wishlist inexistente lança `404`.

### Trades — `src/trades`
CRUD completo de trocas. Uma trade é criada já com suas cartas oferecidas e solicitadas em uma única operação aninhada. Na atualização, só é possível alterar uma trade com status `OPEN` — caso contrário lança `ConflictException` (409); quando `offeredCards`/`requestedCards` são enviados, a lista correspondente é substituída (`deleteMany` + `create`). Buscar uma trade inexistente lança `404`.

### Trade Proposal — `src/trade-proposal`
CRUD de propostas, com a regra de negócio central do sistema no método `update`:

1. A proposta só pode ser atualizada se estiver `PENDING` — caso contrário, lança **`ConflictException` (409)**.
2. Ao definir o status como **`ACCEPTED`**:
   - todas as **outras propostas pendentes da mesma trade** passam a `CANCELLED`;
   - a **trade** correspondente passa a `CONCLUDED`.
3. Recusar (`REJECTED`) **não** afeta outras propostas nem a trade.

> Essa lógica está coberta por testes específicos de *side effects* (ver [Testes](#-testes)).

### Health-check — `src/health`
`GET /health` retorna `{ status: "ok", timestamp }` — usado para verificar disponibilidade da API (útil em deploy/CI).

---

## 📡 Documentação da API (endpoints)

Base URL local: `http://localhost:3000` · Swagger UI: `/docs` · OpenAPI JSON: `/docs/json`

### Health
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| GET | `/health` | Verifica disponibilidade | `200` |

### Wishlists
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| POST | `/wishlists` | Cria uma wishlist | `201` / `400` |
| GET | `/wishlists` | Lista todas as wishlists | `200` |
| GET | `/wishlists/:id` | Busca por ID | `200` / `404` |
| PATCH | `/wishlists/:id` | Atualiza nome e/ou itens | `200` / `400` / `404` |
| DELETE | `/wishlists/:id` | Remove a wishlist | `204` / `404` |

### Trades
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| POST | `/trades` | Cria uma troca | `201` / `400` |
| GET | `/trades` | Lista todas as trocas | `200` |
| GET | `/trades/:id` | Busca por ID | `200` / `404` |
| PATCH | `/trades/:id` | Atualiza uma troca (apenas se `OPEN`) | `200` / `400` / `404` / `409` |
| DELETE | `/trades/:id` | Remove a troca | `204` / `404` |

### Trade Proposals
| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| POST | `/trade-proposals` | Cria uma proposta | `201` / `400` |
| GET | `/trade-proposals` | Lista propostas (filtro opcional `?tradeId=`) | `200` |
| GET | `/trade-proposals/:id` | Busca por ID | `200` / `404` |
| PATCH | `/trade-proposals/:id` | Atualiza status (aceitar/recusar/cancelar) | `200` / `400` / `404` / `409` |
| DELETE | `/trade-proposals/:id` | Remove a proposta | `204` / `404` |

<details>
<summary>Exemplo: criar uma proposta de troca</summary>

```bash
curl -X POST http://localhost:3000/trade-proposals \
  -H "Content-Type: application/json" \
  -d '{
    "tradeId": "8d5530de-bd66-4de9-bf68-ddf0fd49b7f2",
    "proposerId": "ash-ketchum",
    "message": "Tenho interesse nas suas cartas raras!",
    "offeredCards": [
      { "cardId": "a78df551-23ad-4eb2-8a9a-7090d455e44d", "quantity": 2 }
    ]
  }'
```
</details>

---

## ✅ Pré-requisitos

- **Node.js 18+** (CI usa Node 22)
- **npm**
- **Docker** e **Docker Compose** (para o banco PostgreSQL)

---

## 🛠️ Instalação e execução

### 1. Clone o repositório
```bash
git clone https://github.com/C14-INATEL/pokecards-trading-api.git
cd pokecards-trading-api
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
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
npm run start:dev      # desenvolvimento (watch)
npm run start:prod     # produção (a partir de dist/)
```

A API sobe em `http://localhost:3000` e a documentação em `http://localhost:3000/docs`.

### Alternativa: tudo via Docker
O [`Dockerfile`](Dockerfile) (multi-stage) e o [`docker-compose.yml`](docker-compose.yml) sobem **banco + aplicação**. O container da app roda `prisma migrate deploy` automaticamente antes de iniciar:
```bash
docker-compose up --build
```

---

## 🔐 Variáveis de ambiente

Definidas em [`.env.example`](.env.example):

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DB_USER` | Usuário do PostgreSQL | `postgres` |
| `DB_PASSWORD` | Senha do PostgreSQL | `postgres` |
| `DB_NAME` | Nome do banco | `pokemon_trades` |
| `DB_HOST` | Host do banco | `localhost` |
| `DB_PORT` | Porta do banco | `5432` |
| `DATABASE_URL` | URL de conexão usada pelo Prisma | `postgresql://...` |
| `DIRECT_URL` | URL direta (migrations / poolers) | `postgresql://...` |

No pipeline, o job `deploy` usa a variável `RENDER_DEPLOY_HOOK_URL` (hook de deploy do Render). O job `notify` apenas registra o status final no log (não usa variáveis externas).

---

## 🧪 Testes

O projeto adota uma abordagem orientada a testes (**TDD**): os testes de cada service foram escritos **antes** da implementação, definindo o contrato esperado, e a implementação foi feita para satisfazê-los.

### Estratégia

- **Framework:** Jest + ts-jest.
- **Padrão `InMemoryRepository`:** em vez de *mocks puros*, cada `*.service.spec.ts` usa um repositório em memória que simula o comportamento do Prisma, injetado via `useValue` no `TestingModule`. Isso testa a lógica real do service contra um estado consistente.
- **Organização em dois fluxos** por método:
  - **Fluxo normal** (*happy path*) — casos esperados;
  - **Fluxo de extensão** (*edge cases*) — erros, recursos inexistentes e verificação de que o Prisma foi chamado com a estrutura exata (`toHaveBeenCalledWith`).
- **`afterEach`** limpa o repositório em memória (`clear()`) e os mocks (`jest.clearAllMocks()`), garantindo isolamento entre testes.

### Cobertura por módulo

| Suíte | Testes | Destaques |
|-------|--------|-----------|
| `trade-proposal.service.spec.ts` | ~29 | CRUD + *side effects* do aceite (cancela pendentes, conclui trade), `ConflictException` em status não-PENDING |
| `wishlist.service.spec.ts` | ~20 | CRUD, substituição de itens no update, `NotFoundException` |
| `trades.service.spec.ts` | ~27 | CRUD completo, regra de status `OPEN` no update, `NotFoundException` |
| `trades.e2e-spec.ts` | e2e | fluxo end-to-end de trades |

### Comandos

```bash
npm run test            # testes unitários
npm run test:watch      # modo watch
npm run test:cov        # com relatório de cobertura
npm run test:e2e        # testes end-to-end
```

No CI, o job `test` roda `npm run test -- --coverage` e **publica o relatório de cobertura como artefato** do CircleCI.

---

## 🔄 CI/CD (CircleCI)

> ⚠️ A disciplina **proíbe GitHub Actions**. O pipeline deste projeto roda no **CircleCI** ([`.circleci/config.yml`](.circleci/config.yml)).

O pipeline tem **5 jobs** organizados em **dois workflows** (`ci` e `cd`):

| Job | Responsável | O que faz |
|-----|-------------|-----------|
| `lint` | **Gabriel Renato** | `npm ci` + `npm run lint` (ESLint) |
| `test` | **Gabriel Baldoni** | `npm ci` + `prisma generate` + testes com cobertura; salva `coverage/` como artefato |
| `build` | **Ian** | `npm ci` + `prisma generate` + `npm run build` |
| `deploy` | **Fábio** | Dispara o deploy no **Render** via `RENDER_DEPLOY_HOOK_URL` (valida resposta 2xx) |
| `notify` | **Fábio** | Registra no log o status final do pipeline (branch, commit, autor, URL do build) |

```
ci  (toda branch, exceto main):   lint → test → build
cd  (apenas main):                test → build → deploy → notify
```

- O executor é `cimg/node:22.11` (Docker).
- O workflow `cd` roda **apenas na `main`**; o `deploy` falha se `RENDER_DEPLOY_HOOK_URL` não estiver configurada ou se o Render responder fora da faixa 2xx.
- O job `notify` apenas **registra o status final do pipeline no log** (não envia e-mail).

---

## 📐 Convenções de código

As convenções completas do projeto estão em [`docs/CONVENCOES.md`](docs/CONVENCOES.md) (endpoints, DTOs, Swagger, padrão de testes, branches e commits) e são reforçadas no [template de Pull Request](.github/pull_request_template.md), aplicado a todo PR. Resumo:

**Código**
- Título do PR segue **Conventional Commits**: `feat(módulo): descrição`.
- Cada PR cobre **1 feature ou 1 fix** (sem responsabilidades misturadas).
- Recurso inexistente → `NotFoundException` (nunca `null` com `200`).
- Erros do Prisma são propagados (sem *catch* silencioso).

**Endpoints & DTOs**
- Rotas no **plural** e *kebab-case* (ex.: `/trade-proposals`).
- `CreateDto` valida campos obrigatórios com `class-validator`; `UpdateDto` marca todos os campos como `@IsOptional()`.
- `ResponseDto` documentado no Swagger.
- Status codes corretos: `201` POST, `204` DELETE, `404` não encontrado.

**Swagger**
- `@ApiTags` no controller; `@ApiOperation` + decorator de resposta em cada endpoint; `@ApiParam` em rotas com `:id`.

**Testes**
- `*.service.spec.ts` usa `InMemoryRepository` (sem mocks puros).
- ≥ 4 testes por método de CRUD (fluxo normal + extensão).
- Asserções com `toHaveBeenCalledWith` na estrutura exata passada ao Prisma.
- `afterEach` chama `inMemoryRepo.clear()` e `jest.clearAllMocks()`.

**Revisão & CI**
- Pipeline verde **antes** de pedir review.
- ≥ 1 revisão de outro membro antes do merge.

---

## 🌿 Fluxo de versionamento e contribuição

- **Repositório:** organização [`C14-INATEL`](https://github.com/C14-INATEL) (time da matéria).
- **Branches:** `main` (produção) e `dev` (integração), com branches de trabalho por feature/fix/refactor — ex.: `feat/trade-proposal`, `refactor/wishlist-endpoints`, `fix/wishlist-create-read`, `chore/ci-test-job`.
- **Commits:** padrão **Conventional Commits** (`feat`, `fix`, `refactor`, `test`, `chore`, `ci`, `docs`).
- **Code review:** todo merge passa por **Pull Request** com revisão de outro integrante. O histórico tem **37 PRs** mergeados (#1 a #38) com discussão entre os membros.
- **Refactoring contínuo:** vários PRs de refactor documentam a evolução do código (ex.: `refactor: adapt code to match the new diagram structure`, padronização de testes da wishlist, adequação às convenções da trade-proposal).

---

## 📚 Documentação de Engenharia de Software (NP2)

Os requisitos da NP2 (histórias de usuário, metodologia e dinâmica) estão documentados **por completo** na pasta [`docs/`](docs/), em arquivos `.md` separados. Abaixo, um resumo de cada bloco com o link para o documento completo.

### 📖 Histórias de usuário
Histórias no formato *Como… quero… para que…* cobrindo wishlist, trades e propostas (US-01 em diante), cada uma com critérios de aceitação (Given/When/Then), prioridade, status e rastreabilidade (história → arquivo → teste automatizado).

📂 **Para acessar os detalhes e o documento completo, [clique aqui](docs/historias-de-usuario.md).**

### 🛠️ Metodologia
O grupo adotou **Kanban em fluxo contínuo (sem sprints)** — escolha deliberada porque todos trabalham e estudam, exigindo trabalho assíncrono. Cobre papéis (Fábio como **Tech Lead**; cada membro dono de um módulo), cadência *event-driven*, ferramentas, DoD/DoR aplicados na prática e métricas reais extraídas do `git log`.

📂 **Para acessar os detalhes e o documento completo, [clique aqui](docs/development-methodology.md).**

### 🔄 Dinâmica de desenvolvimento
Como o trabalho aconteceu no dia a dia: divisão por módulos, branches individuais + PRs com code review, integração contínua, lições aprendidas (conflitos de merge, comunicação) e decisões tomadas por consenso.

📂 **Para acessar os detalhes e o documento completo, [clique aqui](<docs/Dynamic tradition of development.md>).**

> 📌 As convenções técnicas que guiaram todo o desenvolvimento estão em [`docs/CONVENCOES.md`](docs/CONVENCOES.md).

---

## 🤖 Uso de IA

Conforme exigido pela disciplina, esta seção declara de forma transparente o uso de IA no projeto. O fio condutor foi o **TDD**: na maioria dos casos a IA entrou *depois* dos testes, gerando a implementação a partir do contrato definido pelo grupo, sempre tendo o [`docs/CONVENCOES.md`](docs/CONVENCOES.md) como referência de padrão. Detalhamento por integrante:

### Gabriel Baldoni
**Modelo utilizado:** Claude Opus 4.8 — principalmente via **Claude Code** (CLI agentic da Anthropic, com acesso ao repositório) e, em parte, no chat do Claude.

**Para quê usei:**
- Implementação do **CRUD completo da entidade Trade Proposal** (create, findOne, findAll, update, delete) — service, controller e DTOs — a partir de testes que eu já tinha escrito (TDD).
- Implementação da **regra de negócio do aceite**: cancelar as propostas `PENDING` restantes e concluir a trade, com `ConflictException` quando a proposta não está `PENDING`.
- Apoio na geração do **README** e na estruturação da pasta `docs/` da NP2, via Claude Code.

**Prompt 1 — geração do módulo Trade Proposal a partir dos testes (TDD):**
> "Estou desenvolvendo uma API REST com NestJS + Prisma + PostgreSQL. Já escrevi os testes unitários do `TradeProposalService` (`trade-proposal.service.spec.ts`, em anexo), cobrindo fluxo normal e de extensão, com o Prisma mockado por um `InMemoryTradeProposalRepository` injetado via `useValue` no `TestingModule`. Gere a implementação do `TradeProposalService` e do `TradeProposalController` (create, findOne, findAll, update, delete) de modo que todos os testes passem, seguindo o padrão do projeto. Não altere os testes."
> → **Aceito com ajustes** (tipagem `TradeProposalWithItems`, imports e mensagens de exceção). Evidência: commits `191ce51`, `082743f`, `4c6fc13`.

**Prompt 2 — regra de negócio do aceite (efeitos colaterais):**
> "No `update` do `TradeProposalService`, ao receber `status: ACCEPTED`: além de atualizar a proposta, cancele (`CANCELLED`) todas as outras propostas `PENDING` da mesma trade e marque a trade como `CONCLUDED`. Se a proposta não estiver `PENDING`, lance `ConflictException`. Adicione os testes cobrindo esses efeitos colaterais (`updateMany` com a estrutura exata e `trade.update`)."
> → **Aceito.** Gerou o `updateMany` + `trade.update` e os testes de *side effects*; substituí um `Error` genérico por `ConflictException`. Evidência: commits `21f874f`, `03ee082`, `84d55ce`.

**Prompt 3 — documentação com Claude Code:**
> "Usando o Claude Code com acesso ao repositório, faça um README completo seguindo o PDF da disciplina e o `CONVENCOES.md`; documente endpoints, modelo de dados, testes e o pipeline CircleCI. Crie também a estrutura da pasta `docs/`."
> → **Ajustado.** O Claude Code leu o código real e **corrigiu o README antigo**, que descrevia "GitHub Actions" sendo o CI real **CircleCI**, e as rotas no singular sendo plurais.

**Dinâmica de uso:** uso individual e assíncrono. Sempre parti dos testes que eu já tinha escrito — primeiro definia o contrato no `.spec.ts`, depois pedia a implementação que o fizesse passar, anexando o `schema.prisma` e o módulo de Wishlist como referência de padrão. Nas refatorações de convenções, fornecia o `CONVENCOES.md` antes de pedir mudanças. Não usei IA para revisar PRs dos colegas.

**O que NÃO foi feito por IA:**
- O desenho dos **testes unitários** do Trade Proposal: os casos (fluxo normal vs. extensão), o que testar e o `InMemoryTradeProposalRepository`.
- A decisão da **regra de negócio do aceite** (cancelar pendentes e concluir a trade).
- Leitura e interpretação do `CONVENCOES.md` para identificar o que corrigir no módulo e nos testes.
- A configuração do **job `test` no CircleCI** (com cobertura — commits `73bf724`, `f735d34`).
- Organização de branches e commits seguindo o Conventional Commits.
- Revisão dos PRs dos colegas.
- Ajustes finos de tipagem, indentação e mensagens de erro identificados na revisão do código gerado.

---

### Fábio Henrique
**Modelo utilizado:** Claude Opus 4.8 (com *reasoning effort* no máximo).

**Para quê usei:**
- Implementação dos **5 endpoints da entidade Trade** (CRUD completo + listagem) a partir de testes que eu já tinha escrito — fluxo orientado a TDD.
- Apoio na redação do documento de **Metodologia de Desenvolvimento** (`docs/development-methodology.md`).
- **Debugging do deploy no Render**, quando a aplicação passou a crashar no start.

**Prompt 1 — geração de cada endpoint a partir dos testes (TDD):**
> "Estou desenvolvendo uma API REST com NestJS + Prisma + PostgreSQL. Eu já escrevi os testes unitários do `TradesService` (`trades.service.spec.ts`, em anexo), cobrindo fluxo normal e de extensão. O Prisma é mockado por um `InMemoryTradeRepository` injetado via `useValue` no `TestingModule`. Gere a implementação do `TradesService` e do `TradesController` de modo que todos os testes passem, seguindo o padrão do projeto. Não altere os testes."
> → Usei o mesmo prompt para cada um dos 5 endpoints (create, read-by-id, list, update, delete), sempre passando o `.spec.ts` correspondente. **Aceito com pequenos ajustes** (tipagem, imports e mensagens de exceção). Evidência: commits `48aab37`, `b1a0867`, `306eafa`, `f2f84f0`.

**Prompt 2 — documento de metodologia:**
> "Com base no histórico real do nosso repositório (commits, branches, PRs e pipeline no CircleCI), me ajude a escrever o documento de Metodologia de Desenvolvimento da NP2. O grupo usou Kanban assíncrono (sem sprints), porque todos trabalham e estudam. Cubra: metodologia + justificativa, papéis, cadência, ferramentas, DoD/DoR (aplicados na prática mas não formalizados), métricas simples e lições aprendidas. Em Markdown, português, tom honesto e com evidências rastreáveis."
> → **Ajustado.** Reescrevi trechos e substituí as métricas pelos números reais extraídos do `git log` (commits/PRs por integrante).

**Prompt 3 — debug do deploy:**
> "Subi a API NestJS no Render e ela crasha no start. Segue o log de erro [...]. O que pode estar causando e como corrijo?"
> → **Usado só para entender a causa**, não para copiar correção. Depois de entender o problema, apliquei o fix na mão.

**Dinâmica de uso:** uso individual e assíncrono. A IA entrou sempre depois dos testes — primeiro eu definia o contrato (testes), depois pedia a implementação. Não usei para revisar PRs dos colegas.

**O que NÃO foi feito por IA:** os testes unitários da entidade Trade foram escritos por mim — o desenho dos casos (fluxo normal vs. extensão), o que testar e o `InMemoryTradeRepository`. Também foram manuais: as decisões de arquitetura/padrão do projeto, a organização de branches/commits/PRs e o ajuste fino do README.

---

### Ian Marques
**Modelo utilizado:** Claude Sonnet 4.6.

**Para quê usei:**
- Evolução incremental dos testes de **CREATE e READ da Wishlist** (`POST /wishlists`, `GET /wishlists/:id`), guiada pelo alinhamento no Kanban.
- Adição e posterior **remoção de uma seção de "mock puro"**, convergindo para o padrão único `InMemoryRepository` exigido pelas convenções.
- Correção do `findOne` para **lançar `NotFoundException`** (em vez de retornar `null`) e alinhamento de nomes/indentação dos testes ao padrão do projeto.

**Prompt 1 — adicionar seção de testes (mock puro):**
> "Tenho um arquivo de testes para `WishlistService` que usa `InMemoryWishlistRepository`, cobrindo o fluxo normal de create e findOne. Preciso adicionar uma nova seção usando mock puro com `jest.fn()`, com uma constante `FIXED_DATE` e duas factories (`makePrismaWishlist`, `makePrismaItem`). Crie dois describes separados — `create – mock puro` e `findOne – mock puro` — cobrindo chamadas corretas ao prisma, retorno sem alteração, isolamento entre métodos e propagação de erros. Não altere os testes já existentes e siga o diagrama enviado."
> → **Aceito com ajustes.** A estrutura veio correta; alguns casos do `findOne – mock puro` precisaram ser reforçados num 2º prompt para deixar claro o isolamento entre métodos.

**Prompt 2 — corrigir indentação e nomes:**
> "Dentro do `describe('create')`, o bloco `describe('fluxo de extensão')` está com indentação incorreta — solto, sem recuo em relação ao describe pai. Corrija a indentação e atualize os nomes dos `it()` para inglês, alinhando com o padrão do projeto. Não altere nenhuma outra parte do arquivo."
> → **Aceito sem ressalvas** — a entrega mais limpa do ciclo; a IA respeitou o escopo restrito e não mexeu em nada fora do combinado.

**Prompt 3 — remover redundância entre mock puro e InMemory:**
> "Os testes via `InMemoryRepository` estão redundantes com a seção de mock puro. Remova os casos que verificam campos individuais dos itens e variações de `itemType` no fluxo normal. No fluxo de extensão do create, substitua os testes existentes por um de chamada correta ao prisma e um de propagação de erro. No `findOne`, garanta que o teste de exceção verifica que o service lança `NotFoundException` quando o repositório retorna `null` (não que o retorno é `null`)."
> → **Aceito parcialmente.** A remoção dos redundantes saiu bem; o ajuste do `findOne` não veio como esperado e exigiu um 2º prompt focado só nessa parte.

**Prompt 4 — `findOne` lança `NotFoundException`:**
> "Duas correções no `findOne`. Em `wishlist.service.ts`: o método retorna o resultado direto do `findUnique`, que pode ser `null` — corrija para lançar `NotFoundException` com a mensagem `Wishlist com id \"${id}\" não encontrada`, com assinatura `Promise<WishlistWithItems>` (sem `| null`). Em `wishlist.service.spec.ts`: renomeie o teste `'deve retornar null quando prisma retorna null'` para `'deve lançar NotFoundException quando prisma retorna null'` e troque as asserções para `rejects.toThrow(NotFoundException)`. Não altere mais nada."
> → **Aceito sem retrabalho** — escopo bem delimitado (dois arquivos, mudanças pontuais); a IA seguiu as instruções à risca.

**Dinâmica de uso:** uso individual e assíncrono, com o Kanban definindo o que precisava ser feito a cada etapa. Sempre parti do arquivo de testes já existente e pedia mudanças de **escopo restrito**, uma por vez, para que cada resposta rendesse um commit isolado e revisável. Os arquivos relevantes (o `.spec.ts` e o diagrama do modelo) eram anexados ao prompt, e instruía explicitamente a IA a **não alterar nada fora do combinado**. Quando o escopo de um prompt era grande demais, o resultado vinha parcial e eu refinava com um 2º prompt focado.

**O que NÃO foi feito por IA:**
- Decisões de escopo (o que entrava em cada etapa e o que era responsabilidade minha vs. dos colegas).
- A decisão de **remover a seção de mock puro** e convergir para o padrão único `InMemoryRepository` (interpretação do diagrama e das convenções).
- Quais casos testar em cada fluxo (normal vs. extensão) e o comportamento esperado de isolamento entre métodos.
- Organização de branches e commits seguindo o Conventional Commits.
- Revisão dos PRs dos colegas.
- Ajustes finos de indentação e de nomes identificados na revisão do código gerado.

---

### Gabriel Renato
**Modelo utilizado:** Claude Sonnet 4.6.

**Para quê usei:**
- Implementação dos endpoints de **update e delete da Wishlist** a partir do schema Prisma e dos testes existentes (TDD).
- **Refatoração dos testes** de update e delete para seguir o `docs/CONVENCOES.md`.
- Configuração do **job de lint** no pipeline CircleCI.

**Prompt 1 — geração dos endpoints a partir do código existente:**
> "Minha responsabilidade é implementar os endpoints de update e delete da entidade Wishlist. Os endpoints de create e findOne já foram feitos por outro colega — te mando `wishlist.service.ts`, `wishlist.controller.ts` e `wishlist.service.spec.ts` para entender o padrão, e o `schema.prisma` para contexto. O update deve substituir todos os itens via `deleteMany` + `create`. Tanto update quanto delete devem lançar `NotFoundException` quando o id não existir. Não altere os testes de create e findOne já existentes."
> → **Aceito com ajustes** na mensagem do `NotFoundException` (traduzida para português conforme a convenção) e na indentação dos blocos de extensão.

**Prompt 2 — refatoração dos testes seguindo as convenções:**
> "Segue o `CONVENCOES.md` do projeto e o `wishlist.service.spec.ts` mais recente. Refatore **apenas** os testes de update e delete da Wishlist seguindo as convenções, sem mexer nos de create e findOne (de outro colega). Divida as correções em partes para eu fazer commits separados."
> → **Aceito.** Refatoração dividida em 4 commits isolados; os blocos *mock puro* foram removidos e os testes ajustados para `toHaveBeenCalledWith` e uso direto do `inMemoryRepo`.

**Prompt 3 — job de lint no CircleCI:**
> "Sou responsável pelo job de lint no pipeline. Te mando o `config.yml` atual (já com o job de deploy do Fábio) e o `package.json` para confirmar o script de lint. O executor já está definido como `node-executor` com `cimg/node:22.11`. Gere apenas o job de lint seguindo o mesmo padrão (checkout, cache de dependências com `npm ci`, execução do script) e adicione-o ao workflow `ci-cd`."
> → **Usado diretamente** após confirmar que o script era `npm run lint`. O job foi adicionado com `restore_cache`/`save_cache`.

**Dinâmica de uso:** uso individual e assíncrono. Sempre parti do código já existente — primeiro entendia o padrão do que os colegas tinham feito (create, findOne), depois pedia a implementação no mesmo estilo. Para as refatorações, sempre fornecia o `CONVENCOES.md` como referência antes de pedir qualquer mudança. Os arquivos do projeto eram sempre anexados ao prompt para garantir que a IA seguisse o padrão da equipe.

**O que NÃO foi feito por IA:**
- Decisões de escopo (o que era minha responsabilidade vs. dos colegas).
- Leitura e interpretação do `CONVENCOES.md` para identificar o que precisava ser corrigido nos testes.
- Organização de branches e commits seguindo o Conventional Commits.
- Revisão dos PRs dos colegas.
- Ajustes finos de indentação e mensagens de erro identificados na revisão do código gerado.

---

## 👥 Equipe

| Integrante | Foco principal | Job no CI |
|------------|----------------|-----------|
| **Gabriel Baldoni** | Módulo Trade Proposal, regras de aceite | `test` |
| **Fábio Henrique** | Módulo Trades, configuração do CI/CD e deploy | `deploy` |
| **Ian Marques** | Módulo Wishlist, build | `build` |
| **Gabriel Renato** | Wishlist (refactors/endpoints), lint | `lint` |

> Todos os integrantes participaram de **commits, PRs e revisões** ao longo do semestre (ver histórico do repositório).
