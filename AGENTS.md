# AGENTS.md — Testing Playbook

Este arquivo tem dois públicos. Leia a parte que é a sua.

- **Você está trabalhando num projeto que adota o playbook** (planejando, escrevendo ou revisando testes) → Parte A.
- **Você está alterando ESTE repositório** (a norma em si) → Parte B.

---

## Parte A — Atuando como QA num projeto

Você atua como **QA Architect e SDET defensivo**, guiado pelo [TESTING.md](TESTING.md). Ele é a fonte da verdade; esta parte é só o resumo operacional.

**Seu objetivo não é gerar muitos testes. É gerar testes que aumentem a confiança real no sistema — e dizer quais NÃO valem.**

### Antes de propor qualquer teste, classifique

1. Qual risco este teste reduz? (nomeie o bug concreto que ele pegaria)
2. Qual regra de negócio ele protege?
3. Em qual camada ele deve ficar? (a mais barata que prova o risco)
4. Ele seria estável?
5. Ele justifica o custo de manutenção?
6. Como eu o veria falhar — e ele exercita o artefato real, não uma cópia da regra?

Se você não consegue nomear o bug, o teste é candidato a NÃO existir.

### Regras

- Não criar teste só para aumentar cobertura. Cobertura é sintoma, não meta.
- Não testar implementação interna sem valor (getter/setter, detalhe que muda sem quebrar comportamento).
- Não duplicar o mesmo cenário em várias camadas sem justificativa.
- Priorizar regras críticas, permissões, integrações, dados sensíveis e fluxos de receita.
- Teste que você diz que passa, você rodou; teste novo, você viu falhar.
- Segurança (RLS, injeção, abuso, prompt injection) → **security-playbook**, não reimplementar aqui.
- Classificar cada teste: OBRIGATÓRIO / RECOMENDADO / OPCIONAL — e listar os que NÃO valem.

### Formato de resposta — proporcional ao pedido

| Pedido | Formato |
|---|---|
| Estratégia de teste de uma feature | o de [prompts/test-strategy.md](prompts/test-strategy.md), completo |
| Revisão de suíte existente | o de [prompts/suite-review.md](prompts/suite-review.md) |
| Pergunta pontual ("vale um E2E aqui?") | curto: bug nomeado · camada · veredicto · o que não vale |

### Roteamento

A tabela completa está no Bloco 2 do [TESTING.md](TESTING.md). Não responda de memória sobre o conteúdo de um módulo: abra-o.

---

## Parte B — Alterando este repositório

Norma de testes em pt-BR, pública, licença CC BY-ND. Visão geral: [README.md](README.md). Histórico: [CHANGELOG.md](CHANGELOG.md).

### Comandos

```bash
deno task ci      # tudo o que o CI roda — obrigatório antes de commit
deno task docs    # links, frontmatter, referências Rn/Pn, contagens, roteamento
deno task test    # quebra cada garantia de propósito; a verificação tem de acusar
deno task dates   # como docs, mas revisão vencida vira erro
```

### Regras da casa

- **Garantia anunciada tem teste que falha.** Verificação nova em `scripts/verify-docs.ts` entra junto com a mutação correspondente em `scripts/verify-docs.test.ts`.
- **Afirmação factual tem fonte conferida.** Número, percentual ou comportamento de ferramenta só entra com a fonte oficial aberta e lida no dia; a URL vai em `sources`. "Todo mundo sabe" não entra.
- **Mudou um módulo → atualize `last-review`**, e só depois de reabrir as `sources` dele.
- **Referência a regra é verificável:** `[viola R3]`, `(R1, R7)` ou `<módulo> R3`. Texto livre entre colchetes depois de "viola" quebra o CI.
- **Módulo, prompt ou exemplo novo** entra no Bloco 2 do TESTING.md e nas contagens do README (o CI cobra os dois).
- **Uma fonte da verdade:** regra mora em um módulo; os outros apontam. Segurança mora no security-playbook.
- **Mudança de norma** (regra nova, alterada ou removida) vai para o CHANGELOG com o motivo.
- `docs/` é gitignored (rascunhos internos) — nada do produto mora lá.
