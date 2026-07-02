---
last-review: 2026-07-02
---

# Quality Gates: PR e sign-off de release

> Um gate é um conjunto de condições objetivas — sim ou não, sem "acho que está bom". Sua função não é burocracia: é impedir que o risco conhecido chegue à produção sem ao menos um teste que o cubra. Gate sem objetividade é carimbo.

## Regras

- **R1 — MUST** todo gate é **objetivo e verificável**: cada item é sim/não checável por uma pessoa ou máquina, não uma impressão. "Testes suficientes" não é gate; "todo endpoint protegido tem teste de 401/403" é.
- **R2 — MUST** o gate cobre **o que mudou**, proporcional ao risco: PR que toca dinheiro/permissão/dado ativa mais itens que PR de cosmética. Não é o mesmo peso para tudo.
- **R3 — NEVER** aprovar com teste instável, duplicado ou sem asserção "para não travar o PR". Teste ruim aprovado é dívida que dispara vermelho falso e treina o time a ignorar o vermelho.
- **R4 — MUST** o sign-off de release registra **evidência**, não opinião: o que foi testado, o que passou, o que ficou como risco aceito conscientemente (e por quem).
- **R5 — MUST** risco aceito é **explícito e assinado**: "não testamos X porque Y, dono Z aceita" — registrado, não varrido para debaixo do tapete.

## Padrões prontos

### P1 — Quality Gate de PR (ative os itens que o diff aciona)

```text
SEMPRE:
[ ] Todo teste novo tem asserção forte e um bug nomeado que ele pega.
[ ] Nenhum teste instável/duplicado/sem-asserção foi introduzido.
[ ] Bug corrigido? Há um teste que falharia com o bug presente (regressão).

SE O DIFF TOCA REGRA DE NEGÓCIO:
[ ] Toda regra crítica alterada tem ao menos um teste na camada certa.

SE O DIFF TOCA UMA API / ENDPOINT:
[ ] Teste de contrato: status + schema + campos obrigatórios + o que NÃO pode vazar.
[ ] Endpoint protegido: teste de 401 (sem auth) e 403 (sem permissão).
[ ] Recurso com dono: teste de acesso cruzado A×B (BOLA). → security-playbook.

SE O DIFF TOCA UMA INTEGRAÇÃO EXTERNA:
[ ] Teste de erro controlado: timeout / 5xx / credencial inválida, sem vazar internals.

SE O DIFF TOCA UM FLUXO CRÍTICO DE USUÁRIO:
[ ] Ao menos 1 E2E cobrindo a jornada (não os detalhes).

SE O DIFF TOCA IA / GERAÇÃO POR MODELO:
[ ] Teste de formato/contrato do output + fidelidade ao contexto (sem alucinar). → security-playbook (prompt injection).

SE O DIFF TOCA ENDPOINT CRÍTICO OU CARO:
[ ] Threshold de performance definido (p95, taxa de erro) e verde.

SE O DIFF TOCA LOG / OBSERVABILIDADE:
[ ] Verificado que log não grava secret/token/PII; erro é rastreável (correlation id).
```

### P2 — Release Sign-off (evidência, não opinião)

```text
## QA Sign-off — <release / versão>
- Escopo testado: <features / áreas>
- Camadas exercitadas: <unit / integração / API / E2E / segurança / performance>
- Resultado: <passou / passou com ressalvas>
- Riscos aceitos conscientemente:
    - <risco> — não coberto porque <motivo> — aceito por <dono> em <data>
- Evidência: <links de execução / relatórios / prints, quando manual>
- Recomendação: <liberar / liberar com monitoração / segurar>
```

## Anti-padrões

```text
❌ "Cobertura ≥ 80%" como gate único. [viola R1]
   Objetivo, mas mede a coisa errada — some risco, incentiva teste de vaidade.

❌ Aprovar o PR com o E2E "às vezes vermelho, mas geralmente passa". [viola R3]
   Instável aprovado ensina o time a ignorar vermelho — o próximo vermelho real passa batido.

❌ Sign-off "testado, está ok". [viola R4]
   Sem escopo, sem evidência, sem risco aceito. É opinião com carimbo.

❌ Gate idêntico para PR de cosmética e para PR de pagamento. [viola R2]
   Ou trava o trivial, ou libera o perigoso. O gate acompanha o risco do diff.
```

## Checklist

- [ ] Cada item do gate é objetivo e checável (R1)?
- [ ] Os itens ativados correspondem ao que o diff realmente tocou (R2)?
- [ ] Nenhum teste instável/duplicado/sem-asserção entrou "para destravar" (R3)?
- [ ] O sign-off tem escopo + evidência + riscos aceitos assinados (R4/R5)?
