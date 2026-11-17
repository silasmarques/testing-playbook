# Histórico de versões

## v1.3.0 — 2026-11-17 · registro por projeto

- **[templates/TESTING-STATUS.md](templates/TESTING-STATUS.md)** — o registro que fica no projeto: mapa de riscos com o teste que prova cada um e a data em que foi visto falhar, última revisão de suíte, riscos aceitos, testes instáveis. O guia do README e as instruções para a IA passam a usá-lo.
- **Medição — resultados não são publicados.** O repositório traz o método e o pontuador; número de execução vale para um modelo, num dia, e fica com quem rodou. [lab/README.md](lab/README.md) registra também que a cobaia atual discrimina pouco entre revisões boas.
- **`deno task eval --prompt-only`** — imprime o prompt para rodar a medição à mão, sem o CLI.

## v1.2.0 — 2026-11-17 · a tese demonstrada

A v1.1 verificava a documentação. Faltava evidência do que o playbook afirma sobre testes. Esta versão acrescenta um laboratório em que isso é executado.

### Novo

- **[lab/](lab/README.md)** — suíte-cobaia com 14 testes (11 com defeito plantado, 3 bons como isca), 8 bugs plantáveis e gabarito. Resultado medido: 96% de cobertura de linhas e 3 de 8 bugs críticos sem nenhum teste que perceba.
- **[lab/prova.test.ts](lab/prova.test.ts)** — no CI: planta cada bug e exige que caiam exatamente os testes do gabarito; confere a coerência do gabarito e os números anunciados.
- **[eval/](eval/run-suite-review.ts)** — medição de revisão de suíte por IA, com e sem playbook, usando o próprio bloco de `prompts/suite-review.md`. Pontuador determinístico e testado. **A medição em si ainda não foi executada** (o CLI `claude` não estava disponível); nenhum resultado é anunciado.
- **Verificação de links** passa a cobrir `lab/`.

### Revisão trimestral

- contract-testing, e2e-testing e performance-testing: fontes reabertas em 2026-11-17, `last-review` atualizado.
- e2e-testing R3: removido "a causa nº 1 de flakiness" — nenhuma fonte citada sustenta o superlativo.
- performance-testing: acrescentada a fonte dos tipos de teste; "Load" anotado com o nome que o k6 usa (average-load).

## v1.1.0 — 2026-11-17 · a norma aplicada a si mesma

Revisão independente. A v1 pregava "todo teste prova um risco" e "a norma é verificada como código", mas a própria verificação deixava passar 9 de 10 quebras plantadas. Esta versão corrige isso e resolve contradições entre módulos.

### Novo

- **Inegociável 13 — teste que nunca falhou não prova nada.** Ver o teste falhar, exercitar o artefato real (não uma cópia da regra) e ter controle positivo em teste negativo. Refletida no gate de PR e nas instruções para a IA.
- **[playbooks/integration-testing.md](playbooks/integration-testing.md)** — a camada de maior peso da Trophy não tinha playbook: o que é real, o que é dublê, isolamento de dado, tempo injetado. Fontes abertas em 2026-11-17.
- **[examples/test-strategy-share-link.md](examples/test-strategy-share-link.md)** — exemplo resolvido de estratégia e de resposta curta.
- **Gate de PR** ganhou os itens "visto falhar", "teste removido tem justificativa" e "persistência → integração no motor real".
- **[prompts/suite-review.md](prompts/suite-review.md)** — revisão de suíte existente, que o README prometia e não entregava.
- **[scripts/verify-docs.test.ts](scripts/verify-docs.test.ts)** — 22 mutações: cada garantia do CI é quebrada de propósito e tem de ser acusada.
- **Verificação ampliada** — links para pastas e arquivos não-`.md`; links ao security-playbook quando ele está ao lado; frontmatter de verdade; referências a regras; contagens anunciadas; módulo fora do roteamento.
- **Cadência cobrada** — workflow semanal `review-cadence`. Actions fixadas por SHA.
- **AGENTS.md em duas partes** — usar o playbook / alterar este repositório.
- **Resposta proporcional ao pedido** — pergunta pontual não recebe o relatório completo.

### Erros da v1 corrigidos

| Onde | O erro | Como foi constatado |
|---|---|---|
| api-testing (introdução) | "BOLA, sozinha ~40% dos ataques a APIs", atribuído à OWASP. A página não traz percentual | fonte oficial, lida em 2026-11-17 |
| README (árvore) | Listava `docs/specs/`, que é gitignored e não existe no repositório | `ls` + `.gitignore` |
| README, TESTING.md | Caminho de exemplo `D:\Projetos\` | leitura |
| README (setup do Cursor) | Indicava `.cursorrules`; a documentação atual descreve `.cursor/rules/*.mdc` e `AGENTS.md` | fonte oficial, lida em 2026-11-17 |
| e2e-testing R6 × test-layers R3 | Uma obrigava E2E de permissão negada; a outra proibia re-testar autorização em E2E | leitura |
| test-value-and-risk P1 × inegociável 4 | "Múltiplas camadas" sem dizer que são facetas diferentes, não o mesmo cenário | leitura |
| test-value-and-risk R3 × P2 | Caso "só perguntas de apoio" ficava indefinido | leitura |
| api-testing R1/R7 | "Cada endpoint" nos três eixos, sem proporção ao risco — induzia a inflação que o playbook condena | leitura |
| api-testing R2/P1/P2, test-layers P1 | 403, 404 e "403/404" para o mesmo caso | leitura |
| api-testing (checklist) | Atribuía rate limit à R6, que não o mencionava | leitura |
| quality-gates (anti-padrão) | "[viola R1]" num item que o próprio texto admitia ser objetivo | leitura |
| test-value-and-risk (anti-padrões) | `[viola camada]`, `[falsa precisão]` — não eram regras | verificação nova |
| CI | Aprovava regra inexistente, contagem errada, link quebrado para pasta, `last-review` fora do frontmatter | teste de mutação |

### Pendências conhecidas

- `last-review` de contract-testing, e2e-testing e performance-testing seguia vencido — resolvido na v1.2.0.
- Não há medição de adoção por IA: o exemplo resolvido calibra a expectativa, mas não mede se uma IA com o playbook propõe testes melhores.

## v1.0.0 — 2026-07-03

Primeira versão pública: doze inegociáveis, três módulos de estratégia, quatro playbooks, um prompt.
