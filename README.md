# 🧪 Testing Playbook

**Um norte normativo de testes inteligentes para desenvolvimento de software — feito para ser consumido por humanos e por IAs de codificação (Claude Code, Cursor, Copilot e afins).**

> **Missão:** transformar esforço de teste em confiança mensurável para evoluir produto sem quebrar o que importa.
> **Princípio:** não buscamos quantidade de testes — buscamos prova de que o sistema sustenta seus riscos críticos.

Serve aos dois momentos da vida de uma suíte:

- **Planejando:** a IA (ou você) decide quais testes realmente valem antes de escrever uma linha.
- **Mantendo:** revise uma suíte existente e corte teste de vaidade, duplicação de risco e automação frágil que só consome manutenção.

Não é uma coletânea de boas práticas nem um gerador de cobertura inflada: é **norma operacional**. Regras objetivas (MUST/NEVER), motor de decisão por risco, roteamento por camada, playbooks práticos e quality gates verificáveis. Companheiro do [security-playbook](https://github.com/silasmarques/security-playbook): segurança de teste (RLS, prompt injection, abuso de auth, vazamento de secret) mora lá e é **referenciada, não duplicada**.

**Em números:** 13 regras inegociáveis · 3 módulos [strategy/](strategy/) · 5 [playbooks/](playbooks/) · 2 [prompts/](prompts/) · 1 [exemplo resolvido](examples/test-strategy-share-link.md) · [AGENTS.md](AGENTS.md) para orientar IAs · [CI](.github/workflows/ci.yml) que verifica a norma e prova que a verificação consegue falhar · integração explícita com o `security-playbook`.

**Por que isso importa, medido:** no [laboratório](lab/README.md) deste repositório há uma suíte com **14 testes verdes, 96% de cobertura de linhas, e 3 de 8 bugs críticos passam** sem nenhum teste perceber — dois deles com um teste de nome certo que não consegue falhar. O CI planta cada bug e confere. <!-- lab: {"testes":14,"defeituosos":11,"uteis":5,"bugs":8,"escapam":3,"cobertura":96} -->

**Neste README:** [O que tem dentro](#-o-que-tem-dentro) · [Como usar](#-como-usar--passo-a-passo) · [Princípios de design](#-princípios-de-design) · [Manutenção e garantias](#-manutenção-e-garantias) · [Playbook companheiro](#playbook-companheiro) · [Licença](#-licença)

---

## 📦 O que tem dentro

```text
testing-playbook/
├── TESTING.md           ← porta de entrada: 13 inegociáveis + roteamento + instruções p/ IA
├── strategy/            ← decisão por risco, camadas e gates de qualidade
├── playbooks/           ← integração/unitário, API, contrato, E2E e performance
├── prompts/             ← estratégia de teste por feature + revisão de suíte existente
├── examples/            ← exemplo resolvido: como fica uma boa estratégia
├── templates/           ← TESTING-STATUS.md: o registro que fica no projeto
├── lab/                 ← suíte-cobaia com defeitos plantados + gabarito provado por mutação
├── eval/                ← mede se uma IA, com o playbook, revisa a cobaia direito
├── scripts/             ← verificação determinística da norma + mutações que a provam
├── AGENTS.md            ← regras para agentes (usando o playbook / alterando este repo)
├── CHANGELOG.md         ← o que mudou na norma, e por quê
└── .github/workflows/   ← CI: verify-docs + mutações, gitleaks, cadência de revisão
```

### A porta de entrada

**[TESTING.md](TESTING.md)** — 13 regras inegociáveis + tabela de roteamento ("vou testar X → leio Y") + gate de risco em uma frase + instruções de como uma IA deve decidir, propor e reportar testes. É o único arquivo que precisa estar sempre à mão; o resto é consultado sob demanda.

### 3 módulos de estratégia — [strategy/](strategy/)

- **[test-value-and-risk](strategy/test-value-and-risk.md)** — o motor que impede a suíte de virar teatro. Define risco como **probabilidade × impacto**, rejeita score numérico aditivo por falsa precisão e aplica um gate binário: se o teste não nomeia bug real, regra protegida e falha plausível, ele é candidato a não existir.

- **[test-layers](strategy/test-layers.md)** — decide onde o teste vive. Usa a **Testing Trophy** como bússola prática: teste onde o risco se manifesta, na camada mais barata que prova o comportamento. Unitário para regra pura, integração para partes conversando, API/contrato para fronteiras, E2E para jornada crítica.

- **[quality-gates](strategy/quality-gates.md)** — transforma risco do diff em gate de PR. Ativa critérios conforme o que mudou (regra de negócio, permissão, API, integração, UI crítica, performance) e fecha com release sign-off baseado em evidência e risco aceito.

### 5 playbooks de camada — [playbooks/](playbooks/)

- **[integration-testing](playbooks/integration-testing.md)** — a camada de maior peso. O que precisa ser real para o teste provar o risco, o que pode ser dublê (e qual), dado isolado por teste, tempo injetado e lógica pura em tabela de casos.

- **[api-testing](playbooks/api-testing.md)** — a API testada antes da UI. Happy path, caminho triste, boundary, contrato, autorização, ownership A×B, idempotência, paginação e erro sem vazar internals.

- **[contract-testing](playbooks/contract-testing.md)** — a fronteira consumidor ↔ provedor. Contratos consumer-driven, schema positivo e negativo, compatibilidade entre versões e a ferramenta mais leve que prova o risco.

- **[e2e-testing](playbooks/e2e-testing.md)** — jornada crítica, não detalhe interno. Cobre fluxo de usuário com valor real, estado autossuficiente, seletor estável, espera por condição e evidência útil quando falha.

- **[performance-testing](playbooks/performance-testing.md)** — carga com objetivo. Sem threshold não é teste: cada cenário precisa de SLO, p95/p99, taxa de erro, volume e critério claro de aprovação/falha.

### 2 prompts prontos — [prompts/](prompts/)

| Prompt | Quando usar |
|---|---|
| [test-strategy](prompts/test-strategy.md) | Planejar testes de uma feature: riscos → matriz por camada → obrigatórios/recomendados/opcionais → o que não vale → BDD → quality gate |
| [suite-review](prompts/suite-review.md) | Revisar uma suíte que já existe: rodar, dar veredicto por teste (manter / consertar / mover / apagar), provar que os testes críticos conseguem falhar e apontar risco sem cobertura |

### Exemplo resolvido — [examples/](examples/)

**[test-strategy-share-link](examples/test-strategy-share-link.md)** — uma estratégia completa para uma feature fictícia, do risco ao quality gate, incluindo os testes descartados e uma resposta curta a uma pergunta pontual. Serve para calibrar o que esperar da IA.

### Laboratório e medição — [lab/](lab/README.md) · [eval/](eval/run-suite-review.ts)

Uma suíte ruim de propósito, com 11 testes defeituosos, 3 testes bons como isca e um [gabarito](lab/gabarito.json) em que cada veredicto é demonstrado: o CI planta 8 bugs no código e confere quais testes caem. Sobre ela, `deno task eval` mede se uma IA com o prompt de revisão de suíte separa o que vale do que não vale — com `--baseline` para comparar contra a mesma IA sem o playbook. Detalhes e limites em [lab/README.md](lab/README.md).

### Regras para agentes

**[AGENTS.md](AGENTS.md)** — duas partes. **A:** resumo operacional para a IA atuar como **QA Architect e SDET defensivo** num projeto (a fonte da verdade continua sendo o TESTING.md). **B:** como alterar este repositório — comandos e regras da casa.

Cada módulo segue a mesma intenção: **decidir se testar, onde testar, como provar e quando descartar**. O objetivo não é aumentar contagem. É aumentar confiança.

---

## 🚀 Como usar — passo a passo

O guia segue a vida de uma aplicação: **instalar → entender os riscos → arrumar a suíte que existe → testar cada feature nova → proteger o PR → liberar → manter**. Cada etapa diz o que pedir à IA, o que esperar de volta e qual módulo do playbook está por trás. Quem trabalha sem IA segue as mesmas etapas lendo o módulo indicado.

Exemplo usado do começo ao fim: a **Agenda**, uma aplicação fictícia de marcação de consultas, com a feature *cancelar consulta com reembolso* (reembolso integral até 24h antes; depois disso, sem reembolso; só o paciente dono da consulta ou a clínica cancelam).

| Etapa | Quando | Módulo principal |
|---|---|---|
| [0. Instalar](#etapa-0--instalar-uma-vez-por-máquina) | Uma vez por máquina | este README |
| [1. Mapa de riscos](#etapa-1--mapa-de-riscos-da-aplicação-uma-vez-por-aplicação) | Uma vez por aplicação | [test-value-and-risk](strategy/test-value-and-risk.md) + [TESTING-STATUS](templates/TESTING-STATUS.md) |
| [2. Revisar a suíte existente](#etapa-2--revisar-a-suíte-que-já-existe) | Se já há testes | [suite-review](prompts/suite-review.md) |
| [3. Estratégia da feature](#etapa-3--estratégia-de-teste-antes-de-codar-a-feature) | A cada feature | [test-strategy](prompts/test-strategy.md) |
| [4. Escrever os testes](#etapa-4--escrever-os-testes-camada-por-camada) | A cada feature | [playbooks/](playbooks/) |
| [5. Bug vira teste](#etapa-5--bug-corrigido-vira-teste-de-regressão) | A cada correção | [TESTING.md](TESTING.md), inegociável 12 |
| [6. Gate do PR](#etapa-6--quality-gate-antes-de-abrir-o-pr) | A cada PR | [quality-gates](strategy/quality-gates.md) |
| [7. Sign-off](#etapa-7--sign-off-de-release) | A cada release | [quality-gates](strategy/quality-gates.md) |
| [8. Manter](#etapa-8--manter-a-suíte-honesta) | A cada trimestre | [suite-review](prompts/suite-review.md) |

### Etapa 0 — Instalar (uma vez por máquina)

**0.1 — Clone os dois playbooks lado a lado**, num caminho fixo:

```bash
cd ~/Developer   # ou a pasta onde ficam seus projetos
git clone https://github.com/silasmarques/security-playbook.git
git clone https://github.com/silasmarques/testing-playbook.git
```

As referências cruzadas usam caminhos relativos (`../security-playbook/...`), por isso os dois ficam como pastas irmãs.

**0.2 — Cole o bloco abaixo no arquivo de regras da sua IA**, trocando `<caminho-do-clone>`:

- Claude Code → `~/.claude/CLAUDE.md` (vale para todos os projetos) ou `CLAUDE.md` do projeto
- Cursor → `.cursor/rules/testing-playbook.mdc` (com frontmatter `alwaysApply: true`) ou `AGENTS.md` na raiz do projeto
- Copilot → `.github/copilot-instructions.md`

```markdown
## Testing Playbook (obrigatório)

Norte de testes: `<caminho-do-clone>/testing-playbook/TESTING.md`.

**Quando consultar (sem o usuário pedir):** ao planejar, revisar ou escrever testes;
ao tocar regra de negócio, permissão, contrato de API, integração, fluxo crítico,
regressão de bug real, performance ou qualquer alteração que precise de confiança
antes de deploy.

**Como:** ler o TESTING.md (inegociáveis + roteamento) e os módulos indicados para a
tarefa. Todo teste proposto deve nomear o bug concreto que pegaria, a regra que
protege, a camada mais barata que prova o risco e o custo de manutenção. Listar
também os testes que NÃO valem. Teste novo foi visto falhar e exercita o artefato
real, não uma cópia da regra. Segurança de teste → security-playbook.

**Sempre que o usuário pedir** ("monta a estratégia de teste", "vale testar isso?",
"revise a suíte", "crie testes"), a consulta é integral: TESTING.md + módulos
relevantes + quality gate aplicável. Pergunta pontual recebe resposta curta.
```

> **Agente que roda fora da sua máquina** (agente em nuvem, CI) não enxerga um caminho local. Nesse caso o playbook precisa estar **dentro do repositório do projeto** — como submódulo git ou cópia — e o bloco aponta para esse caminho relativo. A licença permite o uso interno.

**0.3 — Confirme que pegou.** Abra uma sessão **nova** dentro de um projeto e peça, sem dizer "faça muitos testes":

```text
Monte a estratégia de teste da feature de login.
```

Pegou se a resposta tem riscos, testes classificados (obrigatório / recomendado / opcional) e uma seção de **testes que não valem**, com o motivo. Compare com o [exemplo resolvido](examples/test-strategy-share-link.md). Se vier uma lista longa de testes sem priorização, o bloco não foi lido: confira o caminho e se a sessão é nova.

### Etapa 1 — Mapa de riscos da aplicação (uma vez por aplicação)

Antes de qualquer teste, saiba o que não pode quebrar. Tudo o que vem depois é priorizado por esta lista.

```text
Usando o testing-playbook (strategy/test-value-and-risk.md), leia o código deste
projeto e monte o mapa de riscos: os fluxos e regras em que um bug custa dinheiro,
vaza dado, quebra permissão ou derruba receita. Para cada um: o bug concreto, o
impacto, a probabilidade (complexidade, integrações, histórico) e o quadrante.
Não proponha testes ainda. Diga o que você leu e o que NÃO leu.
```

Para a Agenda, o resultado esperado é uma tabela curta como esta:

| Risco (bug concreto) | Impacto | Probabilidade | Decisão |
|---|---|---|---|
| Paciente cancela a consulta de outro paciente | Alto | Alta | Automatizar; segurança → security-playbook |
| Reembolso integral liberado com menos de 24h | Alto (dinheiro) | Alta (borda de tempo, fuso) | Automatizar |
| Reembolso emitido duas vezes no reenvio | Alto (dinheiro) | Média | Automatizar |
| Lembrete por e-mail com horário errado | Médio | Média | Automatizar em uma camada leve |
| Cor do botão "Cancelar" fora do padrão | Baixo | Baixa | Não automatizar |

Guarde o mapa no projeto: copie [templates/TESTING-STATUS.md](templates/TESTING-STATUS.md) para a raiz como `TESTING-STATUS.md` e preencha a tabela **Mapa de riscos**. As colunas "Teste que prova" e "Visto falhar em" começam vazias — é normal, e é o que as etapas 2 a 4 vão preencher. Esse arquivo é a entrada das próximas etapas e a IA passa a lê-lo antes de propor testes.

### Etapa 2 — Revisar a suíte que já existe

Pule se o projeto ainda não tem testes. Se tem, faça isto **antes** de escrever testes novos: uma suíte verde e inflada esconde exatamente os riscos da Etapa 1.

Copie o bloco de [prompts/suite-review.md](prompts/suite-review.md) e preencha as duas lacunas:

```text
Escopo da revisão: a suíte inteira
Contexto: Agenda — marcação de consultas; Node + Postgres; crítico: quem pode
cancelar, regra de reembolso de 24h, cobrança e estorno.
```

O que volta, e o que fazer com cada parte:

| Parte da resposta | O que você faz |
|---|---|
| Como a suíte foi executada e o que não foi analisado | Confere se rodou de verdade (comando, total, tempo) |
| Tabela de veredictos: MANTER / CONSERTAR / MOVER / APAGAR | Aprova a lista antes de qualquer alteração |
| Achados com arquivo:linha, confirmado ou suspeito | Lê os "suspeitos": pedem verificação sua |
| Prova de falha: o que foi quebrado e que teste percebeu | A parte mais valiosa — teste crítico que ficou verde com a regra quebrada é achado grave |
| Lacunas: risco crítico sem teste | Vira entrada da Etapa 3 |

Depois de aprovar: apague primeiro (é o ganho mais barato), conserte os que protegem risco alto, e só então escreva o que falta. Registre a revisão no `TESTING-STATUS.md`: data, veredictos, o que ficou pendente e cada lacuna na linha do risco correspondente.

Um exemplo do defeito mais comum que essa revisão encontra — teste negativo sem controle positivo:

```text
ANTES — passa com qualquer implementação, porque não existe consulta nenhuma:
  teste "paciente não vê consulta de outro":
    esperar listar_consultas(paciente=bruno) está vazio

DEPOIS — só passa se o filtro de dono funcionar:
  teste "paciente não vê consulta de outro":
    consulta_da_ana = criar_consulta(paciente=ana)
    esperar listar_consultas(paciente=ana) contém consulta_da_ana     # controle positivo
    esperar listar_consultas(paciente=bruno) NÃO contém consulta_da_ana
```

Para ver esse e outros nove defeitos em código que roda, com a prova de quais bugs cada teste deixa passar, abra o [laboratório](lab/README.md).

### Etapa 3 — Estratégia de teste antes de codar a feature

A cada feature nova, peça a estratégia **antes** do código. Copie o bloco de [prompts/test-strategy.md](prompts/test-strategy.md) e preencha o contexto:

```text
Contexto:
- Produto: Agenda (marcação de consultas)
- Stack: Node + Postgres + React
- Feature analisada: cancelar consulta com reembolso. POST /appointments/:id/cancel.
  Reembolso integral até 24h antes do horário; depois, sem reembolso. Só o paciente
  dono ou um usuário da clínica cancelam. O estorno é pedido a um provedor de
  pagamento externo.
```

A resposta tem onze seções; as três que decidem a qualidade são:

- **Testes obrigatórios**, cada um com o bug que pega, a camada e como vê-lo falhar. Para a Agenda, algo como:

  | Teste | Bug que pega | Camada |
  |---|---|---|
  | Regra de reembolso em tabela de casos: 24h01 antes → integral; 24h00 → integral; 23h59 → zero; consulta já passada → recusa | Reembolso indevido na borda de tempo | Unitário, relógio injetado |
  | Bruno cancela a consulta da Ana → 404; Ana cancela a própria → 200 | Cancelamento de consulta alheia | API |
  | Reenviar o mesmo cancelamento não gera segundo estorno | Estorno em dobro | Integração, banco real |
  | Provedor de pagamento responde 5xx → consulta fica "cancelamento pendente", sem erro interno exposto | Consulta cancelada sem estorno, ou stack trace na resposta | Integração, provedor dublado |

- **Testes que não valem**, com o motivo — por exemplo, "E2E para cada combinação de horário" (a regra já está no unitário) e "teste de que o botão Cancelar existe" (nenhum bug plantável).
- **Quality gate do PR**, que você vai usar na Etapa 6.

Se a lista de obrigatórios passar de meia dúzia para uma feature deste tamanho, desconfie e pergunte: *"qual bug cada um pega que os outros não pegam?"*.

### Etapa 4 — Escrever os testes, camada por camada

Com a estratégia aprovada, peça a implementação de um grupo por vez. A IA abre o playbook da camada; você também pode abrir.

| Você vai testar | Peça assim | Playbook |
|---|---|---|
| Regra pura (o cálculo do reembolso) | "Escreva o unitário em tabela de casos da regra de reembolso, com relógio injetado" | [integration-testing](playbooks/integration-testing.md) P4 |
| Código + banco (idempotência do estorno) | "Escreva o teste de integração do reenvio de cancelamento contra o Postgres real" | [integration-testing](playbooks/integration-testing.md) |
| Endpoint (401, 403/404, ownership, erro) | "Que testes valem para POST /appointments/:id/cancel?" | [api-testing](playbooks/api-testing.md) |
| O que o frontend consome do backend | "Monte o contrato de GET /appointments/:id, com a lista do que nunca pode vir" | [contract-testing](playbooks/contract-testing.md) |
| A jornada do paciente | "Vale um E2E do cancelamento? Se sim, um só" | [e2e-testing](playbooks/e2e-testing.md) |
| Dúvida sobre camada | "Em que camada fica o teste de fuso horário do reembolso?" | [test-layers](strategy/test-layers.md) |
| "Mocko o provedor de pagamento? E o banco?" | Pergunte exatamente assim | [integration-testing](playbooks/integration-testing.md) P1 |
| Carga num endpoint caro ou crítico | "Como testar performance da busca de horários?" — a resposta exige um SLO seu | [performance-testing](playbooks/performance-testing.md) |
| RLS, injeção, abuso de auth, prompt injection | Não é aqui | [security-playbook](https://github.com/silasmarques/security-playbook) |

**O ritual que não se pula: ver o teste falhar** (inegociável 13). Para cada teste obrigatório, depois de verde:

```text
1. Quebre a regra de produção de propósito.
   Agenda: troque "horas_ate_consulta >= 24" por "> 24" na regra de reembolso.
2. Rode o teste. Ele TEM de ficar vermelho, e pelo motivo certo.
3. Desfaça a quebra. Rode de novo: verde.
```

Ficou verde com a regra quebrada? O teste não protege nada — conserte-o antes de seguir. Peça à IA: *"quebre a regra, rode e me mostre a saída do teste falhando"*. "Deve falhar" não vale.

### Etapa 5 — Bug corrigido vira teste de regressão

Quando um bug real aparece em fluxo importante, a ordem é: **teste primeiro, correção depois**.

```text
Bug: paciente em fuso diferente do da clínica recebeu reembolso integral cancelando
3h antes. Antes de corrigir: escreva o teste que reproduz o bug e me mostre ele
falhando. Depois corrija e mostre o teste passando.
```

O teste que nasce vermelho com o bug presente é a prova de que ele impede a volta. Teste escrito depois da correção, que nunca foi visto falhar, é palpite.

### Etapa 6 — Quality gate antes de abrir o PR

```text
Monta o quality gate deste PR.
```

A IA lê o diff e ativa só os itens de [quality-gates](strategy/quality-gates.md) P1 que ele aciona. Para o PR do cancelamento, o gate esperado:

```text
SEMPRE
[x] Todo teste novo tem bug nomeado e asserção forte.
[x] Todo teste novo foi visto falhar (regra de 24h quebrada → unitário vermelho).
[x] Nenhum teste removido ou afrouxado sem justificativa.
REGRA DE NEGÓCIO
[x] Regra de reembolso coberta no unitário, com as bordas.
PERSISTÊNCIA
[x] Idempotência do estorno testada contra o Postgres real.
API
[x] 401 sem sessão; ownership A×B com controle positivo; erro sem vazar internals.
INTEGRAÇÃO EXTERNA
[x] Provedor de pagamento com timeout e 5xx.
FLUXO CRÍTICO
[ ] 1 E2E da jornada de cancelamento.   ← pendente: bloqueia o PR
```

Item pendente bloqueia, ou vira **risco aceito por escrito** na tabela "Riscos aceitos" do `TESTING-STATUS.md` — quem aceitou, por quê e quando revisar. Não existe "depois eu adiciono".

### Etapa 7 — Sign-off de release

Antes de liberar uma versão, peça o sign-off no formato de [quality-gates](strategy/quality-gates.md) P2:

```text
Monte o QA sign-off da versão 2.4 com base nos PRs desde a 2.3: escopo testado,
camadas exercitadas, resultado, riscos aceitos (com dono) e evidência. Não afirme
que algo foi testado sem o link da execução.
```

O valor do documento está em duas linhas: **riscos aceitos conscientemente** e **evidência**. "Testado, está ok" não é sign-off.

### Etapa 8 — Manter a suíte honesta

- **A cada trimestre, ou quando a suíte ficar lenta ou instável:** repita a Etapa 2 no trecho que mais mudou.
- **Teste instável:** não é reexecutado até passar. Ou é consertado na causa (espera fixa, ordem, relógio — [test-layers](strategy/test-layers.md) P3), ou é apagado. Enquanto isso, fica listado no `TESTING-STATUS.md`.
- **`TESTING-STATUS.md`:** atualizado a cada revisão e a cada risco aceito. Linha do mapa com "Visto falhar em" vazio é teste que ainda não provou nada.
- **Mapa de riscos (Etapa 1):** revise quando entrar integração nova, meio de pagamento novo ou mudança de modelo de permissão.
- **Playbook:** `git pull` nos dois clones; o [CHANGELOG](CHANGELOG.md) diz o que mudou na norma.

### Estou usando 100%?

Cada parte do playbook tem um momento em que entra. Se alguma linha nunca foi usada na sua aplicação, é uma etapa que está sendo pulada.

| Parte | Entra em | Sinal de que está em uso |
|---|---|---|
| [TESTING.md](TESTING.md) | Toda etapa | A IA cita inegociável ou módulo ao responder |
| [test-value-and-risk](strategy/test-value-and-risk.md) | Etapas 1, 2, 3 | Existe mapa de riscos; toda resposta lista o que NÃO vale |
| [test-layers](strategy/test-layers.md) | Etapas 3, 4 | Nenhuma regra de negócio testada só em E2E |
| [quality-gates](strategy/quality-gates.md) | Etapas 6, 7 | PR com gate; release com riscos aceitos assinados |
| [integration-testing](playbooks/integration-testing.md) | Etapa 4 | Testes de dado rodam no mesmo motor de produção |
| [api-testing](playbooks/api-testing.md) | Etapa 4 | Todo recurso com dono tem teste A×B com controle positivo |
| [contract-testing](playbooks/contract-testing.md) | Etapa 4 | Fronteira front↔back tem contrato com lista negativa |
| [e2e-testing](playbooks/e2e-testing.md) | Etapa 4 | Poucos E2E, um por jornada, zero espera fixa |
| [performance-testing](playbooks/performance-testing.md) | Etapa 4 | Endpoint caro tem threshold ligado a um SLO |
| [test-strategy](prompts/test-strategy.md) | Etapa 3 | Estratégia existe antes do código da feature |
| [suite-review](prompts/suite-review.md) | Etapas 2, 8 | A suíte já teve testes apagados por veredicto |
| [TESTING-STATUS](templates/TESTING-STATUS.md) | Etapas 1, 2, 6, 8 | O arquivo existe na raiz do projeto e não está parado há meses |
| [exemplo resolvido](examples/test-strategy-share-link.md) | Etapas 0, 3 | Você compara a resposta da IA com ele |
| [laboratório](lab/README.md) | Etapa 2 | Você reconhece na sua suíte os defeitos de lá |
| [security-playbook](https://github.com/silasmarques/security-playbook) | Etapas 1, 4 | Risco de segurança é roteado para lá |

### Atalhos do dia a dia

| Você diz | A IA faz |
|---|---|
| "Que testes valem para este endpoint?" | Matriz por camada + autorização/ownership A×B + erros que não podem vazar ([api-testing](playbooks/api-testing.md)) |
| "Mocko o banco nesse teste?" | Decide o que é real e o que é dublê pelo risco nomeado ([integration-testing](playbooks/integration-testing.md)) |
| "Vale um E2E aqui?" | Só recomenda se for jornada crítica; senão aponta a camada mais barata ([test-layers](strategy/test-layers.md)) |
| "Monta o quality gate deste PR" | Gate ativado pelo diff e evidências esperadas ([quality-gates](strategy/quality-gates.md)) |
| "Revise essa suíte" | Roda a suíte, dá veredicto por teste, prova que os críticos conseguem falhar e lista risco sem cobertura ([suite-review](prompts/suite-review.md)) |
| "Como testar performance desse fluxo?" | Define cenário, carga, threshold/SLO e critério de falha ([performance-testing](playbooks/performance-testing.md)) |

### Sem IA (uso humano)

As etapas são as mesmas; em vez de pedir, você lê o módulo indicado e responde às perguntas dele. O atalho mínimo:

1. **Antes de escrever um teste**, responda o gate de uma frase do [TESTING.md](TESTING.md): que bug real, importante e plausível este teste pegaria?
2. **Não sabe se vale?** [test-value-and-risk](strategy/test-value-and-risk.md). **Não sabe a camada?** [test-layers](strategy/test-layers.md).
3. **Depois de escrever**, quebre a regra e veja o teste falhar.
4. **Vai abrir PR?** Marque o gate de [quality-gates](strategy/quality-gates.md) P1 à mão.
5. **Herdou uma suíte?** O método de [suite-review](prompts/suite-review.md) serve para humano também.
6. **O risco é segurança?** Pare aqui e siga o [security-playbook](https://github.com/silasmarques/security-playbook).

### Playbook companheiro

Qualidade sem segurança é incompleta. Este playbook decide **o que testar, em que camada e com que evidência**. O [security-playbook](https://github.com/silasmarques/security-playbook) define **como desenvolver, revisar e testar superfícies de segurança**: RLS, auth, autorização, input hostil, secrets, prompt injection, abuso de agentes e afins.

Para cobertura completa, adote os dois — clonados lado a lado. O testing-playbook referencia o security-playbook para segurança de teste em vez de duplicar regras, porque duas fontes da verdade viram divergência.

---

## 🧭 Princípios de design

1. **Confiança sobre cobertura** — cobertura é sintoma; confiança no comportamento crítico é a meta.
2. **Risco decide tudo** — probabilidade × impacto, regra protegida e falha plausível vêm antes da facilidade de escrever o teste.
3. **Teste onde o risco vive** — Testing Trophy como ferramenta, não dogma de pirâmide.
4. **Uma camada por risco** — duplicar o mesmo cenário em unitário + API + E2E exige justificativa explícita.
5. **O que não vale é parte da entrega** — descartar teste ruim é trabalho de QA, não preguiça.
6. **Teste que nunca falhou não prova nada** — todo teste é visto falhar e exercita o artefato real; este repositório aplica isso à própria verificação.
7. **Segurança não é reimplementada aqui** — segurança de teste segue o [security-playbook](https://github.com/silasmarques/security-playbook).

## 🔧 Manutenção e garantias

- Cada módulo de [strategy/](strategy/) e [playbooks/](playbooks/) tem `last-review` no frontmatter; afirmações não triviais citam fontes oficiais quando aplicável.
- **Cadência de revisão:** playbooks a cada trimestre (ferramentas e práticas mudam); estratégia ao menos 1×/ano ou quando surgir mudança relevante no modelo de qualidade adotado.
- **A norma é verificada como código:** todo push roda [o CI](.github/workflows/ci.yml) — links (arquivos e pastas), frontmatter, toda referência a regra (`[viola R3]`, `(R1, R7)`), contagens anunciadas, roteamento sem módulo órfão, limites de tamanho — e secret scan via gitleaks.
- **A verificação é verificada:** [verify-docs.test.ts](scripts/verify-docs.test.ts) quebra cada uma dessas garantias de propósito e exige que o CI acuse. Localmente: `deno task ci`.
- **A cadência é cobrada:** um workflow semanal falha quando um módulo passa do prazo de revisão.
- **O gabarito do laboratório é provado:** [prova.test.ts](lab/prova.test.ts) planta cada bug na cobaia e exige que caiam exatamente os testes previstos; o pontuador da medição tem de reprovar uma revisão complacente e uma destrutiva ([score.test.ts](eval/score.test.ts)).
- **O que o CI NÃO prova:** que as regras estão certas, que as fontes citadas ainda dizem o que dizíamos, nem que uma IA com o playbook revisa ou propõe testes melhores. As duas primeiras dependem da revisão humana. Para a terceira existe a medição (`deno task eval`), que roda fora do CI e cujos resultados **não são publicados aqui**: valem para um modelo, num dia. Rode no seu contexto.
- Histórico de mudanças da norma: [CHANGELOG.md](CHANGELOG.md).
- Este é um playbook **opinativo e curado**: encontrou um erro? Abra uma issue com o risco concreto, a regra afetada e a evidência.

## 📄 Licença

[CC BY-ND 4.0](LICENSE.md) — use e compartilhe com atribuição; não redistribua versões modificadas. **Exceção:** os exemplos e templates (Gherkin, pseudocódigo, snippets) são MIT — copie e adapte livremente. Detalhes em [LICENSE.md](LICENSE.md).

## Fontes

[Testing Trophy — Kent C. Dodds](https://kentcdodds.com/blog/write-tests) · [Practical Test Pyramid — Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html) · [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/) · [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) · [Consumer-Driven Contracts — Fowler](https://martinfowler.com/articles/consumerDrivenContracts.html) · [IntegrationTest](https://martinfowler.com/bliki/IntegrationTest.html), [TestDouble](https://martinfowler.com/bliki/TestDouble.html) e [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) — Fowler

---

*Criado por [Silas Marques](https://github.com/silasmarques), 2026. Companheiro do [security-playbook](https://github.com/silasmarques/security-playbook).*
