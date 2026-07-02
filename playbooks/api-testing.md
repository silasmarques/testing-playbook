---
last-review: 2026-07-02
sources:
  - https://owasp.org/API-Security/editions/2023/
  - https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
---

# Testar API / Serviços HTTP

> A API deve ser testada ANTES da UI: a interface esconde problemas que a API expõe crus. E é onde moram os riscos mais caros — a [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/) tem no topo **Broken Object Level Authorization (BOLA)**, sozinha ~40% dos ataques a APIs. Este playbook é agnóstico: os exemplos usam Gherkin + arrange/act/assert; adapte ao seu framework (supertest, RestAssured, requests+pytest, Postman/newman, hurl, k6…).

## Regras

- **R1 — MUST** testar cada endpoint em três eixos: **funcional** (happy + negative + boundary), **contrato** (status + schema + campos) e **autorização** (autenticado? dono do objeto?). Faltar um eixo deixa risco descoberto.
- **R2 — MUST** teste de **ownership A×B** para todo recurso com dono: usuário B, autenticado e legítimo, não alcança o recurso de A. É o BOLA (API #1). A checagem de segurança em si → [security-playbook](../../security-playbook/core/security-testing.md).
- **R3 — MUST** teste de autenticação: sem token → 401; token inválido/expirado → 401. E de autorização: sem permissão → 403. Endpoint protegido sem esses dois testes é endpoint sem prova de proteção.
- **R4 — MUST** validar que o erro **não vaza internals**: sem stack trace, SQL, path, versão, token ou PII no corpo. Erro é genérico + identificador de correlação.
- **R5 — MUST** validar o **contrato de resposta**: campos obrigatórios presentes, tipos corretos, e — crítico — os campos que NUNCA podem aparecer (token, secret, hash de senha, dado de outro usuário). Ver `contract-testing.md`.
- **R6 — MUST** para operação que o cliente pode reenviar (retry, pagamento): teste de **idempotência** — repetir não duplica efeito. E para listagem: teste de **paginação** (limite imposto pelo servidor) e **filtros** em combinações reais.
- **R7 — MUST** cobrir **boundary**: vazio, mínimo, máximo, acima do máximo, tipo errado. O bug quase sempre está na borda, não no meio.

## Padrões prontos

### P1 — Matriz de tipos de teste por endpoint

| Tipo | Prova | Exemplo de asserção |
|---|---|---|
| Happy path | Fluxo correto com dados válidos | 200 + corpo esperado |
| Negative | Erro previsível com dado inválido | 400 + mensagem genérica |
| Boundary | Limites: vazio, min, max, acima, tipo errado | 400 no limite estourado |
| Contract | Status + schema + campos + o que não vaza | schema válido; sem `token` no corpo |
| Auth | Sem/inválido token | 401 |
| Authorization | Autenticado sem permissão | 403 |
| Ownership (BOLA) | B não acessa recurso de A | 403/404 sem dado de A |
| Idempotência | Reenvio não duplica | 1 efeito, não 2 |
| Paginação | Página/limite/ordenação/total | limite do servidor respeitado |
| Rate limit | Abuso controlado | 429 ao estourar |
| Error handling | Erro sem vazar internals | sem stack/SQL/token no corpo |

### P2 — Suíte mínima de um endpoint (cenários BDD agnósticos)

Endpoint ilustrativo: `GET /resources/:id` (recurso com dono).

```gherkin
Funcionalidade: Acesso a um recurso por ID

  Cenário: dono recebe o próprio recurso (happy)
    Dado que estou autenticado como "ana"
    E existe um recurso meu com id "r-1"
    Quando faço GET /resources/r-1
    Então recebo 200
    E o corpo tem os campos obrigatórios do contrato
    E o corpo NÃO contém token, secret nem dado de outro usuário

  Cenário: sem autenticação (auth)
    Dado que não envio credencial
    Quando faço GET /resources/r-1
    Então recebo 401

  Cenário: usuário não acessa recurso de outro (BOLA/ownership)
    Dado que estou autenticado como "bruno"
    E existe um recurso de "ana" com id "r-1"
    Quando faço GET /resources/r-1
    Então recebo 404
    E a resposta não revela se o recurso existe

  Cenário: id inexistente (negative)
    Dado que estou autenticado como "ana"
    Quando faço GET /resources/inexistente
    Então recebo 404

  Cenário: erro interno não vaza detalhe (error handling)
    Dado que a dependência de dados está indisponível
    Quando faço GET /resources/r-1
    Então recebo 500
    E o corpo traz mensagem genérica + id de correlação
    E não contém stack trace, SQL, path nem versão
```

### P3 — Formato de teste (arrange/act/assert, adapte ao framework)

```text
# Pseudocódigo neutro — traduza para jest/pytest/RestAssured/newman/hurl:
teste "POST /artifacts recusa payload acima do limite":
  # arrange
  token   = autenticar("ana")
  payload = { conteudo: "x" repetido (LIMITE + 1) vezes }
  # act
  resp = POST("/artifacts", corpo=payload, auth=token)
  # assert
  esperar resp.status == 400
  esperar resp.corpo.erro é mensagem genérica
  esperar resp.corpo NÃO contém "stack" nem "sql"
```

## Anti-padrões

```text
❌ Testar só o happy path. [viola R1, R7]
   O bug mora no negative e no boundary; happy sozinho dá falsa segurança.

❌ Confiar que "a UI não deixa o usuário mandar isso". [viola R1]
   A API é chamável direto. Teste como o atacante chama: sem a UI.

❌ Recurso com dono sem teste A×B. [viola R2]
   BOLA é o risco #1 de API. Sem o segundo usuário, o vazamento passa despercebido.

❌ Asserção só no status (200), ignorando o corpo. [viola R5]
   200 com token vazando no JSON "passa" — e é um incidente. Asserte o que não pode vir.
```

## Checklist

- [ ] Cada endpoint tem happy + negative + boundary (R1, R7)?
- [ ] Recurso com dono tem teste A×B de ownership (R2)?
- [ ] Endpoint protegido tem 401 e 403 (R3)?
- [ ] O corpo é validado por contrato, incluindo o que NÃO pode vazar (R5)?
- [ ] Erro testado sem vazar internals (R4)?
- [ ] Idempotência/paginação/rate limit onde se aplicam (R6)?
