# Metodologia de Desenvolvimento — Pokecards Trading API

> Documento do requisito **3.2 — Metodologia de Desenvolvimento** (Projeto C14 — NP2).
> Aqui descrevemos *qual* metodologia o grupo adotou, *por quê*, e mostramos **evidências reais** extraídas do histórico do repositório (commits, branches e Pull Requests).

---

## 1. Metodologia adotada: Kanban (fluxo contínuo)

O grupo adotou o **Kanban**, em modelo de **fluxo contínuo orientado a um MVP definido previamente**.

O funcionamento foi:

1. O **Tech Lead** definiu o escopo do MVP (entidades, endpoints e padrões do projeto).
2. O escopo foi quebrado em **tarefas independentes**, cada uma com um responsável.
3. Cada integrante puxava sua tarefa e a desenvolvia **no seu próprio ritmo**, sem dependência forte dos demais.

### Por que Kanban (e não Scrum)?

A escolha foi **deliberada e ligada à realidade do grupo**:

- **Todos os integrantes trabalham e estudam ao mesmo tempo.** Sprints com cadência fixa e cerimônias rígidas (planning/daily/review/retro em horários fechados) seriam difíceis de sustentar.
- O Kanban permite **trabalho assíncrono**: cada um avança quando tem disponibilidade, sem travar o time.
- As tarefas foram desenhadas para serem **fracamente acopladas** (cada pessoa dona de um módulo/conjunto de endpoints), reduzindo dependências e conflitos.
- O foco ficou em **limitar trabalho em andamento e manter o fluxo** (uma tarefa fechava via PR antes da próxima entrar), em vez de comprometer-se com um volume fixo por sprint.

> Em resumo: **Kanban porque o time é assíncrono.** A metodologia foi escolhida para se adaptar à disponibilidade real dos integrantes, e não o contrário.

---

## 2. Papéis e responsabilidades

| Integrante | Papel | Responsabilidades principais |
|---|---|---|
| **Fábio Henrique** | **Tech Lead / Dev** | Criação e padrões do projeto (estrutura NestJS + Prisma); definição de papéis e tarefas; definição do fluxo e dos padrões de organização no GitHub (branches, commits, PRs); CRUD da entidade **Trades** + testes unitários (fluxo normal e de extensão). |
| **Gabriel Baldoni** | **Dev** | CRUD da entidade **Trade Proposal** (endpoints + regras de negócio) + testes unitários (fluxo normal e de extensão). |
| **Ian Marques** | **Dev / QA / Docs** | **CREATE e LIST** da **Wishlist** (endpoints + testes unitários, fluxo normal e de extensão); reforço em documentação e validação contínua do sistema em produção. |
| **Gabriel Renato** | **Dev / QA / Docs** | **UPDATE e DELETE** da **Wishlist** (endpoints + testes unitários, fluxo normal e de extensão); reforço em documentação e validação contínua do sistema em produção. |

> **Observação sobre divisão de carga (transparência):** Ian e Gabriel Renato tiveram uma carga **menor de código**, compensada por **maior produção de documentação** e por **testes contínuos do sistema em ambiente de produção**, atuando de forma preventiva contra erros. Essa divisão é coerente com as métricas da Seção 6: ambos figuram entre os que **mais revisaram e mesclaram Pull Requests** dos colegas.

---

## 3. Cadência e rituais

Por ser um fluxo Kanban assíncrono, **não houve sprints com data fixa**. As interações aconteceram **sob demanda (event-driven)**, sempre que necessário:

- **Sincronização de `main`/`dev`:** reunião rápida sempre que era preciso atualizar/integrar a branch principal.
- **Distribuição de novas tarefas:** alinhamento quando um novo bloco de trabalho era liberado pelo Tech Lead.
- **Validação de entregas:** alinhamento para validar a entrega do laboratório ou da parte teórica da matéria.

A comunicação do dia a dia foi feita de forma **contínua e assíncrona via grupo de WhatsApp**, onde decisões eram tomadas, dúvidas resolvidas e tarefas redistribuídas.

---

## 4. Ferramentas

| Categoria | Ferramenta |
|---|---|
| Gestão do fluxo / comunicação | **Grupo de WhatsApp** (decisões, distribuição de tarefas e alinhamentos) |
| Versionamento e revisão | **GitHub** (branches, Pull Requests, code review) |
| CI/CD | **CircleCI** (lint, testes, build e deploy no Render) |
| Stack de desenvolvimento | **NestJS, Prisma, PostgreSQL, Jest, Docker, TypeScript** |

> O grupo optou por **não usar uma ferramenta dedicada de board** (Jira/Trello/GitHub Projects). A gestão das tarefas foi conduzida diretamente pelo Tech Lead via WhatsApp, e o **próprio quadro de Pull Requests do GitHub funcionou como board informal** do que estava "em andamento" e "concluído". Essa decisão é coerente com um time pequeno e assíncrono — registramos aqui de forma transparente, e está entre as **lições aprendidas** (ver Seção 7).

---

## 5. Definição de Pronto (DoD) e Definição de Preparado (DoR)

