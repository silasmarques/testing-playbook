---
last-review: 2026-07-02
sources:
  - https://kentcdodds.com/blog/write-tests
  - https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications
  - https://martinfowler.com/articles/practical-test-pyramid.html
---

# Camadas de Teste: o que cada uma prova e quando usar

> Cada camada responde a uma pergunta diferente. Escolher a camada errada é como pesar líquido com régua: mede algo, mas não o que importa. O princípio-guia (Kent C. Dodds): **quanto mais o teste se parece com o uso real do software, mais confiança ele dá.**

## Pirâmide vs. Trophy — qual mentalidade

A pirâmide clássica (muitos unitários, poucos E2E) nasceu quando testes de integração eram lentos e frágeis. Para stacks web modernas, a **Testing Trophy** reflete melhor a realidade: o maior peso vai para **integração**, porque é onde a maioria dos bugs mora (as suposições quebram nas fronteiras) e onde o teste se parece com o uso real sem custar o preço do E2E. Não é dogma — é heurística: **teste onde o risco vive.** Numa lib de cálculo puro, o peso volta para unitário; num app com banco/auth/integrações, vai para integração/API.

> Nota de vocabulário (Fowler): "integração" significa coisas diferentes para pessoas
> diferentes ("narrow" vs "broad"). Neste playbook, **integração = duas ou mais partes
> reais conversando** (ex.: serviço + banco de verdade), não o serviço inteiro no ar
> (isso é E2E). Alinhe o termo com seu time antes de discutir proporções.

## Regras

- **R1 — MUST** escolher a camada pelo risco (`test-value-and-risk.md` P3), não pela facilidade de escrever. O teste fácil que não prova o risco é o teste errado.
- **R2 — MUST** testar **comportamento observável**, não implementação interna, em toda camada. Teste acoplado a "como" quebra a cada refactor legítimo; teste acoplado a "o quê" sobrevive.
- **R3 — NEVER** duplicar o mesmo risco em várias camadas sem justificativa. A regra de autorização se testa onde ela é imposta (servidor/API); o E2E cobre a jornada, não re-verifica a regra.
- **R4 — MUST** subir na pirâmide/trophy só quando a camada abaixo não consegue provar o risco. E2E é caro e frágil: reserve-o para jornadas, não para regras.
- **R5 — MUST** manter cada camada determinística com os controles dela (ver os playbooks): unitário sem I/O real; integração com dado semeado e limpo (`integration-testing.md` R5); E2E com auto-waiting, nunca `sleep`.

## Padrões prontos

### P1 — Mapa de camadas (o que prova, quando usar, exemplo agnóstico)

| Camada | Prova | Use quando a pergunta é | Exemplo de bom teste |
|---|---|---|---|
| **Unitário** | Uma regra/função isolada em vários cenários e bordas | "Essa lógica está correta em todas as entradas?" | Política de senha; cálculo de score; parser; normalização de status; sanitização de input |
| **Integração** | Duas+ partes reais conversando | "As partes conversam como eu suponho?" | Serviço grava no banco real; auth cria perfil; upload persiste e indexa; consulta retorna só o do dono |
| **API / serviço** | O contrato HTTP: status, schema, autorização, erro | "O endpoint se comporta como o contrato diz?" | 401 sem token; 403 sem permissão; 404 inexistente ou de outro dono; payload no limite; erro sem stack trace |
| **Contrato** | A fronteira consumidor↔provedor não quebrou | "Uma mudança no provedor quebraria o consumidor?" | Frontend↔backend; backend↔API externa; o que o consumidor de fato usa |
| **E2E** | Uma jornada crítica de ponta a ponta, como o usuário faz | "O usuário consegue completar o fluxo que dá dinheiro/valor?" | Login → ação principal → resultado persistido |
| **Segurança** | Abuso é negado (→ security-playbook) | "O atacante/usuário indevido é bloqueado?" | A×B (BOLA); injeção; vazamento de secret; rate limit |
| **Performance** | Carga/latência dentro de SLO (com threshold) | "Aguenta o uso real sem degradar?" | p95 < alvo; taxa de erro < alvo; sem 500 no nominal |

### P2 — A regra prática (uma linha por camada)

```text
Unitário  cobre  LÓGICA.
Integração cobre  as PARTES conversando.
API       cobre  o CONTRATO do endpoint.
Contrato  cobre  a FRONTEIRA entre serviços.
E2E       cobre  a JORNADA do usuário.
Segurança cobre  o ABUSO.
Performance cobre a CARGA.
```

### P3 — Anti-flakiness transversal (vale para todas as camadas)

```text
[ ] Sem sleep fixo — espere por CONDIÇÃO (elemento pronto, resposta recebida), não por tempo.
[ ] Sem ordem entre testes — cada teste semeia e limpa o próprio estado.
[ ] Sem relógio/rede real não-controlados — injete o tempo; use dublês nas bordas externas.
[ ] Dado isolado por teste — IDs únicos; nada de "o teste 3 depende do registro do teste 1".
[ ] Estabilize ANTES de automatizar — cenário instável vira automação instável (e vermelho falso).
```

## Anti-padrões

```text
❌ Pirâmide como dogma: 200 unitários de getter + 0 teste de integração. [viola R1]
   O risco está na fronteira serviço↔banco, que ninguém está testando.

❌ Teste acoplado ao "como": espiar chamada interna de método privado. [viola R2]
   Refatorar o interno (sem mudar o comportamento) quebra o teste — falso vermelho.

❌ E2E para validar uma regra de negócio. [viola R3, R4]
   Caro e frágil. A regra se testa na API/unitário; o E2E cobre a jornada.

❌ Mockar tudo até o teste de integração não integrar nada. [viola R2]
   Mock contra mock testa o mock. Integração exige que a parte arriscada seja real (integration-testing R1).
```

## Checklist

- [ ] Cada teste está na camada mais barata que prova o risco (R1)?
- [ ] Testa comportamento observável, não implementação interna (R2)?
- [ ] Nenhum risco duplicado entre camadas sem justificativa (R3)?
- [ ] E2E reservado para jornadas, não para regras (R4)?
- [ ] Os controles de determinismo da camada estão aplicados (R5/P3)?
