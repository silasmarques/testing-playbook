# 🧪 Testing Playbook

**Um norte normativo de testes inteligentes — feito para humanos e para IAs de codificação (Claude Code, Cursor, Copilot e afins). Agnóstico de linguagem e stack.**

> **Missão:** transformar esforço de teste em confiança mensurável para evoluir o produto sem quebrar o que importa.
> **Princípio:** não buscamos quantidade de testes — buscamos prova de que o que importa funciona.

Não é uma coletânea de boas práticas nem um gerador de suíte inflada. É **norma operacional**: regras objetivas (MUST/NEVER), um motor de decisão por risco, playbooks por camada com exemplos copiáveis e um gate de qualidade verificável. Companheiro do [security-playbook](https://github.com/silasmarques/security-playbook) — a segurança de teste (RLS, prompt injection, abuso de auth) mora lá e é **referenciada, não duplicada**.

> **Referências cruzadas:** os módulos apontam para o security-playbook por caminho relativo (`../security-playbook/…`), assumindo os dois repositórios clonados lado a lado (ex.: `D:\Projetos\`). É assim que a IA de codificação os lê localmente. Na web, use o link acima.

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

## 📎 Requer o security-playbook (repo companheiro)

Este playbook **não duplica** segurança de teste (RLS, prompt injection, abuso de auth, vazamento de secret) — ele **referencia** o [security-playbook](https://github.com/silasmarques/security-playbook). Para adoção completa, clone os dois **lado a lado** (as referências cruzadas são relativas: `../security-playbook/…`):

```bash
git clone https://github.com/silasmarques/security-playbook.git
git clone https://github.com/silasmarques/testing-playbook.git
```

Dá para usar o testing-playbook sozinho — mas o roteamento de segurança apontará para um repo que você não clonou. Para testes com superfície de segurança, tenha os dois.

## 🚀 Como usar com IA — passo a passo

**Passo 1 — Clone** os repositórios num caminho fixo da sua máquina (bloco acima).

**Passo 2 — Cole este bloco no arquivo de regras da sua IA**, ajustando o caminho do clone:

- Claude Code → `~/.claude/CLAUDE.md` (global) ou `CLAUDE.md` do projeto
- Cursor → `.cursorrules` · Copilot → `.github/copilot-instructions.md`

```markdown
## Testing Playbook (obrigatório)

Norte de testes: `<caminho-do-clone>/testing-playbook/TESTING.md`.

Ao planejar, revisar ou escrever testes: ler o TESTING.md (inegociáveis + roteamento)
e o(s) módulo(s) indicados. Todo teste proposto tem um bug nomeado e a camada certa;
listar também os testes que NÃO valem (parte da entrega). Segurança de teste →
security-playbook. Performance sempre com threshold; E2E cobre jornada, não detalhe.
```

**Passo 3 — Teste a adoção.** Numa sessão nova, peça *sem dizer "faça muitos testes"*:

```text
Monte a estratégia de teste da feature de login.
```

A IA deve devolver riscos, matriz por camada, **obrigatórios/recomendados/opcionais**, **os testes que NÃO valem** (com o porquê), cenários BDD e o quality gate — não uma lista inflada. Se ela só despejar testes sem priorizar por risco, confira o caminho do Passo 2.

**Passo 4 — Use no dia a dia.** Exemplos de pedidos e o que esperar:

| Você diz | A IA faz |
|---|---|
| "Que testes valem para este endpoint?" | Matriz por camada + A×B de ownership + o que não vale ([api-testing](playbooks/api-testing.md)) |
| "Vale um E2E aqui?" | Só se for jornada crítica; senão aponta a camada mais barata ([test-layers](strategy/test-layers.md)) |
| "Monta o quality gate deste PR" | Itens ativados pelo que o diff toca ([quality-gates](strategy/quality-gates.md)) |

## 🧭 Princípios de design

1. **Valor sobre quantidade** — cobertura é sintoma, confiança é a meta.
2. **Risco decide tudo** — probabilidade × impacto, não score inventado.
3. **Teste onde o risco vive** — Testing Trophy, não pirâmide dogmática.
4. **Agnóstico** — estratégia universal; exemplos em Gherkin + pseudocódigo, adaptáveis a qualquer stack.
5. **Não duplicar segurança** — o [security-playbook](https://github.com/silasmarques/security-playbook) é a fonte da verdade dela.

## 🔧 Manutenção

- Cada módulo tem `last-review` e `sources` no frontmatter; afirmações não triviais citam fonte oficial.
- **Cadência:** playbooks a cada trimestre (ferramentas mudam); estratégia ao menos 1×/ano.
- Playbook **opinativo e curado**: encontrou um erro? Abra uma issue.

## 📄 Licença

[CC BY-ND 4.0](LICENSE.md) — use e compartilhe com atribuição; não redistribua versões modificadas. **Exceção:** os exemplos e templates (Gherkin, pseudocódigo, snippets) são MIT — copie e adapte livremente. Detalhes em [LICENSE.md](LICENSE.md).

## Fontes

[Testing Trophy — Kent C. Dodds](https://kentcdodds.com/blog/write-tests) · [Practical Test Pyramid — Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html) · [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/) · [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) · [Consumer-Driven Contracts — Fowler](https://martinfowler.com/articles/consumerDrivenContracts.html)

---

*Criado por [Silas Marques](https://github.com/silasmarques), 2026. Companheiro do [security-playbook](https://github.com/silasmarques/security-playbook).*
