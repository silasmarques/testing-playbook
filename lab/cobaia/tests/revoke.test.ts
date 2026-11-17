import { assertEquals, assertThrows } from "jsr:@std/assert@1.0.13";
import { NotFound, ShareService, Store } from "../src/share.ts";

const store = new Store();
const svc = new ShareService(store, () => 1_000_000, () => "tok-compartilhado");
let token = "";

Deno.test("dono cria e revoga o link", () => {
  const doc = svc.createDoc("ana", "contrato", "texto");
  token = svc.createShare("ana", doc.id, "1h").token;
  assertEquals(svc.read(token).title, "contrato");
  svc.revoke("ana", token);
});

Deno.test("link revogado não abre", () => {
  assertThrows(() => svc.read(token), NotFound);
});
