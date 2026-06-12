# Dinâmica de Desenvolvimento do Projeto

---

## 1. Dinâmica de Desenvolvimento

### 1.1 Composição e Divisão da Equipe

A equipe é composta por 4 integrantes, com um membro atuando como representante responsável por distribuir tarefas e alinhar prioridades. O trabalho é dividido por funcionalidades e módulos, garantindo responsabilidade clara para cada membro e desenvolvimento paralelo sem sobreposição.

### 1.2 Comunicação e Acompanhamento

A comunicação acontece de forma contínua e assíncrona, principalmente por grupo de WhatsApp, onde decisões são tomadas, dúvidas resolvidas e tarefas redistribuídas. Os alinhamentos acontecem sob demanda (event-driven) — sempre que é preciso integrar a branch principal, distribuir um novo bloco de tarefas ou validar uma entrega —, em vez de reuniões com data fixa. As atribuições são definidas pelo representante e anotadas individualmente por cada integrante.

### 1.3 Fluxo de Desenvolvimento e Controle de Versão

O versionamento é feito com Git no GitHub, seguindo o modelo de branches individuais por membro. Ao concluir uma funcionalidade, o integrante abre um Pull Request que passa por code review antes de ser integrado ao código principal.

### 1.4 Integração Contínua e Testes

O projeto adota CI/CD: testes automatizados são executados a cada PR e o merge só é autorizado após aprovação nos testes e revisão da equipe. Os testes foram estruturados no início do desenvolvimento e complementados por testes manuais ao longo do projeto.

### 1.5 Entrega e Implantação

O produto é entregue via repositório GitHub vinculado à organização da faculdade. O próprio fluxo de CI/CD garante que apenas código revisado e aprovado chegue à branch principal de entrega.

### 1.6 Cronograma

O projeto não segue um cronograma rígido por tarefa, mas organiza o avanço em torno dos prazos das entregas principais definidos pela instituição, com o representante garantindo o alinhamento da equipe em alinhamentos feitos sob demanda.

---

## 2. Lições Aprendidas

### 2.1 O que Funcionou Bem

**CI/CD** — A automação dos testes a cada PR reduziu retrabalho e deu mais confiança nas entregas, impedindo que código com falhas fosse integrado ao projeto.

**Comunicação assíncrona** — O fluxo contínuo via WhatsApp, com alinhamentos sob demanda, foi essencial para manter o time alinhado sem depender de reuniões com horário fixo, redistribuir tarefas e antecipar problemas antes que se tornassem bloqueios.

### 2.2 Dificuldades Encontradas

**Conflitos de merge** — Inevitáveis com o desenvolvimento paralelo, foram reduzidos significativamente após a adoção do fluxo de branches individuais com PRs e code review.

**Comunicação** — Falhas identificadas no início foram ajustadas ao longo do projeto, resultando em uma comunicação mais eficiente nas fases seguintes.

**Dificuldade técnica** — Obstáculos com algumas tecnologias foram superados durante o desenvolvimento, sem impacto no escopo ou nos prazos.

**Divergência de opiniões** — Resolvida sempre por diálogo até chegar a um consenso, preservando o alinhamento e o clima colaborativo da equipe.

### 2.3 O que Fariam Diferente

Definir uma dinâmica de comunicação mais estruturada desde o início — canal, frequência e forma de registrar combinados — para evitar os ruídos que surgiram nas fases iniciais.

---

## 3. Decisões

### 3.1 Tomada de Decisão

As decisões foram tomadas de forma coletiva, por meio de discussão até se alcançar consenso. Todas as vozes tinham peso igual no processo, o que fortaleceu o comprometimento da equipe com as escolhas feitas.

### 3.2 Estabilidade do Escopo

O escopo, as tecnologias e a arquitetura definidos no início foram mantidos sem alterações significativas até a entrega, refletindo maturidade no planejamento e disciplina na execução.

### 3.3 Escolha de Tecnologias

As ferramentas foram escolhidas com base na experiência prévia dos membros, reduzindo a curva de aprendizado e permitindo foco na entrega das funcionalidades.

### 3.4 Perspectiva Futura

A equipe repetiria a dinâmica adotada em projetos futuros, com um ajuste principal: estruturar melhor a comunicação desde o início para evitar os problemas de alinhamento vivenciados neste projeto.
