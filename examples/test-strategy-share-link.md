# Exemplo resolvido: estratégia de teste de uma feature

> Referência de **como fica uma boa resposta** ao prompt [test-strategy](../prompts/test-strategy.md) — para humano calibrar a expectativa e para IA calibrar o nível. Produto e feature são fictícios. O que importa copiar é a forma: poucos testes, cada um com bug nomeado, e uma lista honesta do que não vale. Não é gabarito universal: outra feature, outros riscos.

**Pedido:** "Monte a estratégia de teste da feature de compartilhar documento por link."

**Feature (fictícia):** o dono de um documento gera um link público com validade (1h, 24h ou 7 dias). Quem tem o link lê o documento sem login. O dono pode revogar o link. Endpoints: `POST /documents/:id/share`, `DELETE /shares/:token`, `GET /s/:token`.

---

## 1. Resumo da feature

Cria uma exceção deliberada ao controle de acesso: leitura sem autenticação, mediada por um token. O valor é conveniência; o custo de um erro é vazamento de documento.

## 2. Riscos principais

| # | O que pode dar errado | Impacto | Probabilidade |
|---|---|---|---|
| 1 | Usuário gera link para documento que não é dele | Alto (vazamento) | Alta (é o erro clássico de ownership) |
| 2 | Link expirado ou revogado continua abrindo | Alto | Média (borda de tempo, cache) |
| 3 | `GET /s/:token` devolve mais do que o documento (e-mail do dono, ids internos) | Alto | Média |
| 4 | Token previsível ou enumerável | Alto | Baixa se usa gerador seguro → **security-playbook** |
| 5 | Validade aceita valor fora da lista (ex.: 10 anos) | Médio | Média |
| 6 | Link de 24h mostrado na tela como "1h" | Baixo | Baixa |

## 3. Matriz de testes por camada

| Risco | Unitário | Integração | API | Contrato | E2E | Segurança |
|---|---|---|---|---|---|---|
| 1 ownership | — | — | ✔ | — | — | → security-playbook |
| 2 expiração/revogação | ✔ (regra de tempo) | ✔ (revogação gravada) | — | — | — | — |
| 3 vazamento no corpo | — | — | — | ✔ | — | — |
| 4 token | — | — | — | — | — | → security-playbook |
| 5 validade inválida | — | — | ✔ | — | — | — |
| jornada | — | — | — | — | ✔ (1) | — |

Cada risco em **uma** camada. O risco 2 aparece em duas porque são facetas diferentes: a regra de tempo é lógica pura; a revogação é estado no banco.

## 4. Testes OBRIGATÓRIOS

| Teste | Bug que pega | Camada | Como vê-lo falhar |
|---|---|---|---|
| Bruno pede `POST /documents/<doc da Ana>/share` → 404; e Ana, no mesmo teste, recebe 201 | Qualquer usuário publica documento alheio | API (api-testing R2) | Remover o filtro de dono na busca do documento |
| `link_valido()` em tabela de casos, com relógio injetado: 59min válido, 60min expirado, validade 0 | Link vale um instante a mais, ou para sempre | Unitário (integration-testing R7, P4) | Trocar `>=` por `>` na comparação |
| Revogar e em seguida `GET /s/:token` → 404, contra o banco real | Revogação responde 200 mas o link continua abrindo | Integração (integration-testing R1) | Fazer o `DELETE` não gravar |
| Contrato de `GET /s/:token`: tem `title` e `content`; NÃO tem `owner_id`, `owner_email` nem `token` | Leitor anônimo recebe dado do dono | Contrato (contract-testing R3) | Devolver a entidade inteira em vez do recorte |

## 5. Testes RECOMENDADOS

| Teste | Bug que pega | Camada |
|---|---|---|
| `POST …/share` com validade `"10y"`, ausente e de tipo errado → 400 | Link praticamente eterno criado por payload forjado | API (api-testing R7) |
| `POST …/share` sem token de sessão → 401 | Rota de criação exposta | API (api-testing R3) |
| Jornada: Ana cria link → janela anônima abre o documento → Ana revoga → a janela anônima deixa de abrir | As peças funcionam isoladas mas o fluxo não fecha | E2E (e2e-testing R1) |

