# 🧪 Testing Playbook

**Um norte normativo de testes inteligentes para desenvolvimento de software — feito para ser consumido por humanos e por IAs de codificação (Claude Code, Cursor, Copilot e afins).**

> **Missão:** transformar esforço de teste em confiança mensurável para evoluir produto sem quebrar o que importa.
> **Princípio:** não buscamos quantidade de testes — buscamos prova de que o sistema sustenta seus riscos críticos.

Serve aos dois momentos da vida de uma suíte:

- **Planejando:** a IA (ou você) decide quais testes realmente valem antes de escrever uma linha.
- **Mantendo:** revise uma suíte existente e corte teste de vaidade, duplicação de risco e automação frágil que só consome manutenção.

Não é uma coletânea de boas práticas nem um gerador de cobertura inflada: é **norma operacional**. Regras objetivas (MUST/NEVER), motor de decisão por risco, roteamento por camada, playbooks práticos e quality gates verificáveis. Companheiro do [security-playbook](https://github.com/silasmarques/security-playbook): segurança de teste (RLS, prompt injection, abuso de auth, vazamento de secret) mora lá e é **referenciada, não duplicada**.

**Em números:** 12 regras inegociáveis · 3 módulos [strategy/](strategy/) · 4 [playbooks/](playbooks/) · 1 [prompt](prompts/test-strategy.md) · [AGENTS.md](AGENTS.md) para orientar IAs · [CI](.github/workflows/ci.yml) que verifica a norma · integração explícita com o `security-playbook`.

**Neste README:** [O que tem dentro](#-o-que-tem-dentro) · [Como usar](#-como-usar--passo-a-passo) · [Princípios de design](#-princípios-de-design) · [Manutenção e garantias](#-manutenção-e-garantias) · [Playbook companheiro](#playbook-companheiro) · [Licença](#-licença)

---

## 📦 O que tem dentro

```text
testing-playbook/
├── TESTING.md           ← porta de entrada: 12 inegociáveis + roteamento + instruções p/ IA
├── strategy/            ← decisão por risco, camadas e gates de qualidade
├── playbooks/           ← API, contrato, E2E e performance
├── prompts/             ← prompt pronto para estratégia de teste por feature
├── scripts/             ← verificação determinística da norma
├── docs/specs/          ← decisões e especificação de design do playbook
├── AGENTS.md            ← regras para agentes atuarem como QA Architect/SDET defensivo
└── .github/workflows/   ← CI: verify-docs + gitleaks
```

### A porta de entrada

**[TESTING.md](TESTING.md)** — 12 regras inegociáveis + tabela de roteamento ("vou testar X → leio Y") + gate de risco em uma frase + instruções de como uma IA deve decidir, propor e reportar testes. É o único arquivo que precisa estar sempre à mão; o resto é consultado sob demanda.

### 3 módulos de estratégia — [strategy/](strategy/)

- **[test-value-and-risk](strategy/test-value-and-risk.md)** — o motor que impede a suíte de virar teatro. Define risco como **probabilidade × impacto**, rejeita score numérico aditivo por falsa precisão e aplica um gate binário: se o teste não nomeia bug real, regra protegida e falha plausível, ele é candidato a não existir.

- **[test-layers](strategy/test-layers.md)** — decide onde o teste vive. Usa a **Testing Trophy** como bússola prática: teste onde o risco se manifesta, na camada mais barata que prova o comportamento. Unitário para regra pura, integração para partes conversando, API/contrato para fronteiras, E2E para jornada crítica.

- **[quality-gates](strategy/quality-gates.md)** — transforma risco do diff em gate de PR. Ativa critérios conforme o que mudou (regra de negócio, permissão, API, integração, UI crítica, performance) e fecha com release sign-off baseado em evidência e risco aceito.

### 4 playbooks de camada — [playbooks/](playbooks/)

- **[api-testing](playbooks/api-testing.md)** — a API testada antes da UI. Happy path, caminho triste, boundary, contrato, autorização, ownership A×B, idempotência, paginação e erro sem vazar internals.

- **[contract-testing](playbooks/contract-testing.md)** — a fronteira consumidor ↔ provedor. Contratos consumer-driven, schema positivo e negativo, compatibilidade entre versões e a ferramenta mais leve que prova o risco.

- **[e2e-testing](playbooks/e2e-testing.md)** — jornada crítica, não detalhe interno. Cobre fluxo de usuário com valor real, estado autossuficiente, seletor estável, espera por condição e evidência útil quando falha.

- **[performance-testing](playbooks/performance-testing.md)** — carga com objetivo. Sem threshold não é teste: cada cenário precisa de SLO, p95/p99, taxa de erro, volume e critério claro de aprovação/falha.

### 1 prompt pronto — [prompts/](prompts/)

| Prompt | Quando usar |
|---|---|
| [test-strategy](prompts/test-strategy.md) | Planejar testes de uma feature: riscos → matriz por camada → obrigatórios/recomendados/opcionais → o que não vale → BDD → quality gate |

### Regras para agentes

**[AGENTS.md](AGENTS.md)** — instruções para a IA atuar como **QA Architect e SDET defensivo**: priorizar confiança real, classificar cada teste por risco, escolher a camada mais barata que prova o comportamento e listar explicitamente os testes que **não** valem.

Cada módulo segue a mesma intenção: **decidir se testar, onde testar, como provar e quando descartar**. O objetivo não é aumentar contagem. É aumentar confiança.

---

## 🚀 Como usar — passo a passo

### Setup com IA de codificação (5 minutos)

**Passo 1 — Clone os playbooks** em um caminho fixo da sua máquina. Para adoção completa, clone os dois lado a lado:

```bash
git clone https://github.com/silasmarques/security-playbook.git
git clone https://github.com/silasmarques/testing-playbook.git
```

As referências cruzadas usam caminhos relativos (`../security-playbook/...`), assumindo os dois repositórios como irmãos, por exemplo em `D:\Projetos\`.

**Passo 2 — Cole este bloco no arquivo de regras da sua IA**, ajustando o caminho do clone:

- Claude Code → `~/.claude/CLAUDE.md` (global) ou `CLAUDE.md` do projeto
- Cursor → `.cursorrules`
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
também os testes que NÃO valem. Segurança de teste → security-playbook.

**Sempre que o usuário pedir** ("monta a estratégia de teste", "vale testar isso?",
"revise a suíte", "crie testes"), a consulta é integral: TESTING.md + módulos
relevantes + quality gate aplicável.
```

**Passo 3 — Teste a adoção.** Numa sessão nova, peça *sem dizer "faça muitos testes"*:

```text
Monte a estratégia de teste da feature de login.
```

A IA deve devolver riscos, matriz por camada, obrigatórios/recomendados/opcionais, **testes que não valem** com justificativa, cenários BDD, dados necessários e quality gate. Se ela só despejar uma lista longa de testes sem priorizar por risco, confira o caminho do Passo 2.

**Passo 4 — Use no dia a dia.** Exemplos de pedidos e o que esperar:

| Você diz | A IA faz |
|---|---|
| "Que testes valem para este endpoint?" | Matriz por camada + autorização/ownership A×B + erros que não podem vazar ([api-testing](playbooks/api-testing.md)) |
| "Vale um E2E aqui?" | Só recomenda se for jornada crítica; senão aponta a camada mais barata ([test-layers](strategy/test-layers.md)) |
| "Monta o quality gate deste PR" | Gate ativado pelo diff e evidências esperadas ([quality-gates](strategy/quality-gates.md)) |
| "Revise essa suíte" | Identifica duplicações, testes frágeis, testes de vaidade e lacunas de risco ([test-value-and-risk](strategy/test-value-and-risk.md)) |
| "Como testar performance desse fluxo?" | Define cenário, carga, threshold/SLO e critério de falha ([performance-testing](playbooks/performance-testing.md)) |

### Sem IA (uso humano)

1. **Vai testar uma feature?** Comece por [TESTING.md](TESTING.md) e responda o gate em uma frase: que bug real, importante e plausível este teste pegaria?
2. **Não sabe se o teste vale?** Use [test-value-and-risk.md](strategy/test-value-and-risk.md) antes de escrever automação.
3. **Não sabe a camada?** Use [test-layers.md](strategy/test-layers.md) e escolha a camada mais barata que prova o risco.
4. **Vai abrir PR?** Monte o gate com [quality-gates.md](strategy/quality-gates.md).
5. **O risco é segurança?** Pare aqui e siga o [security-playbook](https://github.com/silasmarques/security-playbook).

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
6. **Segurança não é reimplementada aqui** — segurança de teste segue o [security-playbook](https://github.com/silasmarques/security-playbook).

## 🔧 Manutenção e garantias

- Cada módulo de [strategy/](strategy/) e [playbooks/](playbooks/) tem `last-review` no frontmatter; afirmações não triviais citam fontes oficiais quando aplicável.
- **Cadência de revisão:** playbooks a cada trimestre (ferramentas e práticas mudam); estratégia ao menos 1×/ano ou quando surgir mudança relevante no modelo de qualidade adotado.
- **A norma é verificada como código:** todo push roda [o CI](.github/workflows/ci.yml), incluindo integridade de links, limites de tamanho, frontmatter obrigatório e secret scan via gitleaks.
- Este é um playbook **opinativo e curado**: encontrou um erro? Abra uma issue com o risco concreto, a regra afetada e a evidência.

## 📄 Licença

[CC BY-ND 4.0](LICENSE.md) — use e compartilhe com atribuição; não redistribua versões modificadas. **Exceção:** os exemplos e templates (Gherkin, pseudocódigo, snippets) são MIT — copie e adapte livremente. Detalhes em [LICENSE.md](LICENSE.md).

## Fontes

[Testing Trophy — Kent C. Dodds](https://kentcdodds.com/blog/write-tests) · [Practical Test Pyramid — Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html) · [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/) · [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) · [Consumer-Driven Contracts — Fowler](https://martinfowler.com/articles/consumerDrivenContracts.html)

---

*Criado por [Silas Marques](https://github.com/silasmarques), 2026. Companheiro do [security-playbook](https://github.com/silasmarques/security-playbook).*
