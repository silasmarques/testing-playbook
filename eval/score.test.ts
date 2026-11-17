// O pontuador decide se uma revisão foi boa: ele mesmo precisa conseguir reprovar.

import { assert, assertEquals } from "jsr:@std/assert@1.0.13";
import { gabarito } from "../lab/lib.ts";
import { chave, parseRevisao, pontuar, type Revisao } from "./score.ts";

const g = await gabarito();

/** A revisão perfeita, derivada do gabarito. */
function perfeita(): Revisao {
  return {
    veredictos: g.testes.map((t) => ({ teste: t.nome, veredicto: t.veredictos[0]! })),
    lacunas: [
      { funcao: "revoke", risco: "usuário que não é o dono consegue revogar" },
      { funcao: "createShare", risco: "validade inválida (10y) não é testada de fato" },
      { funcao: "listShares", risco: "links de outro usuário podem vazar na listagem" },
    ],
  };
}

Deno.test("revisão perfeita tira nota máxima", () => {
  const p = pontuar(g, perfeita());
  assertEquals(p.defeituosos.detectados, p.defeituosos.total);
  assertEquals(p.iscas.acusadas, []);
  assertEquals(p.exatos.certos, p.exatos.total);
  assertEquals(p.lacunas.achadas, p.lacunas.total);
  assertEquals(p.semVeredicto, []);
});

Deno.test("revisão complacente (tudo MANTER) não detecta defeito nenhum", () => {
  const p = pontuar(g, { veredictos: g.testes.map((t) => ({ teste: t.nome, veredicto: "manter" })), lacunas: [] });
  assertEquals(p.defeituosos.detectados, 0);
  assertEquals(p.defeituosos.perdidos.length, p.defeituosos.total);
  assertEquals(p.lacunas.achadas, 0);
  assertEquals(p.iscas.acusadas, []);
});

Deno.test("revisão destrutiva (tudo APAGAR) é punida nas iscas, não premiada", () => {
  const p = pontuar(g, { veredictos: g.testes.map((t) => ({ teste: t.nome, veredicto: "apagar" })), lacunas: [] });
  assertEquals(p.defeituosos.detectados, p.defeituosos.total);
  assertEquals(p.iscas.acusadas.length, p.iscas.total);
  assert(p.exatos.certos < p.exatos.total);
});

Deno.test("silêncio não conta como detecção", () => {
  const p = pontuar(g, { veredictos: [], lacunas: [] });
  assertEquals(p.defeituosos.detectados, 0);
  assertEquals(p.semVeredicto.length, g.testes.length);
  assertEquals(p.exatos.certos, 0);
});

Deno.test("veredicto errado dentro dos defeituosos conta como detectado, mas não como exato", () => {
  const r = perfeita();
  const alvo = g.testes.find((t) => t.defeito === "sem-controle-positivo")!; // aceita só CONSERTAR
  r.veredictos.find((v) => v.teste === alvo.nome)!.veredicto = "apagar";
  const p = pontuar(g, r);
  assertEquals(p.defeituosos.detectados, p.defeituosos.total);
  assertEquals(p.exatos.certos, p.exatos.total - 1);
});

Deno.test("lacuna exige a função certa E o risco certo", () => {
  const r = perfeita();
  r.lacunas = [
    { funcao: "revoke", risco: "falta teste de desempenho" }, // função certa, risco errado
    { funcao: "read", risco: "outro usuário revoga o link" }, // risco certo, função errada
  ];
  assertEquals(pontuar(g, r).lacunas.achadas, 0);
});

Deno.test("nome de teste casa sem depender de acento, caixa e aspas; inventado é listado", () => {
  assertEquals(chave('"Usuário NÃO lista links de outro"'), chave("usuario nao lista links de outro"));
  const r = perfeita();
  r.veredictos.push({ teste: "teste que não existe", veredicto: "apagar" });
  assertEquals(pontuar(g, r).desconhecidos, ["teste que não existe"]);
});

Deno.test("parseRevisao lê JSON puro e JSON em bloco; recusa o resto", () => {
  const json = JSON.stringify(perfeita());
  assertEquals(parseRevisao(json)?.veredictos.length, g.testes.length);
  assertEquals(parseRevisao("Segue a revisão:\n```json\n" + json + "\n```\nfim")?.lacunas.length, 3);
  assertEquals(parseRevisao("não consegui concluir"), null);
  assertEquals(parseRevisao('{"achados": []}'), null);
});
