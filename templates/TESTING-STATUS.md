# Estado dos Testes — <nome do projeto>

> Copie este arquivo para a raiz do projeto como `TESTING-STATUS.md` e mantenha-o no git. É o registro do que a suíte prova, do que ela não prova e do que foi aceito como risco — para que a próxima estratégia de feature, a próxima revisão de suíte e a próxima pessoa (ou IA) partam de fatos, não de memória.

- **Norma adotada:** testing-playbook, versão/commit: `________`
- **Stack e como rodar a suíte:** `________` · comando: `________`
- **Motor de dados usado nos testes de integração:** `________` (o mesmo de produção? — `integration-testing` R3)

## Mapa de riscos

O que não pode quebrar. Toda estratégia de feature e toda revisão de suíte começam por esta tabela (`test-value-and-risk` P1). Revise quando entrar integração nova, meio de pagamento novo ou mudança de modelo de permissão.

| # | Risco (o bug concreto) | Impacto | Probabilidade | Teste que prova | Camada | Visto falhar em |
|---|---|---|---|---|---|---|
| 1 | Usuário B lê o recurso de A | Alto | Alta | `tests/api/ownership.test.ts` | API | AAAA-MM-DD |
| 2 | | | | **nenhum — lacuna** | | |

- **Teste que prova:** o arquivo e o nome do teste. "Tem cobertura" não vale.
- **Visto falhar em:** a data em que a regra foi quebrada de propósito e o teste ficou vermelho (inegociável 13). Em branco = nunca foi provado.
- Linha com "nenhum — lacuna" é dívida explícita: ou ganha teste, ou vai para "Riscos aceitos".

## Última revisão de suíte

| Data | Quem rodou | Escopo | Suíte (total · falhas · tempo) | Veredictos |
|---|---|---|---|---|
| AAAA-MM-DD | | suíte inteira / pasta | N · 0 · Xs | manter A · consertar B · mover C · apagar D |

- **Provados por falha nesta revisão:** quais testes de risco alto foram vistos falhar, e com que quebra.
- **Não analisado:** o que ficou de fora (pastas, E2E que não rodou localmente, etc.).
- Relatório completo: `________`

## Pendências da revisão

| # | Teste / grupo | Veredicto | Defeito | Decisão | Responsável | Prazo |
|---|---|---|---|---|---|---|
| 1 | `"usuário não lista pedidos de outro"` | consertar | sem controle positivo | acrescentar o "dono vê" | | |

## Riscos aceitos

Todo risco não testado de propósito tem dono, motivo e data de revisão (`quality-gates` R5). Sem dono, não é risco aceito — é lacuna.

| Risco | Por que não é testado | Quem aceitou | Aceito em | Revisar em |
|---|---|---|---|---|
| | | | | |

## Testes instáveis

Teste instável não é reexecutado até passar: é consertado na causa ou apagado (`test-layers` P3).

| Teste | Sintoma | Causa (espera fixa · ordem · relógio · rede) | Decisão | Desde |
|---|---|---|---|---|
| | | | | |

## Performance

Só para endpoint crítico ou caro. Sem SLO, não entra aqui (`performance-testing` R2).

| Endpoint / fluxo | SLO (de onde veio) | Threshold no teste | Tipo | Última execução |
|---|---|---|---|---|
| | | | | |

## Fora do alcance desta suíte

- [ ] Segurança (RLS, injeção, abuso de auth, prompt injection) → registrada no `SECURITY-STATUS.md` do security-playbook
- [ ] `________`

## Histórico

| Data | O que mudou |
|---|---|
| | |
