# 🧪 Testing Playbook

**Um norte normativo de testes inteligentes — feito para humanos e para IAs de codificação (Claude Code, Cursor, Copilot e afins). Agnóstico de linguagem e stack.**

> **Missão:** transformar esforço de teste em confiança mensurável para evoluir o produto sem quebrar o que importa.
> **Princípio:** não buscamos quantidade de testes — buscamos prova de que o que importa funciona.

Não é uma coletânea de boas práticas nem um gerador de suíte inflada. É **norma operacional**: regras objetivas (MUST/NEVER), um motor de decisão por risco, playbooks por camada com exemplos copiáveis e um gate de qualidade verificável. Companheiro do [security-playbook](../security-playbook/) — a segurança de teste (RLS, prompt injection, abuso de auth) mora lá e é **referenciada, não duplicada**.

---

## A tese

> **Todo teste precisa provar algo importante sobre o sistema.** Se ele não reduz risco, não valida regra crítica, não protege contrato, não evita regressão real e não aumenta a confiança de deploy — ele provavelmente não merece existir.

Um teste **agrega** quando responde "sim" a pelo menos uma pergunta crítica: pegaria um bug real? protege dinheiro/dado/permissão/fluxo de receita? evita regressão importante? cobre integração que quebra? protege contra abuso? Se a resposta é "não" para todas — é candidato a descarte. O contraexemplo clássico de teste de vaidade: *"testar se o botão existe na tela"*. O de teste que agrega: *"usuário sem permissão não gera artefatos de um projeto que não é dele, mesmo chamando a API direto"*.

## 📦 O que tem dentro

### A porta de entrada

**[TESTING.md](TESTING.md)** — 12 inegociáveis do teste que vale + tabela de roteamento ("vou testar X → leio Y") + o gate de risco em uma frase + instruções de como uma IA deve decidir, propor e reportar. É o único arquivo que precisa estar sempre à mão.

### 3 módulos de estratégia — [strategy/](strategy/)

- **[test-value-and-risk](strategy/test-value-and-risk.md)** — o motor que impede a suíte de virar teatro. Matriz **risco = probabilidade × impacto** + gate binário de 8 perguntas. Por que o *score numérico aditivo é rejeitado* (falsa precisão + Lei de Goodhart) e o que usar no lugar.
- **[test-layers](strategy/test-layers.md)** — o que cada camada prova e quando usar, enquadrado pela **Testing Trophy** (teste onde o risco vive, não pirâmide dogmática). A regra prática: unitário cobre lógica, integração cobre as partes conversando, API cobre contrato, E2E cobre jornada.
- **[quality-gates](strategy/quality-gates.md)** — o quality gate de PR (itens ativados pelo que o diff toca) e o release sign-off com evidência e risco aceito assinado.

### 4 playbooks de camada — [playbooks/](playbooks/)

- **[api-testing](playbooks/api-testing.md)** — a API testada antes da UI. Happy/negative/boundary, contrato, autorização e **ownership A×B** (BOLA, o #1 da OWASP API Top 10:2023), idempotência, paginação, erro sem vazar internals.
- **[contract-testing](playbooks/contract-testing.md)** — a fronteira consumidor↔provedor. Consumer-driven, forma positiva **e** negativa (o que nunca pode vazar), e a escolha da ferramenta mais leve que resolve.
- **[e2e-testing](playbooks/e2e-testing.md)** — jornada crítica, não detalhe. Anti-flakiness (espera por condição, seletor estável, estado autossuficiente) e a jornada negada.
- **[performance-testing](playbooks/performance-testing.md)** — carga com objetivo. Threshold como SLO (sem ele não é teste), e os tipos smoke/load/stress/spike/soak escolhidos pela pergunta que respondem.

### 1 prompt + regras de agente

- **[prompts/test-strategy.md](prompts/test-strategy.md)** — o prompt do QA Architect: riscos → matriz por camada → obrigatórios/recomendados/opcionais → **o que não vale** → BDD → quality gate.
- **[AGENTS.md](AGENTS.md)** — regras para a IA atuar como QA Architect/SDET defensivo (cole no arquivo de regras da sua IA).

---

## 🚀 Como usar com IA

Cole no arquivo de regras da sua IA (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`), ajustando o caminho:

```markdown
## Testing Playbook (obrigatório)

Norte de testes: `<caminho-do-clone>/testing-playbook/TESTING.md`.

Ao planejar, revisar ou escrever testes: ler o TESTING.md (inegociáveis + roteamento)
e o(s) módulo(s) indicados. Todo teste proposto tem um bug nomeado e a camada certa;
listar também os testes que NÃO valem. Segurança de teste → security-playbook.
```

Depois peça, por exemplo, *"monte a estratégia de teste desta feature"* — a IA deve devolver riscos, matriz por camada, obrigatórios/recomendados/opcionais, **o que não vale**, BDD e o quality gate.

## 🧭 Princípios de design

1. **Valor sobre quantidade** — cobertura é sintoma, confiança é a meta.
2. **Risco decide tudo** — probabilidade × impacto, não score inventado.
3. **Teste onde o risco vive** — Testing Trophy, não pirâmide dogmática.
4. **Agnóstico** — estratégia universal; exemplos em Gherkin + pseudocódigo, adaptáveis a qualquer stack.
5. **Não duplicar segurança** — o [security-playbook](../security-playbook/) é a fonte da verdade dela.

## 🔧 Manutenção

- Cada módulo tem `last-review` e `sources` no frontmatter; afirmações não triviais citam fonte oficial.
- **Cadência:** playbooks a cada trimestre (ferramentas mudam); estratégia ao menos 1×/ano.
- Playbook **opinativo e curado**: encontrou um erro? Abra uma issue.

## Fontes

[Testing Trophy — Kent C. Dodds](https://kentcdodds.com/blog/write-tests) · [Practical Test Pyramid — Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html) · [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/) · [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) · [Consumer-Driven Contracts — Fowler](https://martinfowler.com/articles/consumerDrivenContracts.html)

---

*Criado por [Silas Marques](https://github.com/silasmarques), 2026. Companheiro do [security-playbook](../security-playbook/).*
