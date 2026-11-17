import { assert, assertEquals, assertThrows } from "jsr:@std/assert@1.0.13";
import { isLinkValid, NotFound, type Share, ShareService, Store, TTL } from "../src/share.ts";

const HORA = 3_600_000;

function novo(agora = 1_000_000) {
  const relogio = { agora };
  let n = 0;
  const store = new Store();
  const svc = new ShareService(store, () => relogio.agora, () => `tok-${++n}`);
  return { svc, store, relogio };
}

Deno.test("cria link sem erro", () => {
  const { svc } = novo();
  const doc = svc.createDoc("ana", "contrato", "texto");
  svc.createShare("ana", doc.id, "1h");
});

Deno.test("dono cria link e outro usuário não consegue", () => {
  const { svc, store } = novo();
  const doc = svc.createDoc("ana", "contrato", "texto");
  const share = svc.createShare("ana", doc.id, "1h");
  assertEquals(share.docId, doc.id);
  assertThrows(() => svc.createShare("bruno", doc.id, "1h"), NotFound);
  assertEquals(store.shares.size, 1);
});

Deno.test("usuário sem permissão não compartilha", () => {
  const { svc } = novo();
  const doc = svc.createDoc("ana", "contrato", "texto");
  assertThrows(() => svc.createShare("bruno", doc.id, "1h"), NotFound);
});

Deno.test("link expira depois da validade", () => {
  const criadoEm = 1_000_000;
  const validade = TTL["1h"]!;
  const agora = criadoEm + validade + 1;
  const expirado = !(agora - criadoEm < validade);
  assert(expirado);
});

Deno.test("validade do link em tabela de casos", () => {
  const base: Share = { token: "t", docId: "d", createdAt: 10 * HORA, ttlMs: HORA, revoked: false };
  const casos: Array<[string, number, boolean]> = [
    ["no instante da criação", 10 * HORA, true],
    ["um milissegundo antes de vencer", 11 * HORA - 1, true],
    ["exatamente na validade", 11 * HORA, false],
    ["depois da validade", 12 * HORA, false],
    ["relógio atrás da criação", 9 * HORA, false],
  ];
  for (const [nome, agora, esperado] of casos) {
    assertEquals(isLinkValid(base, agora), esperado, nome);
  }
});

Deno.test("link expira de verdade", async () => {
  const share: Share = { token: "t", docId: "d", createdAt: Date.now(), ttlMs: 20, revoked: false };
  await new Promise((r) => setTimeout(r, 60));
  assertEquals(isLinkValid(share, Date.now()), false);
});

Deno.test("leitura pelo link devolve só título e conteúdo", () => {
  const { svc } = novo();
  const doc = svc.createDoc("ana", "contrato", "texto secreto");
  const share = svc.createShare("ana", doc.id, "1h");
  const lido = svc.read(share.token);
  assertEquals(lido, { title: "contrato", content: "texto secreto" });
  assertEquals(Object.keys(lido).sort(), ["content", "title"]);
});

Deno.test("serviço de leitura responde", () => {
  const falso = { read: (_token: string) => ({ title: "contrato", content: "texto" }) };
  assertEquals(falso.read("qualquer").title, "contrato");
});

Deno.test("createShare grava o registro no store", () => {
  const { svc, store } = novo(5_000);
  const doc = svc.createDoc("ana", "contrato", "texto");
  svc.createShare("ana", doc.id, "24h");
  assertEquals([...store.shares.entries()], [
    ["tok-1", { token: "tok-1", docId: "d-1", createdAt: 5_000, ttlMs: 86_400_000, revoked: false }],
  ]);
});

Deno.test("usuário não lista links de outro", () => {
  const { svc } = novo();
  svc.createDoc("ana", "contrato", "texto");
  assertEquals(svc.listShares("bruno").length, 0);
});

Deno.test("validade fora da lista é recusada", () => {
  const { svc } = novo();
  const doc = svc.createDoc("ana", "contrato", "texto");
  try {
    svc.createShare("ana", doc.id, "10y");
  } catch (e) {
    assert(e instanceof Error);
  }
});

Deno.test("existem três validades", () => {
  assertEquals(Object.keys(TTL).length, 3);
});
