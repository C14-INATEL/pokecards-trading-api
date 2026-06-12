# 📋 Histórias de Usuário

> API REST em **NestJS · Prisma · PostgreSQL · Jest · Docker · GitHub Actions**  
> Repositório: [C14-INATEL/pokecards-trading-api](https://github.com/C14-INATEL/pokecards-trading-api) · Branch: `dev`

---

## Convenções

| Campo | Valores |
|---|---|
| **Prioridade** | `Alta` / `Média` / `Baixa` |
| **Status** | `✅ Entregue` / `⚠️ Parcial` / `❌ Descartada` |
| **Rastreabilidade** | História → Módulo/Arquivo → Teste automatizado |

---

## US-01 — Criar Wishlist

> **Como** colecionador de cartas Pokémon,  
> **eu quero** criar uma lista de desejos (wishlist) com nome e itens iniciais,  
> **para que** eu possa registrar quais cartas quero adquirir por troca.

| Prioridade | Status |
|---|---|
| Alta | ✅ Entregue |

### Critérios de Aceitação

```gherkin
Given que o usuário fornece userId, name e uma lista de itens (cardId ou filtro)
When  POST /wishlist é enviada com dados válidos
Then  a API retorna 201 com o objeto wishlist criado,
      incluindo id (UUID), userId, name, createdAt e o array items populado

Given que o usuário omite o campo name
When  POST /wishlist é enviada
Then  a API retorna 400 Bad Request com mensagem de validação

Given que o item tem itemType SPECIFIC_CARD mas cardId não é fornecido
When  POST /wishlist é enviada
Then  a API retorna 400 Bad Request indicando campo obrigatório ausente
```

### Rastreabilidade

| Camada | Referência |
|---|---|
| Implementação | `src/wishlist/wishlist.service.ts` · `src/wishlist/wishlist.controller.ts` |
| DTO | `src/wishlist/dto/create-wishlist.dto.ts` |
| Teste unitário | `wishlist.service.spec.ts` → describe `"fluxo normal"` → `should create a wishlist` |
| Teste E2E | `test/trades.e2e-spec.ts` |

---

## US-02 — Consultar e Atualizar Wishlist

> **Como** colecionador de cartas Pokémon,  
> **eu quero** buscar minha wishlist por ID e atualizar seu nome ou lista de itens,  
> **para que** eu possa manter minha lista de desejos sempre atualizada conforme minha coleção evolui.

| Prioridade | Status |
|---|---|
| Alta | ✅ Entregue |

### Critérios de Aceitação

```gherkin
Given que existe uma wishlist com id válido
When  GET /wishlist/:id é enviada
Then  a API retorna 200 com o objeto wishlist completo (incluindo items)

Given que o id informado não corresponde a nenhuma wishlist
When  GET /wishlist/:id é enviada
Then  a API retorna 404 NotFoundException

Given que existe uma wishlist com id válido e dto.items é fornecido
When  PATCH /wishlist/:id é enviada
Then  todos os itens anteriores são substituídos (deleteMany + create)
      e a API retorna 200 com a wishlist atualizada

Given que o id informado não corresponde a nenhuma wishlist
When  PATCH /wishlist/:id é enviada
Then  a API retorna 404 NotFoundException
```

### Rastreabilidade

| Camada | Referência |
|---|---|
| Implementação | `src/wishlist/wishlist.service.ts` (métodos `findOne`, `update`) |
| DTO | `src/wishlist/dto/update-wishlist.dto.ts` |
| Teste normal | `wishlist.service.spec.ts` → `should find a wishlist by id` / `should update a wishlist` |
| Teste de borda | `wishlist.service.spec.ts` → `should throw NotFoundException on update with invalid id` |

---

## US-03 — Excluir Wishlist

> **Como** colecionador de cartas Pokémon,  
> **eu quero** poder remover uma wishlist que não é mais relevante,  
> **para que** minha área de gerenciamento permaneça organizada e livre de listas obsoletas.

| Prioridade | Status |
|---|---|
| Média | ✅ Entregue |

### Critérios de Aceitação

```gherkin
Given que existe uma wishlist com id válido
When  DELETE /wishlist/:id é enviada
Then  a API retorna 204 No Content (void)
      e a wishlist é removida do banco de dados

Given que o id informado não existe
When  DELETE /wishlist/:id é enviada
Then  a API retorna 404 NotFoundException
      e nenhum dado é modificado no banco
```

### Rastreabilidade

| Camada | Referência |
|---|---|
| Implementação | `src/wishlist/wishlist.service.ts` (método `delete`) · `wishlist.controller.ts` |
| Teste normal | `wishlist.service.spec.ts` → `should delete a wishlist` |
| Teste de borda | `wishlist.service.spec.ts` → `should throw NotFoundException on delete with invalid id` |

---

## US-04 — Criar e Gerenciar Trade

> **Como** usuário da plataforma,  
> **eu quero** criar uma trade informando quais cartas ofereço e quais desejo receber, podendo opcionalmente vinculá-la à minha wishlist,  
> **para que** outros usuários possam encontrar minha oferta e me fazer uma proposta de troca.

| Prioridade | Status |
|---|---|
| Alta | ✅ Entregue |

### Critérios de Aceitação

```gherkin
Given que o usuário fornece ownerId, offeredCards e requestedCards válidos
When  POST /trades é enviada
Then  a API retorna 201 com a trade criada, status OPEN
      e arrays de TradeItem populados

Given que existe ao menos uma trade cadastrada
When  GET /trades é enviada
Then  a API retorna 200 com lista paginada de trades

Given que a trade existe e ownerId corresponde ao dono
When  PATCH /trades/:id é enviada com status CANCELLED
Then  a API retorna 200 com o status atualizado para CANCELLED

Given que o id da trade não existe
When  qualquer requisição GET/PATCH/DELETE /trades/:id é enviada
Then  a API retorna 404 NotFoundException

Given que linkedWishlistId é informado
When  POST /trades é enviada
Then  o campo linkedWishlistId é persistido e retornado no objeto da trade
```

### Rastreabilidade

| Camada | Referência |
|---|---|
| Implementação | `src/trades/trades.service.ts` · `src/trades/trades.controller.ts` |
| Teste E2E | `test/trades.e2e-spec.ts` (suite principal de integração) |
| Teste unitário | Desenvolvido por Fábio Henrique via TDD antes da implementação |
| Modelo de dados | `TradeStatus` enum: `OPEN`, `CONCLUDED`, `CANCELLED` · `TradeItem` |

---

## US-05 — Propor Troca (Trade Proposal)

> **Como** usuário interessado em uma trade aberta,  
> **eu quero** enviar uma proposta de troca informando quais cartas ofereço em resposta,  
> **para que** o dono da trade possa avaliar e aceitar ou recusar minha oferta.

| Prioridade | Status |
|---|---|
| Alta | ✅ Entregue |

### Critérios de Aceitação

```gherkin
Given que existe uma trade com status OPEN
  e o usuário fornece tradeId, proposerId e offeredCards válidos
When  POST /trade-proposal é enviada
Then  a API retorna 201 com a proposta criada, status PENDING
      e o array offeredCards populado (include: { offeredCards: true })

Given que message é omitida
When  POST /trade-proposal é enviada
Then  a proposta é criada normalmente e message é null no retorno

Given que a trade referenciada não existe
When  POST /trade-proposal é enviada
Then  a API retorna 404 ou erro de constraint (tradeId inválido)

Given que proposerId é igual ao ownerId da trade
When  POST /trade-proposal é enviada
Then  a API rejeita a proposta
      [caso de borda documentado nos testes de extensão]
```

### Rastreabilidade

| Camada | Referência |
|---|---|
| Implementação | `src/trade-proposal/trade-proposal.service.ts` · `trade-proposal.controller.ts` |
| DTO | `src/trade-proposal/dto/create-trade-proposal.dto.ts` |
| Teste unitário | `trade-proposal.service.spec.ts` → `"fluxo normal"` e `"fluxo de extensão"` (5–8 casos) |
| Modelo de dados | `ProposalStatus` enum: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED` |

---

## US-06 — Filtrar Wishlist por Tipo e Raridade

> **Como** colecionador,  
> **eu quero** adicionar itens do tipo `FILTER` à minha wishlist especificando tipo e raridade da carta,  
> **para que** eu possa expressar interesse em qualquer carta que atenda àquele perfil, sem precisar conhecer o ID exato.

| Prioridade | Status |
|---|---|
| Média | ✅ Entregue |

### Critérios de Aceitação

```gherkin
Given que o usuário cria uma wishlist com um item de itemType FILTER
  e fornece filterType e filterRarity
When  POST /wishlist é enviada
Then  o item é persistido com filterType e filterRarity preenchidos
      e cardId é null

Given que o item é FILTER mas filterType está ausente
When  POST /wishlist é enviada
Then  a API retorna 400 (validação de campo obrigatório para o tipo FILTER)

Given que o usuário usa SPECIFIC_CARD e FILTER no mesmo array de items
When  POST /wishlist é enviada
Then  ambos os tipos são persistidos corretamente na mesma wishlist
```

### Rastreabilidade

| Camada | Referência |
|---|---|
| Implementação | `src/wishlist/wishlist.service.ts` (lógica de create com `itemType`) |
| Modelo de dados | `WishlistItemType` enum: `SPECIFIC_CARD`, `FILTER` · campos `filterType`, `filterRarity` |
| Schema | `prisma/schema.prisma` → model `WishlistItem` |
| Teste unitário | `wishlist.service.spec.ts` → casos envolvendo itens do tipo `FILTER` |

---

## US-07 — Pipeline CI/CD com Notificação Automática

> **Como** membro da equipe de desenvolvimento,  
> **eu quero** que cada push nas branches `main` e `dev` execute automaticamente os testes e o build,  
> **para que** erros sejam detectados antes do merge e o deploy no Railway ocorra somente quando tudo estiver verde.

| Prioridade | Status |
|---|---|
| Média | ✅ Entregue |

### Critérios de Aceitação

```gherkin
Given que um push é feito nas branches main ou dev
When  o GitHub Actions é acionado
Then  os jobs "testes" e "build" rodam em paralelo
      e o relatório de cobertura é salvo como artefato

Given que ambos os jobs finalizam com sucesso e o push é na branch main
When  o pipeline avança
Then  o job "deploy" publica automaticamente no Railway

Given que qualquer job falha
When  o pipeline finaliza
Then  o job "notificação" envia e-mail com o status de cada job,
      independentemente do resultado

Given que as secrets RAILWAY_TOKEN e SMTP_* estão configuradas
When  o pipeline é executado
Then  nenhuma credencial é exposta nos logs do Actions
```

### Rastreabilidade

| Camada | Referência |
|---|---|
| CI/CD | `.github/workflows/` (4 jobs: testes, build, deploy, notificação) |
| Script | `scripts/notify.js` |
| Cobertura | `npm run test:cov` → relatório salvo como artefato do workflow |
| Secrets | `RAILWAY_TOKEN`, `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID`, `SMTP_*` |

---

## Resumo

| # | História | Módulo principal | Arquivo de teste | Prioridade | Status |
|---|---|---|---|---|---|
| US-01 | Criar Wishlist | `src/wishlist/` | `wishlist.service.spec.ts` | Alta | ✅ Entregue |
| US-02 | Consultar/Atualizar Wishlist | `src/wishlist/` | `wishlist.service.spec.ts` | Alta | ✅ Entregue |
| US-03 | Excluir Wishlist | `src/wishlist/` | `wishlist.service.spec.ts` | Média | ✅ Entregue |
| US-04 | Criar e Gerenciar Trade | `src/trades/` | `test/trades.e2e-spec.ts` | Alta | ✅ Entregue |
| US-05 | Propor Troca | `src/trade-proposal/` | `trade-proposal.service.spec.ts` | Alta | ✅ Entregue |
| US-06 | Filtrar Wishlist | `src/wishlist/` | `wishlist.service.spec.ts` | Média | ✅ Entregue |
| US-07 | Pipeline CI/CD | `.github/workflows/` | GitHub Actions (cobertura) | Média | ✅ Entregue |
