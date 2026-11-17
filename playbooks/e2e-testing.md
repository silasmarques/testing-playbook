---
last-review: 2026-07-02
sources:
  - https://kentcdodds.com/blog/write-tests
  - https://playwright.dev/docs/actionability
---

# Testar E2E (jornadas de usuário)

> E2E é o teste mais caro e mais frágil — use-o com parcimônia cirúrgica. Ele existe para provar que uma **jornada crítica** funciona de ponta a ponta, como o usuário faz. Não é para cobrir tudo, não é para re-testar regras que a API já cobre, e não é para pixel. Agnóstico: exemplos em Gherkin; adapte ao seu runner (Playwright, Cypress, Selenium, Detox para mobile…). Onde o runner oferecer **auto-waiting/actionability** (ex.: Playwright), use — é o principal antídoto contra flakiness.

## Regras

- **R1 — MUST** E2E cobre **jornada crítica**, não detalhe: o fluxo que, se quebrar, o usuário não consegue fazer o que dá valor/dinheiro. Uma jornada = um teste; não 10 variações frágeis.
- **R2 — NEVER** re-testar em E2E uma regra que a API/unitário já prova. E2E que repete validação de campo é custo sem risco novo — a regra vive na camada barata, o E2E cobre o caminho.
- **R3 — NEVER** `sleep`/espera fixa. Espere por **condição** (elemento acionável, resposta recebida, URL mudou). Espera fixa é a causa nº 1 de flakiness — ou é lenta demais, ou curta demais.
- **R4 — MUST** localizar elementos por **papel/rótulo acessível ou test-id estável**, não por CSS/estrutura de DOM frágil. Seletor acoplado a layout quebra a cada ajuste visual.
- **R5 — MUST** cada E2E semeia e limpa o **próprio estado** (usuário, dados), sem depender de outro teste nem de ordem. Estado compartilhado = falha em cascata e vermelho falso.
- **R6 — MUST** quando o produto tem área restrita, incluir **uma** jornada **negada**: usuário sem permissão tenta o fluxo e a interface o bloqueia sem exibir dado. Isto não re-testa a regra de autorização (ela é provada na API, onde é imposta — `test-layers.md` R3); prova a faceta que só o E2E enxerga: rota, redirecionamento e tela não entregam o conteúdo. Uma por fronteira de acesso, não uma por papel × tela. A checagem de segurança em si → [security-playbook](../../security-playbook/SECURITY.md).
- **R7 — SHOULD** estabilizar dado/ambiente ANTES de automatizar um fluxo. Automatizar um fluxo instável produz automação instável.

## Padrões prontos

### P1 — O que é (e não é) jornada de E2E

```text
JORNADA (vale E2E):
  Login → ação principal do produto → resultado persistido/visível.
  Login → conectar integração → usar o dado dela → salvar.
  Usuário sem permissão → tenta área restrita → é bloqueado.

NÃO é jornada (não desperdice E2E):
  "O botão X existe."               → é asserção de componente, não jornada.
  "Campo aceita no máximo 500."     → é regra; testa em API/unitário.
  "Layout está pixel-perfect."      → é visual/regressão de imagem, outra ferramenta.
  Repetir a mesma jornada com 8 variações de input.  → 1 jornada + variações na API.
```

### P2 — Estrutura de um E2E (Gherkin, foco na jornada)

```gherkin
Funcionalidade: Jornada principal — criar e salvar um artefato

  Cenário: usuário completa o fluxo do produto
    Dado que estou autenticado como um usuário válido
    Quando navego para a criação de artefato
    E preencho os dados obrigatórios
    E confirmo a geração
    Então vejo o artefato gerado
    E ao recarregar, ele continua salvo no meu histórico

  Cenário: usuário sem permissão é bloqueado (jornada negada)
    Dado que estou autenticado como usuário sem acesso ao projeto "X"
    Quando tento abrir o projeto "X"
    Então vejo a negação de acesso
    E não vejo nenhum dado do projeto
```

### P3 — Regras de estabilidade (o checklist anti-flaky do E2E)

```text
[ ] Espera por condição (elemento acionável / resposta / navegação), nunca sleep. (R3)
[ ] Seletor por papel/rótulo acessível ou test-id estável, nunca por CSS frágil. (R4)
[ ] Cada teste cria seu usuário/dado e limpa ao fim; sem ordem entre testes. (R5)
[ ] Ambiente determinístico: bordas externas instáveis são controladas/dubladas.
[ ] Rodou 10x seguidas sem falso vermelho antes de entrar na suíte de PR. (R7)
```

## Anti-padrões

```text
❌ 80 E2E cobrindo cada tela e botão. [viola R1]
   Suíte lenta e frágil que o time desliga. Cubra jornadas, deixe regras para API.

❌ await sleep(3000) esperando "a tela carregar". [viola R3]
   Flaky por construção. Espere o elemento ficar acionável.

❌ Seletor tipo div > div:nth-child(3) > button. [viola R4]
   Qualquer ajuste de layout quebra. Use papel/rótulo/test-id.

❌ Teste 2 depende do usuário criado no teste 1. [viola R5]
   Rodar em paralelo ou fora de ordem quebra tudo. Cada teste é autossuficiente.
```

## Checklist

- [ ] Cada E2E cobre uma jornada crítica, não um detalhe (R1)?
- [ ] Nenhuma regra já coberta em API/unitário foi re-testada em E2E (R2)?
- [ ] Zero `sleep` fixo; espera por condição (R3)?
- [ ] Seletores estáveis (papel/rótulo/test-id) (R4)?
- [ ] Cada teste é autossuficiente em estado (R5)?
- [ ] Havendo área restrita, há uma jornada negada por fronteira de acesso (R6)?