## 6. Testes OPCIONAIS

- Rate limit em `GET /s/:token` (teste estourando o limite). Só se o endpoint for de fato limitado; a decisão de limitar é do security-playbook.

## 7. Testes que NÃO agregam

| Teste | Por que não |
|---|---|
| "O botão Compartilhar aparece na tela" | Nenhum bug importante e plausível; a jornada E2E já passa por ele |
| E2E para cada validade (1h, 24h, 7d) | Mesma jornada três vezes; a validade é regra e já está no unitário |
| E2E de "Bruno não consegue compartilhar o documento da Ana" | Repete o teste de API de ownership na camada mais cara, sem faceta nova |
| Unitário do gerador de token conferindo o tamanho da string | Testa a biblioteca, não o nosso código; previsibilidade é assunto do security-playbook |
| Teste do texto "expira em 24h" na tela | Risco 6: impacto baixo, probabilidade baixa — exploratório no máximo |
| Snapshot do JSON inteiro de `GET /s/:token` | Quebra a cada campo novo legítimo; o contrato com lista negativa prova o risco sem esse custo |

## 8. Cenários BDD

```gherkin
Funcionalidade: Compartilhar documento por link

  Cenário: dono compartilha e anônimo lê
    Dado que "ana" tem um documento "contrato"
    Quando ela gera um link com validade de 1 hora
    E um visitante sem login abre o link
    Então o visitante vê o título e o conteúdo de "contrato"
    E a resposta não contém dado da conta de "ana"

  Cenário: usuário não compartilha documento de outro
    Dado que "ana" tem um documento "contrato"
    E "ana" consegue gerar um link para ele
    Quando "bruno" tenta gerar um link para "contrato"
    Então recebe 404
    E nenhum link é criado

  Cenário: link revogado para de abrir
    Dado que "ana" gerou um link para "contrato"
    Quando ela revoga o link
    E um visitante abre o link
    Então recebe 404
```

## 9. Dados de teste necessários

- Dois usuários por teste (dono e intruso), criados e removidos pelo próprio teste.
- Um documento por teste, com conteúdo reconhecível.
- Relógio injetável na regra de expiração.
- Banco do mesmo motor de produção, descartável, para o teste de revogação.

## 10. Sugestão de automação

- **Unitário:** a tabela de expiração. Roda em todo commit.
- **Integração + API + contrato:** os obrigatórios e recomendados. Rodam em todo PR.
- **E2E:** uma jornada. Roda no PR; entra só depois de 10 execuções seguidas sem vermelho falso.
- **Performance:** nenhuma. `GET /s/:token` é leitura simples; sem evidência de volume, não há SLO a defender.

## 11. Quality Gate para o PR

Itens de [quality-gates](../strategy/quality-gates.md) P1 que este diff ativa:

- [ ] SEMPRE: cada teste novo tem bug nomeado e foi visto falhar (coluna "como vê-lo falhar" acima).
- [ ] REGRA DE NEGÓCIO: expiração coberta em unitário.
- [ ] API: contrato com lista negativa; 401 na criação; ownership A×B com controle positivo.
- [ ] FLUXO CRÍTICO: 1 E2E da jornada.
- [ ] Segurança do token (entropia, enumeração) revisada pelo security-playbook — fora deste gate, mas bloqueia o PR.

---

## E quando a pergunta é pontual

**Pedido:** "Vale um E2E para validar que link expirado mostra a página de erro?"

**Resposta proporcional:**

> Não. O bug que importa — "link expirado continua abrindo" — é regra de tempo e já está provado no unitário em tabela de casos, que custa milissegundos e controla o relógio. Um E2E precisaria esperar ou manipular o tempo do ambiente: caro e instável. Se a preocupação é a *aparência* da página de erro, isso é visual e de baixo impacto: verificação exploratória, não automação.
