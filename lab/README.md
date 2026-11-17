# Laboratório — a suíte-cobaia

> [cobaia/](cobaia/) é um projeto pequeno (compartilhar documento por link) com uma suíte de testes **ruim de propósito**. Existe para responder com evidência, e não com opinião, a duas perguntas: "suíte verde com cobertura alta prova alguma coisa?" e "uma revisão de suíte feita com o playbook separa o teste que vale do que não vale?". **Não use os testes daqui como exemplo.**

## O que a cobaia demonstra

<!-- lab: {"testes":14,"defeituosos":11,"uteis":5,"bugs":8,"escapam":3,"cobertura":96} -->

**14 testes verdes, 96% de cobertura de linhas, e 3 de 8 bugs críticos passam sem nenhum teste perceber.** Dos 14 testes, só 5 falham diante de algum dos bugs; 11 têm defeito plantado.

Os três bugs que escapam são de permissão e de validação — "qualquer usuário revoga o link de outro", "listagem devolve links de todos", "validade inválida vira link de dez anos". Dois deles **têm teste com o nome certo**, que simplesmente não consegue falhar. É a tese do playbook em miniatura: cobertura mede linha executada, não risco provado.

## O que tem plantado

[gabarito.json](gabarito.json) registra, para cada teste, o defeito e o veredicto aceitável:

| Defeito plantado | O que é | Veredicto |
|---|---|---|
| sem asserção | chama o código e não afirma nada | apagar ou consertar |
| reimplementa a regra | recalcula a regra dentro do teste; nunca chama a de produção | apagar ou consertar |
| testa o mock | afirma o retorno de um objeto criado no próprio teste | apagar |
| sem controle positivo | "B não vê" sem antes garantir que há algo para ver | consertar |
| asserção fraca | a asserção fica num caminho que pode não executar | consertar |
| duplicata | mesmo cenário de outro teste, sem acrescentar faceta | apagar |
| vaidade | nenhum bug importante e plausível | apagar |
| relógio real / espera fixa | depende do tempo do sistema | apagar ou consertar |
| acoplado à implementação | compara a estrutura interna inteira | consertar ou apagar |
| dependência de ordem | só passa depois do teste anterior | consertar |
| **nenhum (isca)** | teste bom — **não** pode ser condenado | manter |

Além disso, 8 **bugs** (mutações do código de produção) com a lista dos testes que cada um derruba, e 3 **lacunas**: riscos críticos sem teste eficaz.

## A prova (roda no CI)

`deno task lab` executa [prova.test.ts](prova.test.ts):

1. A suíte da cobaia passa inteira, e é exatamente a suíte do gabarito.
2. Cada bug é plantado numa cópia; os testes que falham têm de ser **exatamente** os que o gabarito lista — nem um a mais, nem um a menos.
3. Coerência: todo teste marcado "manter" pega ao menos um bug; todo teste "incapaz de falhar" não pega nenhum; toda lacuna é um bug que ninguém pega.
4. Os números deste README são os medidos, incluindo a cobertura.

Ou seja: o veredicto do gabarito é demonstrado por execução. Não é opinião.

## A medição com IA (fora do CI)

[../eval/run-suite-review.ts](../eval/run-suite-review.ts) copia a cobaia **sem o gabarito**, entrega a uma IA o prompt de [revisão de suíte](../prompts/suite-review.md) e pontua a resposta:

```bash
deno task eval                       # com o playbook
deno task eval --baseline            # sem o playbook, para comparar
deno task eval --score revisao.json  # pontua uma revisão feita à mão em qualquer IA
```

Como ler: **defeituosos detectados** (quanto do problema foi visto), **bons condenados** (falso positivo — uma revisão que manda apagar tudo não ganha), **veredicto dentro do aceito** e **lacunas apontadas**. A pontuação é determinística e testada ([../eval/score.test.ts](../eval/score.test.ts)); a resposta da IA não é — uma execução é uma amostra, não um resultado.

## Limites

- **A medição com IA ainda não foi executada.** O disparo depende do CLI `claude`; nenhum resultado é anunciado aqui até existir um.
- A cobaia é pequena e sem banco: prova qualidade de teste, não escolha de camada nem integração real.
- Gabarito e cobaia foram escritos juntos. A prova garante que são coerentes entre si e com a execução, não que cobrem todo tipo de teste ruim.
- O casamento de lacunas é por função + palavras-chave: pode perder uma lacuna descrita com outras palavras. Leia a resposta antes de concluir.

## Regra do laboratório

Defeito novo que a revisão deva reconhecer entra **primeiro** aqui — plantado na cobaia e registrado no gabarito, com a mutação que o comprova. A cobaia não leva comentário que entregue o defeito: ela é usada para avaliar agentes às cegas.
