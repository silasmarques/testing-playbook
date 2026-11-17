// A prova do laboratório: o gabarito não é opinião. Cada bug de lab/gabarito.json é
// plantado no código da cobaia, a suíte dela roda, e os testes que falham têm de ser
// exatamente os que o gabarito diz. Roda no CI (deno task test).

import { assert, assertEquals } from "jsr:@std/assert@1.0.13";
import { aplicarMutacao, coberturaDeLinhas, copiarCobaia, gabarito, LAB_DIR, rodarSuite } from "./lib.ts";

const g = await gabarito();
const nomes = g.testes.map((t) => t.nome).sort();
/** Defeitos que tornam o teste incapaz de falhar por bug de produção. */
const INCAPAZES = new Set(["sem-assercao", "reimplementa-a-regra", "testa-o-mock", "sem-controle-positivo", "assercao-fraca", "vaidade"]);
const matadores = (nome: string) => g.mutacoes.filter((m) => m.mata.includes(nome));

Deno.test("cobaia sem mutação: a suíte inteira passa, e é a suíte do gabarito", async () => {
  const dir = await copiarCobaia();
  const r = await rodarSuite(dir);
  assertEquals(r.falharam, [], r.saida);
  assertEquals([...r.passaram].sort(), nomes, "o gabarito tem de listar exatamente os testes da cobaia");
});

for (const m of g.mutacoes) {
  Deno.test(`${m.id} — ${m.bug}: ${m.mata.length ? `pego por ${m.mata.length} teste(s)` : "nenhum teste percebe"}`, async () => {
    const dir = await copiarCobaia();
    await aplicarMutacao(dir, m);
    const r = await rodarSuite(dir);
    assertEquals(r.passaram.length + r.falharam.length, nomes.length, `a mutação quebrou a compilação?\n${r.saida}`);
    assertEquals([...r.falharam].sort(), [...m.mata].sort());
  });
}

Deno.test("gabarito coerente: veredicto, defeito e mutações contam a mesma história", () => {
  for (const t of g.testes) {
    const mata = matadores(t.nome).length;
    if (t.defeito === "nenhum") {
      assertEquals(t.veredictos, ["manter"], t.nome);
      assert(mata > 0, `"${t.nome}" está como MANTER, mas não pega nenhum bug plantado`);
    } else {
      assert(!t.veredictos.includes("manter"), `"${t.nome}" tem defeito e aceita MANTER`);
    }
    if (INCAPAZES.has(t.defeito)) assertEquals(mata, 0, `"${t.nome}" (${t.defeito}) não deveria pegar bug algum`);
  }
  for (const l of g.lacunas) {
    const m = g.mutacoes.find((x) => x.id === l.mutacao);
    assert(m, `${l.id} aponta para mutação inexistente`);
    assertEquals(m.mata, [], `${l.id} é lacuna, mas ${m.id} é pego por algum teste`);
  }
  const semTeste = g.mutacoes.filter((m) => m.mata.length === 0).map((m) => m.id).sort();
  assertEquals(g.lacunas.map((l) => l.mutacao).sort(), semTeste, "toda mutação que ninguém pega é uma lacuna, e vice-versa");
});

Deno.test("os números anunciados em lab/README.md e no README batem com a medição", async () => {
  const cobertura = Math.round(await coberturaDeLinhas(await copiarCobaia()));
  const real = {
    testes: g.testes.length,
    defeituosos: g.testes.filter((t) => t.defeito !== "nenhum").length,
    uteis: g.testes.filter((t) => matadores(t.nome).length > 0).length,
    bugs: g.mutacoes.length,
    escapam: g.lacunas.length,
    cobertura,
  };
  for (const file of [`${LAB_DIR}/README.md`, `${LAB_DIR}/../README.md`]) {
    const texto = await Deno.readTextFile(file);
    const marca = texto.match(/<!-- lab: (.*?) -->/);
    assert(marca, `${file}: falta o marcador <!-- lab: ... -->`);
    assertEquals(JSON.parse(marca[1]!), real, `${file}: marcador desatualizado`);
    const frase = `${real.testes} testes verdes, ${real.cobertura}% de cobertura de linhas, e ${real.escapam} de ${real.bugs} bugs críticos passam`;
    assert(texto.includes(frase), `${file}: não contém a frase medida — "${frase}"`);
  }
});