O grupo **não formalizou** DoD/DoR por escrito durante o projeto, mas **ambos foram aplicados na prática de forma consistente**. Documentamos aqui o que foi efetivamente seguido.

### Definição de Preparado (DoR) — quando uma tarefa podia começar

Uma tarefa só era distribuída quando:

- [x] O **escopo estava claro** (qual entidade e quais endpoints/operações).
- [x] Havia um **responsável único** definido pelo Tech Lead.
- [x] O **padrão a seguir estava definido** (módulo de referência já existente no projeto + padrões de NestJS/Prisma).
- [x] As **dependências estavam resolvidas** (a tarefa foi desenhada para ser independente das demais).

### Definição de Pronto (DoD) — quando uma tarefa era considerada concluída

Uma tarefa só era considerada "pronta" quando:

- [x] **Endpoints/serviços implementados** seguindo o padrão do projeto.
- [x] **Testes unitários** escritos cobrindo **fluxo normal e fluxo de extensão** (casos de erro/borda).
- [x] **Pipeline de CI verde** (lint + build + testes passando no CircleCI).
- [x] **Pull Request aberto, revisado e aprovado** por outro integrante.
- [x] **Merge na branch de integração (`dev`)**, seguindo o padrão de Conventional Commits.

---

## 6. Métricas

Métricas simples extraídas diretamente do histórico do repositório.

> 📸 **Snapshot:** dados extraídos em **12/06/2026** (todas as branches).
> Como o projeto continua recebendo commits, estes números são uma **foto no tempo** e tendem apenas a **crescer**. Para conferir os valores atualizados, veja o bloco "Como reproduzir" ao final desta seção.

| Métrica | Valor |
|---|---|
| Período do projeto | 17/03/2026 → 12/06/2026 (~12 semanas) |
| Pull Requests mesclados | **37** (numerados até #38) |
| Commits de trabalho (sem merges) | **102** |

### Throughput por mês (commits de trabalho, sem merges)

| Mês | Commits |
|---|---|
| Mar/2026 | 5 (setup inicial do projeto) |
| Abr/2026 | 31 |
| Mai/2026 | 35 |
| Jun/2026 | 31 |

### Contribuição por integrante

| Integrante | Commits (trabalho) | PRs revisados / mesclados |
|---|---|---|
| Fábio Henrique | 32 | 10 |
| Gabriel Baldoni | 36 | 8 |
| Ian Marques | 22 | 11 |
| Gabriel Renato | 12 | 8 |

### Como reproduzir as métricas

Os números acima podem ser regerados a qualquer momento com os comandos abaixo (a partir da raiz do repositório):

```bash
# Pull Requests mesclados
git log --all --merges --oneline | grep -ci "pull request"

# Commits de trabalho (sem merges)
git log --all --no-merges --oneline | wc -l

# Commits por mês
git log --all --no-merges --pretty=format:"%ad" --date=format:"%Y-%m" | sort | uniq -c

# Commits por integrante (ex.: Fábio)
git log --all --no-merges --author="FabioHenriqueSCC\|Fábio Henrique" --oneline | wc -l
```

> **Leitura das métricas:** a contribuição em **código** está concentrada em Fábio e Baldoni, enquanto a contribuição de Ian e Gabriel Renato se distribui também em **revisão de PRs, documentação e validação em produção**. O número alto de PRs revisados/mesclados por **todos** os integrantes evidencia que o **code review foi distribuído** — nenhum membro mesclava o próprio trabalho sem revisão (atende aos critérios #5 e #6 da avaliação).

---

## 7. Lições aprendidas (sobre a metodologia)

- **O que funcionou:** o Kanban assíncrono se encaixou bem na rotina de quem trabalha e estuda; a divisão por módulos independentes minimizou conflitos de merge; o fluxo de PR + review manteve a qualidade sem exigir reuniões frequentes.
- **O que melhoraríamos:** adotar uma **ferramenta de board** (GitHub Projects) para tornar o WIP visível a todos, e **formalizar DoD/DoR desde o início** — já os seguíamos na prática, mas escrevê-los teria deixado as expectativas mais explícitas para todo o time.

---

## 8. Rastreabilidade e evidências

Toda a metodologia descrita pode ser auditada no próprio repositório:

- **Fluxo de branches:** `feature/*`, `feat/*`, `fix/*`, `refactor/*`, `chore/*`, `docs/*` → integradas via PR em `dev` → `main`.
- **Padrão de commits:** Conventional Commits (`feat`, `fix`, `test`, `refactor`, `chore`, `docs`, `ci`) — ex.: `feat(trades): add findAll endpoint using TDD method`.
- **Pull Requests:** 37 PRs mesclados, com revisão entre membros.
- **CI/CD:** configuração em `.circleci/config.yml`.
- **Template de PR:** `.github/pull_request_template.md`.

> Para a defesa Q&A: qualquer afirmação deste documento pode ser comprovada ao vivo via `git log`, pela aba de Pull Requests do GitHub ou pelo painel do CircleCI.
