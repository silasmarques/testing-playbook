---
last-review: 2026-11-17
sources:
  - https://martinfowler.com/bliki/IntegrationTest.html
  - https://martinfowler.com/bliki/TestDouble.html
  - https://martinfowler.com/articles/mocksArentStubs.html
  - https://kentcdodds.com/blog/write-tests
  - https://testcontainers.com/getting-started/
---

# Testar Integração e Unidade (o que é real, o que é dublê)

> É a camada que carrega o maior peso da suíte — e a que mais se estraga em silêncio, porque basta um mock a mais para o teste parar de integrar. A pergunta central aqui não é "como escrevo o teste", é **"o que precisa ser real para este teste provar o risco?"**. Vocabulário ([Fowler](https://martinfowler.com/bliki/IntegrationTest.html)): integração **estreita** = o meu código + a coisa real com que ele fala diretamente (banco, fila), com dublê do resto; **ampla** = todos os serviços no ar (isso é E2E, outro playbook). Este módulo trata da estreita e do unitário. Agnóstico: exemplos em pseudocódigo.

## Regras

- **R1 — MUST** a parte cujo comportamento **é o risco** roda de verdade. Se o bug nomeado é "a consulta devolve registro de outro dono", o banco é real; se é "a mensagem não entra na fila", a fila é real. Dublar justamente a parte arriscada produz um teste que não pode falhar pelo motivo que o justifica.
- **R2 — MUST** dublar só a borda que você **não controla ou não consegue tornar determinística**: serviço de terceiro, relógio, aleatoriedade, rede externa. O que é seu e barato de subir, sobe.
- **R3 — NEVER** substituir o motor de dados por outro "parecido" (banco em memória de outro fabricante) para provar comportamento que depende do motor: constraint, tipo, transação, política de acesso, ordenação. O substituto se comporta de forma ligeiramente diferente — e a diferença é exatamente onde o bug mora. Use o mesmo motor de produção, descartável (contêiner, instância efêmera, banco embarcado do mesmo motor).
- **R4 — MUST** afirmar **estado ou efeito observável** (o que ficou gravado, o que foi devolvido), não a sequência de chamadas internas. Verificar chamada só quando a chamada **é** o efeito: e-mail enviado, evento publicado, cobrança solicitada. Teste que confere "chamou o método X" quebra em refactor legítimo e passa com resultado errado.
- **R5 — MUST** cada teste semeia o próprio dado e fica isolado dos outros: transação revertida ao fim, banco/schema por teste, ou identificadores únicos. Nenhum teste depende de registro criado por outro nem de ordem de execução.
- **R6 — MUST** o dublê de serviço externo é **fiel ao real e mantido assim**: nasce de uma resposta real capturada e é conferido por contrato (`contract-testing.md` P3). Dublê escrito de memória diverge do provedor e dá verde falso.
- **R7 — MUST** tempo e aleatoriedade entram por **injeção** (relógio e gerador controláveis pelo teste). Regra de expiração, janela ou sorteio testada com o relógio real é instável por construção.
- **R8 — SHOULD** lógica pura com muitas bordas vai para **unitário em tabela de casos**. Se para testar um cálculo é preciso subir infraestrutura, extraia o cálculo — o teste lento é sintoma de regra enterrada em código de I/O.

## Padrões prontos

### P1 — Decidir o que é real (uma pergunta por dependência)

```text
Para cada dependência do código sob teste:

  O comportamento DELA faz parte do bug nomeado?
    sim → REAL (mesmo motor de produção, descartável).            (R1, R3)
    não ↓
  Eu controlo e consigo subir de forma determinística e barata?
    sim → REAL de preferência; dublê só se o custo for desproporcional.
    não ↓
  É serviço de terceiro / relógio / aleatoriedade / rede externa?
    → DUBLÊ na borda, fiel e conferido por contrato.              (R2, R6, R7)
```

### P2 — Qual dublê (vocabulário de Meszaros/Fowler)

| Dublê | O que é | Use quando |
|---|---|---|
| **Fake** | Implementação que funciona, com atalho (ex.: armazenamento em memória **da sua própria interface**) | A dependência é sua, lenta, e o risco NÃO está nela |
| **Stub** | Devolve resposta pronta | Precisa forçar um cenário: timeout, 5xx, resposta vazia, payload no limite |
| **Spy** | Stub que registra como foi chamado | A chamada é o efeito e você afirma depois (e-mail, evento) |
| **Mock** | Já nasce com a expectativa das chamadas | Raro. Acopla o teste ao "como"; prefira spy + asserção explícita |
| **Dummy** | Só preenche parâmetro | O argumento é irrelevante para o cenário |

### P3 — Teste de integração estreita (pseudocódigo neutro)

```text
teste "listagem devolve só os documentos do dono":
  # arrange — banco real (mesmo motor de produção), dado semeado por este teste
  ana   = criar_usuario()                 # ids únicos; nada compartilhado  (R5)
  bruno = criar_usuario()
  doc_a = inserir_documento(dono=ana,   titulo="da ana")
  doc_b = inserir_documento(dono=bruno, titulo="do bruno")
  # act — o código de produção de verdade, sem dublê no caminho da consulta (R1)
  resultado = repositorio.listar_documentos(usuario=ana)
  # assert — estado observável; controle positivo antes do negativo        (R4)
  esperar ids(resultado) contém doc_a.id       # ana vê o que é dela
  esperar ids(resultado) NÃO contém doc_b.id   # e não vê o do bruno
  # cleanup — transação revertida ou dados removidos por este teste        (R5)
```

### P4 — Unitário em tabela de casos (lógica pura, relógio injetado)

```text
teste "link de compartilhamento expira" para cada caso:
  | criado_em          | agora              | validade | esperado |
  | 2026-01-01 10:00   | 2026-01-01 10:59   | 1h       | válido   |
  | 2026-01-01 10:00   | 2026-01-01 11:00   | 1h       | expirado |   ← a borda
  | 2026-01-01 10:00   | 2026-01-01 09:00   | 1h       | inválido |   ← relógio atrás
  | 2026-01-01 10:00   | 2026-01-01 10:00   | 0        | expirado |

  relogio = relogio_fixo(agora)                       # injetado, nunca o real (R7)
  esperar link_valido(criado_em, validade, relogio) == esperado
```

## Anti-padrões

```text
❌ Repositório testado com o banco dublado. [viola R1]
   O risco é a consulta. Com o banco falso, a consulta errada passa.

❌ Banco em memória de outro motor "porque é mais rápido". [viola R3]
   Constraint, tipo e política de acesso diferem. Verde no teste, erro em produção.

❌ esperar(servico.salvar).foi_chamado_com(...) como única asserção. [viola R4]
   Prova que o código chamou algo, não que o dado ficou certo.

❌ Stub da API de terceiro escrito de memória, nunca conferido. [viola R6]
   O provedor mudou o campo; o stub não. A suíte segue verde, a integração quebrou.

❌ Teste de expiração com sleep ou com o relógio do sistema. [viola R7]
   Lento, e falha quando roda perto da virada. Injete o tempo.

❌ Subir banco e servidor para testar um cálculo de desconto. [viola R8]
   Extraia a regra; teste em tabela de casos, em milissegundos.
```

## Checklist

- [ ] A parte que é o risco roda de verdade, no mesmo motor de produção (R1, R3)?
- [ ] Só a borda não controlada está dublada (R2)?
- [ ] As asserções são sobre estado/efeito, não sobre chamadas internas (R4)?
- [ ] Cada teste semeia e isola o próprio dado, sem ordem (R5)?
- [ ] Dublê de serviço externo é fiel e conferido por contrato (R6)?
- [ ] Tempo e aleatoriedade são injetados (R7)?
- [ ] Lógica pura com bordas está em unitário de tabela, sem infraestrutura (R8)?
