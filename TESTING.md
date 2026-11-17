# Testing Playbook — Norte de Testes Inteligentes

> Documento normativo de testes para os projetos que o adotam. Agnóstico de linguagem e stack. A tese: **todo teste precisa provar algo importante sobre o sistema.** Se não reduz risco, não valida regra crítica, não protege contrato, não evita regressão real e não aumenta a confiança de deploy — ele provavelmente não merece existir.
> **Para a IA:** leia este arquivo antes de propor ou escrever testes; use o Bloco 1 para decidir SE o teste vale, o Bloco 2 para saber ONDE ele vive, e reporte conforme o Bloco 4. Companheiro do [security-playbook](../security-playbook/SECURITY.md) — segurança de teste (RLS, prompt injection, abuso de auth) mora lá e é referenciada, não duplicada.
> As referências ao security-playbook são relativas e assumem os dois repos clonados como irmãos (ex.: `~/Developer/security-playbook` e `~/Developer/testing-playbook`). No GitHub, onde link relativo entre repos não resolve, use o [repositório do security-playbook](https://github.com/silasmarques/security-playbook).

---

## Bloco 1 — As Inegociáveis do teste que vale

Violar qualquer item abaixo produz teste de vaidade — número que sobe sem confiança que sobe. A etiqueta entre colchetes ao fim de cada item é só o tema da regra.

1. **Todo teste prova um risco.** Antes de escrever, responda: que bug real isto pegaria? Se a resposta é "nenhum concreto", não escreva. [gate]
2. **Confiança, não cobertura.** Cobertura é sintoma, nunca meta. 90% de cobertura de getters não vale um teste de autorização cruzada. [valor]
3. **Toda asserção é forte e específica.** Teste sem asserção, ou que "sempre passa", ou que só confirma o mock, é ruído — remova. [asserção]
4. **A camada certa para o risco certo.** Regra pura → unitário; interação real → integração; contrato de API → contract/API; jornada crítica → E2E. Não duplicar o mesmo risco em três camadas sem justificativa. [camada]
5. **Teste no nível de objeto (ownership).** Todo recurso com dono tem teste de acesso cruzado A×B — usuário B não alcança o recurso de A. É o BOLA (OWASP API #1). Segurança da checagem → [security-playbook](../security-playbook/core/security-testing.md). [risco]
6. **Caminho triste é obrigatório.** Todo controle/validação tem teste negativo: entrada inválida, ausente, no limite, do tipo errado. Só happy path não testa quase nada. [asserção]
7. **Contrato protegido.** API/integração nova tem teste de contrato (status + schema + campos obrigatórios + o que NUNCA pode vazar). Evita o "funcionava no backend, quebrou a tela". [contrato]
8. **Determinístico ou não existe.** Nada de `sleep` fixo, ordem entre testes, ou dependência de relógio/rede real sem controle. Teste instável destrói a confiança que deveria criar — estabilize o dado/ambiente antes de automatizar. [estabilidade]
9. **Threshold é o teste de performance.** "Rodar carga" sem critério de aprovação/falha (p95, taxa de erro, SLO) não prova nada. Sem threshold, não é teste — é curiosidade. [performance]
10. **Evidência, não opinião.** Todo teste tem pré-condição, ação, resultado esperado e — quando manual/exploratório — evidência registrada. Qualidade se demonstra, não se afirma. [evidência]
11. **Custo de manutenção conta contra.** Teste frágil que quebra a cada refactor legítimo é passivo. Se protege pouco e quebra muito, apague — a ausência dele é mais honesta que o falso vermelho. [valor]
12. **Regressão de bug real vira teste.** Todo bug corrigido em fluxo importante ganha um teste que falharia com o bug presente. Bug sem teste volta. [regressão]
13. **Teste que nunca falhou não prova nada.** Antes de confiar, veja o teste falhar: quebre a regra de propósito (ou escreva o teste antes do código) e confirme o vermelho. E exercite o **artefato real** — a regra como está publicada/implantada —, nunca uma cópia da regra reescrita dentro do teste: teste que reimplementa o predicado passa com a regra de produção quebrada. Teste negativo ("B não vê") exige controle positivo ("A vê"). [evidência]

## Bloco 2 — Roteamento: "vou testar X → leio Y"

| Situação | Módulo |
|---|---|
| Decidir SE um teste vale / priorizar o esforço | [strategy/test-value-and-risk.md](strategy/test-value-and-risk.md) |
| Decidir EM QUE CAMADA o teste fica | [strategy/test-layers.md](strategy/test-layers.md) |
| Definir o gate de PR / sign-off de release | [strategy/quality-gates.md](strategy/quality-gates.md) |
| Testar partes conversando (serviço+banco, fila) / decidir o que é real e o que é dublê / unitário | [playbooks/integration-testing.md](playbooks/integration-testing.md) |
| Testar um endpoint / serviço HTTP | [playbooks/api-testing.md](playbooks/api-testing.md) |
| Proteger a fronteira entre consumidor e provedor | [playbooks/contract-testing.md](playbooks/contract-testing.md) |
| Cobrir uma jornada crítica de usuário | [playbooks/e2e-testing.md](playbooks/e2e-testing.md) |
| Validar carga / latência / estabilidade sob stress | [playbooks/performance-testing.md](playbooks/performance-testing.md) |
| Testar RLS, prompt injection, abuso de auth, vazamento de secret | [security-playbook/core/security-testing.md](../security-playbook/core/security-testing.md) e módulos citados lá |
| Gerar uma estratégia de teste para uma feature | [prompts/test-strategy.md](prompts/test-strategy.md) |
| Revisar/enxugar uma suíte que já existe | [prompts/suite-review.md](prompts/suite-review.md) |
| Registrar no projeto o mapa de riscos, a última revisão e os riscos aceitos | [templates/TESTING-STATUS.md](templates/TESTING-STATUS.md) |
| Ver como fica uma boa resposta (exemplo resolvido) | [examples/test-strategy-share-link.md](examples/test-strategy-share-link.md) |

## Bloco 3 — O gate em uma frase

> **Antes de escrever o teste:** "que bug real, importante e plausível este teste pegaria — e em que camada isso custa menos para provar?" Se você não consegue nomear o bug, o teste é candidato a não existir. Detalhe em [strategy/test-value-and-risk.md](strategy/test-value-and-risk.md).

## Bloco 4 — Instruções de uso para a IA

1. **Antes de propor testes:** rode o gate do Bloco 1/3 para cada teste candidato. Descarte os de vaidade explicitamente — dizer o que NÃO vale é parte da entrega.
2. **Priorize por risco, não por facilidade.** Regra crítica, permissão, dado sensível, dinheiro e integração que costuma quebrar vêm primeiro. Cobertura nunca é o objetivo.
3. **Uma camada por risco.** Não repita o mesmo cenário em unitário + API + E2E sem justificar. Se justificar, diga por quê.
4. **Como reportar — proporcional ao pedido.** Estratégia de feature → formato completo do prompt [test-strategy.md](prompts/test-strategy.md). Revisão de suíte → formato de [suite-review.md](prompts/suite-review.md). Pergunta pontual ("vale um E2E aqui?") → resposta curta: bug nomeado, camada, veredicto e o que NÃO vale. Não despeje o relatório inteiro para uma pergunta de uma linha.
5. **Segurança:** para qualquer teste de RLS/injeção/abuso, seguir o [security-playbook](../security-playbook/SECURITY.md) — não reimplementar aqui.
6. **Não inventar:** situação não coberta → dizer e propor com base no Bloco 1, marcando o que é hipótese a validar.
7. **Registro no projeto:** se existe `TESTING-STATUS.md` na raiz, leia-o antes de propor (mapa de riscos, riscos aceitos) e atualize-o ao concluir uma estratégia ou revisão. Se não existe e o trabalho é mais que pontual, proponha criá-lo a partir de [templates/TESTING-STATUS.md](templates/TESTING-STATUS.md).
8. **Teste que você diz que passa, você rodou.** E, para teste novo, diga como o viu falhar (inegociável 13). "Deve passar" não é evidência.

---

*Estrutura: 3 módulos de [strategy/](strategy/) + 5 [playbooks/](playbooks/) + 2 [prompts/](prompts/) + 1 [exemplo resolvido](examples/test-strategy-share-link.md) + [AGENTS.md](AGENTS.md). Companheiro do [security-playbook](../security-playbook/SECURITY.md). Manutenção: ver [README.md](README.md).*
