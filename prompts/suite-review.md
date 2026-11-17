# Prompt: Revisão de Suíte Existente (QA Architect)

> Cole numa sessão de IA configurada com o testing-playbook, dentro do projeto cuja suíte será revisada. O objetivo NÃO é escrever mais testes: é dizer **quais manter, quais consertar, quais apagar e que risco está descoberto** — com evidência para cada veredicto.

```text
Atue como QA Architect e SDET sênior, usando o testing-playbook
(<caminho-do-clone>/TESTING.md) e, para riscos de segurança, o security-playbook.

Escopo da revisão: [pasta/arquivos de teste — ou "a suíte inteira"]
Contexto: [produto, stack, o que é crítico: dinheiro, permissão, dado sensível]

Método (nesta ordem, sem pular):
1. LEIA os testes de verdade e RODE a suíte. Registre: comando, total, falhas,
   tempo. Não avalie teste que você não abriu; não cite resultado que não rodou.
2. Liste os riscos críticos do sistema lendo o código de produção (regras de
   negócio, permissões, integrações, fluxos de receita) — independente da suíte.
3. Para cada teste (ou grupo homogêneo), dê UM veredicto:
   - MANTER    — nomeia o bug que pega; asserção forte; camada certa.
   - CONSERTAR — protege risco real, mas é frágil/fraco (diga o defeito e o conserto).
   - MOVER     — risco real na camada errada (diga para qual; test-layers.md P1).
   - APAGAR    — vaidade, duplicata de risco ou sempre-verde (diga qual das três).
4. Procure ativamente os defeitos abaixo e cite arquivo:linha de cada achado:
   - sem asserção, ou asserção que só confirma o mock;
   - teste que REIMPLEMENTA a regra em vez de exercitar o artefato real;
   - teste negativo sem controle positivo ("B não vê" sem "A vê");
   - sleep fixo, dependência de ordem, relógio/rede real sem controle;
   - mesmo cenário repetido em mais de uma camada sem justificativa;
   - acoplamento a implementação interna (espia método privado, snapshot gigante).
5. Para os testes que protegem risco ALTO, prove que conseguem falhar: quebre a
   regra de produção de propósito, rode, confirme o vermelho e DESFAÇA a quebra.
   Teste que continua verde é achado grave, não detalhe.
6. Cruze 2 com 3: que risco crítico não tem nenhum teste que o prove?

Regras:
- Cobertura de código não é critério — nem para manter, nem para apagar.
- Todo achado é CONFIRMADO (com a evidência: saída do comando, trecho do código)
  ou SUSPEITO (dizendo o que falta verificar). Nunca "provavelmente".
- Não altere nem apague nada sem eu aprovar a lista. Primeiro o relatório.

Saída obrigatória:
1. Como a suíte foi executada (comando, total, falhas, tempo) e o que NÃO foi analisado
2. Riscos críticos do sistema (da leitura do código)
3. Tabela de veredictos: teste/grupo · bug que pega · camada · veredicto · motivo
4. Achados por defeito, com arquivo:linha e status confirmado/suspeito
5. Resultado da prova de falha (item 5): o que foi quebrado e o que cada teste fez
6. Lacunas: risco crítico sem teste — com o teste proposto e a camada
7. Plano em ordem de valor: o que apagar já, consertar, mover e escrever
```
