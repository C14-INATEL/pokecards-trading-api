# 🃏 Pokecards Trading API

API REST desenvolvida em **NestJS + Prisma + PostgreSQL** para gerenciar **trocas de cartas Pokémon** entre treinadores. Um usuário monta sua **wishlist** (lista de cartas desejadas), abre uma **troca** (`trade`) oferecendo cartas em troca de outras, e outros usuários enviam **propostas** (`trade proposals`). Quando o dono aceita uma proposta, a troca é concluída e as demais propostas pendentes são canceladas automaticamente.

> 📚 **Documentação interativa (Swagger):** https://fortunate-mercy-production-e6fc.up.railway.app/docs

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
├── trades/                  # módulo de trocas (create + read)
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
└── config.yml               # pipeline CI/CD (lint, test, build, deploy)

scripts/
└── notify.js                # notificação por e-mail do resultado do pipeline

docs/                        # documentação de Engenharia de Software (NP2)
├── historias-de-usuario.md
├── metodologia.md
└── dinamica-de-desenvolvimento.md
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
Criação e consulta de trocas. Uma trade é criada já com suas cartas oferecidas e solicitadas em uma única operação aninhada. Buscar uma trade inexistente lança `404`.

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
| GET | `/trades/:id` | Busca por ID | `200` / `404` |

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

No pipeline de deploy, é usada ainda a variável `RENDER_DEPLOY_HOOK_URL` (hook de deploy do Render) e, na notificação, as variáveis SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL`).

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
| `trades.service.spec.ts` | ~10 | create aninhado, findOne, `NotFoundException` |
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

O pipeline `ci-cd` é composto por **4 jobs sequenciais**, cada um de responsabilidade (e comitado) por um integrante — atendendo ao requisito de **≥ 1 job por integrante**:

| Ordem | Job | Responsável | O que faz |
|-------|-----|-------------|-----------|
| 1 | `lint` | **Gabriel Renato** | `npm ci` + `npm run lint` (ESLint) |
| 2 | `test` | **Gabriel Baldoni** | `npm ci` + testes com cobertura; salva `coverage/` como artefato |
| 3 | `build` | **Ian** | `npm install` + `npm run build` (compila para `dist/`) |
| 4 | `deploy` | **Fábio** | Dispara o deploy no **Render** via `RENDER_DEPLOY_HOOK_URL` |

```
lint → test → build → deploy
                        └── só na branch main (filtro)
```

- O executor é `cimg/node:22.11` (Docker).
- O job `deploy` roda **apenas na branch `main`** e valida o HTTP de resposta do Render (`200`/`201`).
- O script [`scripts/notify.js`](scripts/notify.js) gera um **e-mail de notificação** (via Nodemailer) com o status de cada job ao final do pipeline.

---

## 📐 Convenções de código

As convenções do projeto estão formalizadas no [template de Pull Request](.github/pull_request_template.md), aplicado a todo PR. Resumo:

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
- **Code review:** todo merge passa por **Pull Request** com revisão de outro integrante. O histórico tem **29 PRs** mergeados (#1 a #29) com discussão entre os membros.
- **Refactoring contínuo:** vários PRs de refactor documentam a evolução do código (ex.: `refactor: adapt code to match the new diagram structure`, padronização de testes da wishlist, adequação às convenções da trade-proposal).

---

## 📚 Documentação de Engenharia de Software (NP2)

A documentação dos requisitos da NP2 está na pasta [`docs/`](docs/), em arquivos `.md` separados para facilitar a leitura (inclusive por agentes de IA):

| Documento | Conteúdo |
|-----------|----------|
| [`docs/historias-de-usuario.md`](docs/historias-de-usuario.md) | Histórias de usuário (formato *Como… quero… para que…*), critérios de aceitação (Given/When/Then), prioridade, status e **rastreabilidade** (história → PR → teste). |
| [`docs/metodologia.md`](docs/metodologia.md) | Metodologia adotada, papéis no grupo, cadência, ferramentas e métricas. |
| [`docs/dinamica-de-desenvolvimento.md`](docs/dinamica-de-desenvolvimento.md) | Como o trabalho aconteceu no dia a dia: divisão de tarefas, decisões técnicas, conflitos/bloqueios e lições aprendidas. |

**Resumo:** o grupo trabalhou em fluxo baseado em **Pull Requests** na organização do GitHub, com **commits convencionais**, **TDD** (testes antes da implementação) e **revisão obrigatória por par**. As decisões técnicas (modelo de dados, troca de CI para CircleCI, padronização de testes com `InMemoryRepository`) estão registradas em PRs específicos — ver os documentos acima para o detalhamento e a rastreabilidade completa.

---

## 🤖 Uso de IA

> ⏳ **Seção em construção** — será preenchida quando os prompts de todos os integrantes forem coletados.
>
> Conteúdo mínimo a incluir (conforme a disciplina):
> - **Modelos utilizados** (ex.: Claude, ChatGPT/GPT-4, Gemini, Copilot, Cursor...).
> - **Para quê foram usados** (geração de código, refatoração, testes, documentação, debugging, brainstorming...).
> - **Exemplos reais de prompts** (pelo menos 3) e quais respostas foram **aceitas, ajustadas ou descartadas**.
> - **Dinâmica de uso** (individual, pair programming, revisão de PRs, geração de testes...).
> - **O que NÃO foi feito por IA** — partes desenvolvidas "à mão".

---

## 👥 Equipe

| Integrante | Foco principal | Job no CI |
|------------|----------------|-----------|
| **Gabriel Baldoni** | Módulo Trade Proposal, regras de aceite | `test` |
| **Fábio Henrique** | Módulo Trades, configuração do CI/CD e deploy | `deploy` |
| **Ian Marques** | Módulo Wishlist, build | `build` |
| **Gabriel Renato** | Wishlist (refactors/endpoints), lint | `lint` |

> Todos os integrantes participaram de **commits, PRs e revisões** ao longo do semestre (ver histórico do repositório).
