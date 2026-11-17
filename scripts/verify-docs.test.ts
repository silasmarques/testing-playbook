// Prova de que a verificação consegue falhar: cada garantia de verify-docs.ts é
// quebrada de propósito numa cópia do repo, e a verificação tem de acusar.
//   deno task test
//
// Garantia nova em verify-docs.ts entra aqui com a mutação que a derruba.

import { assert, assertEquals } from "jsr:@std/assert@1.0.13";
import { verify } from "./verify-docs.ts";

const REPO = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SKIP = new Set([".git", "node_modules", "docs", "cov"]);

async function copyDir(from: string, to: string): Promise<void> {
  await Deno.mkdir(to, { recursive: true });
  for await (const e of Deno.readDir(from)) {
    if (SKIP.has(e.name)) continue;
    if (e.isDirectory) await copyDir(`${from}/${e.name}`, `${to}/${e.name}`);
    else if (e.isFile) await Deno.copyFile(`${from}/${e.name}`, `${to}/${e.name}`);
  }
}

/** Copia o repo para <tmp>/testing-playbook e cria um repo irmão mínimo ao lado. */
async function sandbox(): Promise<string> {
  const tmp = await Deno.makeTempDir({ prefix: "tp-verify-" });
  const root = `${tmp}/testing-playbook`;
  await copyDir(REPO, root);
  await Deno.mkdir(`${tmp}/security-playbook/core`, { recursive: true });
  await Deno.writeTextFile(`${tmp}/security-playbook/SECURITY.md`, "# stub\n");
  await Deno.writeTextFile(`${tmp}/security-playbook/core/security-testing.md`, "# stub\n");
  return root;
}

async function edit(root: string, file: string, from: string | RegExp, to: string) {
  const before = await Deno.readTextFile(`${root}/${file}`);
  const after = before.replace(from, to);
  assert(after !== before, `a mutação não alterou ${file} — o trecho "${from}" mudou de lugar?`);
  await Deno.writeTextFile(`${root}/${file}`, after);
}

// Data fixa só para as mutações de data; os controles usam o relógio real, para que
// atualizar um last-review nunca quebre a suíte.
const TODAY = Date.parse("2026-11-17");

Deno.test("controle positivo: o repo como está passa sem erro", async () => {
  const root = await sandbox();
  const r = await verify(root);
  assertEquals(r.errors, []);
});

interface Mutation { name: string; expect: RegExp; strictDates?: boolean; apply: (root: string) => Promise<void> }

