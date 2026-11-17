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

### Regras para agentes

### Exemplo resolvido — [examples/](examples/)

**[test-strategy-share-link](examples/test-strategy-share-link.md)** — uma estratégia completa para uma feature fictícia, do risco ao quality gate, incluindo os testes descartados e uma resposta curta a uma pergunta pontual. Serve para calibrar o que esperar da IA.

### Laboratório e medição — [lab/](lab/README.md) · [eval/](eval/run-suite-review.ts)

Uma suíte ruim de propósito, com 11 testes defeituosos, 3 testes bons como isca e um [gabarito](lab/gabarito.json) em que cada veredicto é demonstrado: o CI planta 8 bugs no código e confere quais testes caem. Sobre ela, `deno task eval` mede se uma IA com o prompt de revisão de suíte separa o que vale do que não vale — com `--baseline` para comparar contra a mesma IA sem o playbook. Detalhes e limites em [lab/README.md](lab/README.md).

**[AGENTS.md](AGENTS.md)** — duas partes. **A:** resumo operacional para a IA atuar como **QA Architect e SDET defensivo** num projeto (a fonte da verdade continua sendo o TESTING.md). **B:** como alterar este repositório — comandos e regras da casa.

Cada módulo segue a mesma intenção: **decidir se testar, onde testar, como provar e quando descartar**. O objetivo não é aumentar contagem. É aumentar confiança.

---

## 🚀 Como usar — passo a passo

### Setup com IA de codificação (5 minutos)

**Passo 1 — Clone os playbooks** em um caminho fixo da sua máquina. Para adoção completa, clone os dois lado a lado:

```bash
git clone https://github.com/silasmarques/security-playbook.git
git clone https://github.com/silasmarques/testing-playbook.git
```

As referências cruzadas usam caminhos relativos (`../security-playbook/...`), assumindo os dois repositórios como irmãos, por exemplo em `~/Developer/`.

**Passo 2 — Cole este bloco no arquivo de regras da sua IA**, ajustando o caminho do clone:

- Claude Code → `~/.claude/CLAUDE.md` (global) ou `CLAUDE.md` do projeto
- Cursor → `.cursor/rules/testing-playbook.mdc` (com frontmatter `alwaysApply: true`) ou `AGENTS.md` na raiz do projeto
- Copilot → `.github/copilot-instructions.md`

> **Agente que roda fora da sua máquina** (agente em nuvem, CI) não enxerga um caminho local. Nesse caso o playbook precisa estar **dentro do repositório do projeto** — como submódulo git ou cópia — e o bloco aponta para esse caminho relativo. A licença permite o uso interno.

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
também os testes que NÃO valem. Teste novo foi visto falhar e exercita o artefato real, não uma cópia da
regra. Segurança de teste → security-playbook.

**Sempre que o usuário pedir** ("monta a estratégia de teste", "vale testar isso?",
"revise a suíte", "crie testes"), a consulta é integral: TESTING.md + módulos
relevantes + quality gate aplicável. Pergunta pontual recebe resposta curta.
```

**Passo 3 — Teste a adoção.** Numa sessão nova, peça *sem dizer "faça muitos testes"*:

```text
Monte a estratégia de teste da feature de login.
```

A IA deve devolver riscos, matriz por camada, obrigatórios/recomendados/opcionais, **testes que não valem** com justificativa, cenários BDD, dados necessários e quality gate. Compare com o [exemplo resolvido](examples/test-strategy-share-link.md). Se ela só despejar uma lista longa de testes sem priorizar por risco, confira o caminho do Passo 2.

**Passo 4 — Use no dia a dia.** Exemplos de pedidos e o que esperar:

| Você diz | A IA faz |
|---|---|
| "Que testes valem para este endpoint?" | Matriz por camada + autorização/ownership A×B + erros que não podem vazar ([api-testing](playbooks/api-testing.md)) |
| "Mocko o banco nesse teste?" | Decide o que é real e o que é dublê pelo risco nomeado ([integration-testing](playbooks/integration-testing.md)) |
| "Vale um E2E aqui?" | Só recomenda se for jornada crítica; senão aponta a camada mais barata ([test-layers](strategy/test-layers.md)) |
| "Monta o quality gate deste PR" | Gate ativado pelo diff e evidências esperadas ([quality-gates](strategy/quality-gates.md)) |
| "Revise essa suíte" | Roda a suíte, dá veredicto por teste, prova que os críticos conseguem falhar e lista risco sem cobertura ([suite-review](prompts/suite-review.md)) |
| "Como testar performance desse fluxo?" | Define cenário, carga, threshold/SLO e critério de falha ([performance-testing](playbooks/performance-testing.md)) |

### Sem IA (uso humano)

1. **Vai testar uma feature?** Comece por [TESTING.md](TESTING.md) e responda o gate em uma frase: que bug real, importante e plausível este teste pegaria?
2. **Não sabe se o teste vale?** Use [test-value-and-risk.md](strategy/test-value-and-risk.md) antes de escrever automação.
3. **Não sabe a camada?** Use [test-layers.md](strategy/test-layers.md) e escolha a camada mais barata que prova o risco.
4. **Vai abrir PR?** Monte o gate com [quality-gates.md](strategy/quality-gates.md).
5. **Herdou uma suíte?** Siga o método de [suite-review.md](prompts/suite-review.md) — ele serve para humano também.
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
- **O que o CI NÃO prova:** que as regras estão certas, que as fontes citadas ainda dizem o que dizíamos, nem que uma IA com o playbook revisa ou propõe testes melhores. As duas primeiras dependem da revisão humana. Para a terceira existe a medição (`deno task eval`), mas ela roda fora do CI e **ainda não tem resultado publicado**.
- Histórico de mudanças da norma: [CHANGELOG.md](CHANGELOG.md).
- Este é um playbook **opinativo e curado**: encontrou um erro? Abra uma issue com o risco concreto, a regra afetada e a evidência.

## 📄 Licença

[CC BY-ND 4.0](LICENSE.md) — use e compartilhe com atribuição; não redistribua versões modificadas. **Exceção:** os exemplos e templates (Gherkin, pseudocódigo, snippets) são MIT — copie e adapte livremente. Detalhes em [LICENSE.md](LICENSE.md).

## Fontes

[Testing Trophy — Kent C. Dodds](https://kentcdodds.com/blog/write-tests) · [Practical Test Pyramid — Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html) · [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/) · [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) · [Consumer-Driven Contracts — Fowler](https://martinfowler.com/articles/consumerDrivenContracts.html) · [IntegrationTest](https://martinfowler.com/bliki/IntegrationTest.html), [TestDouble](https://martinfowler.com/bliki/TestDouble.html) e [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) — Fowler

---

*Criado por [Silas Marques](https://github.com/silasmarques), 2026. Companheiro do [security-playbook](https://github.com/silasmarques/security-playbook).*
