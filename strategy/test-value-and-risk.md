---
last-review: 2026-07-02
sources:
  - https://martinfowler.com/articles/practical-test-pyramid.html
  - https://owasp.org/API-Security/editions/2023/
---

# Valor e Risco: decidir SE o teste vale

> O módulo que impede a suíte de virar teatro. Antes de "como testar", a pergunta é "vale testar?". A resposta não é um número mágico — é risco nomeado + gate binário.

## Por que NÃO um score numérico

A tentação é somar `criticidade + risco + frequência + impacto − manutenção` e cortar por faixa. **Evite.** Somar grandezas incomensuráveis (impacto de segurança "3" não é intercambiável com custo de manutenção "3") fabrica falsa precisão, e assim que o número vira meta, o agente aprende a maximizar pontos em vez de reduzir risco (Lei de Goodhart: "quando a medida vira alvo, deixa de ser boa medida"). Use risco de verdade + um gate de sim/não.

## Regras

- **R1 — MUST** nomear o bug antes do teste: uma frase concreta do defeito que este teste pegaria ("usuário B lê o documento de A via API"). Não conseguiu nomear → o teste é candidato a não existir.
- **R2 — MUST** posicionar o risco em **probabilidade × impacto** (P1) e deixar o quadrante decidir a profundidade: alto×alto testa em múltiplas camadas; baixo×baixo talvez nem automatize.
- **R3 — MUST** passar pelo **gate de valor** (P2): se a resposta a TODAS as perguntas é "não", o teste é descarte.
- **R4 — MUST** subtrair o custo de manutenção do valor de forma qualitativa: teste que quebra a cada refactor legítimo e protege pouco é passivo — não escreva, ou apague.
- **R5 — NEVER** usar cobertura de código como critério de decisão. Cobertura mede linhas executadas, não risco coberto; 100% de linhas triviais some risco algum.
- **R6 — MUST** classificar cada teste proposto como **obrigatório**, **recomendado** ou **opcional** — e listar à parte os que **não valem**, com o porquê. Dizer o que não fazer é entrega, não omissão.

## Padrões prontos

### P1 — Matriz de risco (probabilidade × impacto)

Não é score somado: é posição. **Impacto** = o que se perde se quebrar (dinheiro, dado, permissão, confiança, receita). **Probabilidade** = quão provável quebrar (complexidade, histórico de bugs, nº de integrações, taxa de mudança).

```
IMPACTO
  alto  │  AUTOMATIZAR         │  AUTOMATIZAR EM
        │  (1+ camada certa)   │  MÚLTIPLAS CAMADAS
        │                      │  (unit+API+E2E+segurança)
  ──────┼──────────────────────┼───────────────────────
  baixo │  NÃO AUTOMATIZAR     │  AUTOMATIZAR SE
        │  (talvez exploratório│  recorrente/barato
        │   ou nada)           │  (1 camada leve)
  ──────┴──────────────────────┴───────────────────────
           baixa                  alta      PROBABILIDADE
```

> A diagonal importa mais que a célula exata: alto impacto **ou** alta probabilidade
> já puxa para automação. Regra de bolso: **impacto alto nunca depende só de teste
> manual** — automatize ao menos a camada mais barata que prova o risco.

### P2 — Gate de valor (o teste agrega se responde "sim" a ≥1 crítica)

```text
CRÍTICAS (sim a qualquer uma → forte candidato a automatizar):
[ ] Pegaria um bug real e plausível?
[ ] Protege dinheiro, dado, permissão ou fluxo de receita?
[ ] Evita regressão em funcionalidade importante?
[ ] Cobre uma integração que costuma quebrar?
[ ] Protege contra uso indevido / abuso?

DE APOIO (reforçam, mas sozinhas não bastam):
[ ] Aumenta a confiança de deploy de forma perceptível?
[ ] Substitui trabalho manual repetitivo e caro?
[ ] Gera evidência útil para a decisão de release?

Se a resposta é "não" para TODAS → descartar (ou exploratório/manual pontual).
```

### P3 — Da decisão para a camada

```text
Risco é de LÓGICA pura (cálculo, parser, validação, formatação)   → unitário
Risco está na INTERAÇÃO real (serviço+banco, auth+perfil, fila)   → integração
Risco é o CONTRATO de um endpoint (status/schema/campos/vazamento)→ API + contract
Risco é uma JORNADA de usuário de ponta a ponta                   → E2E (1, não 10)
Risco é ABUSO/permissão/injeção                                   → segurança (security-playbook)
Risco é CARGA/latência/estabilidade                               → performance (com threshold)
```

## Anti-padrões

```text
❌ "Vamos subir a cobertura para 80%." [viola R5]
   Meta de cobertura gera testes de getter e de mock — número sobe, risco fica.

❌ Score 7,5 → automatiza; 7,4 → não. [falsa precisão]
   A fronteira é ruído. Use o quadrante + o gate; decida pelo risco nomeado.

❌ Testar que "o botão existe na tela". [viola R1]
   Nenhum bug importante e plausível. Vaidade.

❌ O mesmo "usuário sem permissão" em unitário, API e E2E, igual. [viola camada]
   Um teste de autorização na camada que impõe a regra (API/servidor) basta;
   E2E cobre a jornada, não re-testa a regra.
```

## Checklist

- [ ] Cada teste proposto tem um bug nomeado (R1)?
- [ ] O risco foi posicionado em probabilidade × impacto (P1)?
- [ ] Passou pelo gate de valor com ≥1 "sim" crítico (P2)?
- [ ] A camada escolhida é a mais barata que prova o risco (P3)?
- [ ] Os testes que NÃO valem foram listados com o porquê (R6)?
- [ ] Nenhuma decisão foi tomada por cobertura (R5)?