const MUTATIONS: Mutation[] = [
  { name: "link .md quebrado", expect: /link quebrado: TESTING\.md/,
    apply: (r) => edit(r, "TESTING.md", "(strategy/test-layers.md)", "(strategy/nao-existe.md)") },
  { name: "link para pasta inexistente", expect: /link quebrado: README\.md -> estrategia\//,
    apply: (r) => edit(r, "README.md", "(strategy/)", "(estrategia/)") },
  { name: "link para arquivo não-.md inexistente", expect: /link quebrado: README\.md .*nao-existe\.yml/,
    apply: (r) => edit(r, "README.md", "ci.yml)", "nao-existe.yml)") },
  { name: "link quebrado no LICENSE.md", expect: /link quebrado: LICENSE\.md/,
    apply: (r) => edit(r, "LICENSE.md", "(https://opensource.org/license/mit)", "(nao-existe.md)") },
  { name: "link quebrado ao security-playbook (irmão presente)", expect: /link quebrado: TESTING\.md .*security-playbook/,
    apply: (r) => edit(r, "TESTING.md", "core/security-testing.md)", "core/nao-existe.md)") },
  { name: "last-review fora do frontmatter", expect: /sem last-review válido: playbooks\/e2e-testing\.md/,
    apply: async (r) => {
      await edit(r, "playbooks/e2e-testing.md", /^last-review:.*\n/m, "");
      await edit(r, "playbooks/e2e-testing.md", /$/, "\nlast-review: 2026-07-02\n");
    } },
  { name: "last-review com data impossível", expect: /sem last-review válido: playbooks\/e2e-testing\.md/,
    apply: (r) => edit(r, "playbooks/e2e-testing.md", /^last-review:.*$/m, "last-review: 2026-13-45") },
  { name: "last-review no futuro", expect: /last-review no futuro: playbooks\/e2e-testing\.md/,
    apply: (r) => edit(r, "playbooks/e2e-testing.md", /^last-review:.*$/m, "last-review: 2030-01-01") },
  { name: "revisão vencida (modo estrito)", expect: /revisão vencida: strategy\/test-layers\.md/, strictDates: true,
    apply: (r) => edit(r, "strategy/test-layers.md", /^last-review:.*$/m, "last-review: 2020-01-01") },
  { name: "frontmatter removido", expect: /sem frontmatter no topo: strategy\/quality-gates\.md/,
    apply: (r) => edit(r, "strategy/quality-gates.md", /^---\n[\s\S]*?\n---\n/, "") },
  { name: "source que não é URL", expect: /source inválida em playbooks\/api-testing\.md/,
    apply: (r) => edit(r, "playbooks/api-testing.md", /^ {2}- https:\/\/.*$/m, "  - livro do fulano") },
  { name: "[viola Rn] com regra inexistente", expect: /referência inexistente: playbooks\/api-testing\.md cita R99/,
    apply: (r) => edit(r, "playbooks/api-testing.md", "[viola R1, R7]", "[viola R1, R99]") },
  { name: "[viola texto-livre]", expect: /referência não reconhecida: strategy\/test-value-and-risk\.md/,
    apply: (r) => edit(r, "strategy/test-value-and-risk.md", "[viola R5]", "[viola o bom senso]") },
  { name: "checklist cita regra inexistente", expect: /referência inexistente: playbooks\/e2e-testing\.md cita R42/,
    apply: (r) => edit(r, "playbooks/e2e-testing.md", "(R6)?", "(R42)?") },
  { name: "referência cruzada a regra inexistente", expect: /referência inexistente: .* cita test-layers R77/,
    apply: (r) => edit(r, "strategy/test-value-and-risk.md", "[viola test-layers R3]", "[viola test-layers R77]") },
  { name: "id de regra duplicado", expect: /id duplicado: playbooks\/contract-testing\.md define R1/,
    apply: (r) => edit(r, "playbooks/contract-testing.md", "- **R2 — MUST**", "- **R1 — MUST**") },
  { name: "README anuncia nº errado de inegociáveis", expect: /README\.md: anuncia 99 inegociáveis/,
    apply: (r) => edit(r, "README.md", /\d+ regras inegociáveis/, "99 regras inegociáveis") },
  { name: "README anuncia nº errado de playbooks", expect: /README\.md: anuncia 9 playbooks/,
    apply: (r) => edit(r, "README.md", /\d+ \[playbooks\/\]/, "9 [playbooks/]") },
  { name: "TESTING.md anuncia nº errado de prompts", expect: /TESTING\.md: anuncia 7 prompts/,
    apply: (r) => edit(r, "TESTING.md", /\d+ \[prompts\/\]/, "7 [prompts/]") },
  { name: "inegociável fora de sequência", expect: /inegociável fora de sequência/,
    apply: (r) => edit(r, "TESTING.md", /^5\. \*\*/m, "7. **") },
  { name: "módulo novo fora do roteamento", expect: /fora do roteamento: playbooks\/novo\.md/,
    apply: async (r) => {
      await Deno.writeTextFile(`${r}/playbooks/novo.md`, "---\nlast-review: 2026-11-01\n---\n\n# Novo\n\n- **R1 — MUST** existir.\n");
    } },
  { name: "link quebrado em lab/README.md", expect: /link quebrado: lab\/README\.md/,
    apply: (r) => edit(r, "lab/README.md", "(gabarito.json)", "(gabarito-nao-existe.json)") },
  { name: "TESTING.md acima do limite de linhas", expect: /TESTING\.md com \d+ linhas/,
    apply: (r) => edit(r, "TESTING.md", /$/, "\n".repeat(160)) },
];

for (const m of MUTATIONS) {
  Deno.test(`mutação detectada: ${m.name}`, async () => {
    const root = await sandbox();
    await m.apply(root);
    const r = await verify(root, { today: TODAY, strictDates: m.strictDates });
    assert(r.errors.some((e) => m.expect.test(e)), `não acusou. Erros reportados:\n${r.errors.join("\n") || "(nenhum)"}`);
  });
}

Deno.test("sem o repo irmão, link ao security-playbook é contado, não cobrado", async () => {
  const root = await sandbox();
  await Deno.remove(`${root}/../security-playbook`, { recursive: true });
  const r = await verify(root);
  assertEquals(r.errors, []);
  assert(r.info.some((i) => /NÃO conferida/.test(i)));
});

Deno.test("revisão vencida é aviso por padrão, não erro", async () => {
  const root = await sandbox();
  await edit(root, "strategy/test-layers.md", /^last-review:.*$/m, "last-review: 2020-01-01");
  const r = await verify(root);
  assertEquals(r.errors, []);
  assert(r.warnings.some((w) => /revisão vencida: strategy\/test-layers\.md/.test(w)));
});
