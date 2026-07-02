---
last-review: 2026-07-02
sources:
  - https://martinfowler.com/articles/consumerDrivenContracts.html
  - https://docs.pact.io/
---

# Testar Contrato (fronteira consumidor ↔ provedor)

> O teste que mata o bug clássico: "funcionava no backend, mas quebrou a tela". Um contrato fixa o que o consumidor **de fato usa** do provedor; quando o provedor muda algo fora disso, nada quebra — e quando muda algo dentro, o teste avisa antes de produção. Agnóstico: o conceito vale com Pact (consumer-driven), snapshot de schema, OpenAPI/JSON Schema validation, ou asserção de forma na fronteira.

## Regras

- **R1 — MUST** ter contrato em toda fronteira onde **dois lados evoluem separadamente**: frontend↔backend, backend↔API externa, serviço↔serviço, app↔engine de IA. Se um lado pode fazer deploy sem o outro, há risco de contrato.
- **R2 — MUST** o contrato descreve o que o **consumidor usa**, não tudo que o provedor oferece (consumer-driven). Testar campo que ninguém consome gera quebra desnecessária quando ele muda.
- **R3 — MUST** o contrato afirma os **campos obrigatórios + tipos** E o **negativo**: o que NUNCA pode aparecer (token, secret, hash, dado de outro usuário). O vazamento é violação de contrato tanto quanto o campo faltante.
- **R4 — MUST** o contrato roda em CI dos **dois lados**: o provedor verifica que ainda satisfaz os consumidores; o consumidor verifica que ainda assume o que o provedor entrega.
- **R5 — SHOULD** preferir a ferramenta mais leve que resolve: para 1 consumidor interno, snapshot de schema (JSON Schema/zod/pydantic) pode bastar; Pact e infra de broker rendem quando há muitos consumidores/serviços. Não montar broker para dois módulos.

## Padrões prontos

### P1 — Anatomia de um contrato (agnóstico)

```text
Quando o consumidor chama GET /artifacts/:id
O provedor DEVE retornar:
  id          : string (uuid)
  type        : enum ["BDD","PERF","ANALYSIS"]
  title       : string
  content      : string
  created_at   : string (ISO-8601)
  owner_id     : string
O provedor NUNCA deve retornar:
  access_token, refresh_token, internal_prompt, secret/service key,
  qualquer campo de outro usuário
```

### P2 — Contrato como teste executável (pseudocódigo neutro)

```text
teste "contrato de GET /artifacts/:id":
  resp = GET("/artifacts/r-1", auth=token_do_dono)
  # forma positiva
  validar_schema(resp.corpo, ArtifactSchema)   # zod/JSON Schema/pydantic/pact matcher
  esperar tipos corretos e campos obrigatórios presentes
  # forma negativa (tão importante quanto)
  para campo in ["access_token","refresh_token","internal_prompt","service_role_key"]:
    esperar campo NÃO presente em resp.corpo
```

### P3 — Escolha da abordagem (3 níveis)

```text
1 consumidor interno, contrato simples
  → snapshot/validação de schema na fronteira (leve, zero infra).
Vários consumidores do mesmo provedor
  → consumer-driven contracts (ex.: Pact): cada consumidor publica o que usa;
     o provedor roda todos no CI antes de mudar.
Provedor de terceiro (não controlo o outro lado)
  → contrato = testes de integração contra o provedor (ou um dublê fiel a ele),
     validando as respostas que consumo + alertando quando o schema deles muda.
```

## Anti-padrões

```text
❌ Testar todo campo que o provedor devolve. [viola R2]
   O provedor muda um campo que ninguém usa → seu CI fica vermelho à toa.

❌ Contrato só no consumidor, provedor não roda. [viola R4]
   O provedor quebra o contrato e ninguém percebe até a tela quebrar.

❌ Contrato sem forma negativa. [viola R3]
   Passa mesmo com token vazando no corpo — validou presença, não ausência.

❌ Broker Pact + infra para dois módulos internos. [viola R5]
   Peso desproporcional ao risco; um snapshot de schema resolveria.
```

## Checklist

- [ ] Toda fronteira com deploy independente tem contrato (R1)?
- [ ] O contrato reflete o que o consumidor usa, não tudo (R2)?
- [ ] Afirma campos obrigatórios E o que não pode vazar (R3)?
- [ ] Roda no CI dos dois lados quando ambos são controlados (R4)?
- [ ] A abordagem é a mais leve que resolve o caso (R5)?
