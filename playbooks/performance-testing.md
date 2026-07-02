---
last-review: 2026-07-02
sources:
  - https://grafana.com/docs/k6/latest/
  - https://grafana.com/docs/k6/latest/using-k6/thresholds/
---

# Testar Performance (carga com objetivo)

> "Rodar carga" não é teste — é curiosidade. Teste de performance precisa de um **threshold**: um critério objetivo de aprovação/falha que codifica o SLO (p95 de latência, taxa de erro). Sem threshold, o resultado é um gráfico bonito que ninguém sabe se é bom. Agnóstico: exemplos com k6 (onde thresholds são nativos), mas o princípio vale com Gatling, JMeter, Locust, Artillery.

## Regras

- **R1 — MUST** todo teste de performance tem **threshold** — sem ele, não há aprovação/falha, só um número. O threshold é o teste; a carga é só o meio.
- **R2 — MUST** o threshold codifica um **SLO real**: p95 (ou p99) de latência e taxa de erro máxima, derivados do que o usuário/negócio tolera — não um número inventado.
- **R3 — MUST** escolher o **tipo de teste pelo objetivo** (P1): smoke, load, stress, spike, soak. Cada um responde a uma pergunta diferente; rodar o errado responde a pergunta que ninguém fez.
- **R4 — MUST** medir sob **carga realista**: dados representativos, distribuição de endpoints parecida com produção, ramp-up gradual. Carga irreal dá número irreal.
- **R5 — MUST** aplicar performance nos **endpoints certos**: os críticos (fluxo de receita/uso) e os caros (geração pesada, export, IA). Não teste de carga em tudo — teste onde a degradação dói.
- **R6 — SHOULD** rodar smoke de performance no CI (carga baixa, rápido) como gate leve; os pesados (stress/soak) sob demanda, fora do caminho de todo PR.

## Padrões prontos

### P1 — Tipos de teste (escolha pelo objetivo)

| Tipo | Pergunta que responde | Quando usar |
|---|---|---|
| **Smoke** | "O endpoint está saudável sob carga mínima?" | Todo CI — gate rápido de sanidade |
| **Load** | "Aguenta a carga esperada de uso real?" | Antes de release; capacidade nominal |
| **Stress** | "Até onde aguenta antes de quebrar?" | Planejamento de capacidade; achar o teto |
| **Spike** | "Sobrevive a um pico súbito?" | Campanhas, lançamentos, viralização |
| **Soak** | "Degrada ao longo do tempo?" (memória, conexões) | Antes de rodar por dias; caça a vazamento |

### P2 — Thresholds como SLO (exemplo k6, princípio agnóstico)

```javascript
// k6: thresholds = critério de aprovação/falha. Falhou o threshold, falhou o teste.
export const options = {
  thresholds: {
    http_req_duration: ["p(95)<2000"],   // 95% das respostas < 2s (endpoint comum)
    http_req_failed:   ["rate<0.01"],    // taxa de erro < 1%
    // para geração síncrona pesada (IA/export), afrouxe conscientemente:
    // "http_req_duration{tipo:ia}": ["p(95)<8000"],
  },
};
```

```text
Referência de thresholds (ajuste ao seu SLO — não copie cego):
  endpoint comum        p95 < 2s
  geração pesada/IA     p95 < 8s (se síncrona) — ou torne assíncrona
  taxa de erro          < 1%
  cenário nominal       zero 500
  endpoint caro         rate limit dispara sob abuso controlado
```

### P3 — Onde aplicar (candidatos típicos)

```text
SIM (crítico ou caro):
  - endpoint de geração/processamento pesado (IA, relatório, export)
  - fluxo de receita / login / checkout
  - upload/indexação
  - busca/consulta de alto volume
NÃO (por padrão):
  - CRUD trivial de baixo volume
  - endpoints administrativos raros
  - telas estáticas
```

## Anti-padrões

```text
❌ Rodar 10k requisições e olhar o gráfico "no olho". [viola R1]
   Sem threshold, não há passa/falha. É observação, não teste.

❌ p95 < 500ms "porque parece bom". [viola R2]
   Threshold sem SLO real reprova o que era aceitável ou aprova o que não era.

❌ Load test com 1 endpoint e dado fixo. [viola R4]
   Produção tem mix de endpoints e dados variados; o número não se traduz.

❌ Soak de 6h no pipeline de todo PR. [viola R6]
   Trava o fluxo. Smoke no CI; stress/soak sob demanda.
```

## Checklist

- [ ] Todo teste tem threshold de aprovação/falha (R1)?
- [ ] O threshold codifica um SLO real (p95 + taxa de erro) (R2)?
- [ ] O tipo (smoke/load/stress/spike/soak) casa com o objetivo (R3)?
- [ ] Carga e dados são realistas (R4)?
- [ ] Aplicado nos endpoints críticos/caros, não em tudo (R5)?
- [ ] Smoke no CI; pesados sob demanda (R6)?
