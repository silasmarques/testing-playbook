// Verificação determinística do testing-playbook (CI e local):
//   deno task docs            (ou: deno run --allow-read scripts/verify-docs.ts [--strict-dates])
//
// 1. Todo link relativo (arquivo OU pasta) aponta para algo que existe. Links ao repo
//    companheiro (../security-playbook/...) são conferidos quando ele está clonado ao
//    lado; sem ele (caso do runner de CI), são apenas contados.
// 2. Frontmatter dos módulos: bloco no topo, `last-review` válido, `sources` http(s).
// 3. Regras: ids Rn/Pn sem duplicata; toda referência ("[viola R3]", "(R1, R7)",
//    "test-layers R3") aponta para regra/padrão que existe.
// 4. Inegociáveis numeradas em sequência; contagens anunciadas batem com o que existe.
// 5. Todo módulo e prompt está no roteamento do TESTING.md (nada órfão).
// 6. Limites de tamanho. Cadência de revisão: aviso; com --strict-dates, erro.
//
// As garantias acima são provadas em scripts/verify-docs.test.ts, que quebra cada uma
// de propósito e exige que esta verificação acuse.

export interface Result { errors: string[]; warnings: string[]; info: string[]; summary: string }
export interface Options { strictDates?: boolean; today?: number }

const MODULE_DIRS = ["strategy", "playbooks"] as const;
const DOC_DIRS = ["strategy", "playbooks", "prompts", "examples"] as const;
/** Pastas cujos .md têm os links conferidos, mas que não entram no roteamento do TESTING.md. */
const LINK_ONLY_DIRS = ["lab"] as const;
/** Dias até a revisão vencer: playbooks trimestral (+30 de folga); strategy anual. */
const REVIEW_LIMIT: Record<string, number> = { playbooks: 120, strategy: 400 };

const exists = async (p: string) => { try { await Deno.stat(p); return true; } catch { return false; } };

/** Troca blocos de código por linhas vazias: link dentro de exemplo não é da doc. */
const prose = (md: string) => md.replace(/```[\s\S]*?```/g, (b) => "\n".repeat(b.split("\n").length - 1));

async function mdIn(root: string, dir: string): Promise<string[]> {
  const out: string[] = [];
  for await (const e of Deno.readDir(dir === "." ? root : `${root}/${dir}`)) {
    if (e.isFile && e.name.endsWith(".md")) out.push(dir === "." ? e.name : `${dir}/${e.name}`);
  }
  return out.sort();
}

export async function verify(root: string, opts: Options = {}): Promise<Result> {
  const errors: string[] = [], warnings: string[] = [], info: string[] = [];
  const today = opts.today ?? Date.now();

  const files = await mdIn(root, ".");
  for (const d of [...DOC_DIRS, ...LINK_ONLY_DIRS]) files.push(...await mdIn(root, d));
  const texts = new Map<string, string>();
  for (const f of files) texts.set(f, await Deno.readTextFile(`${root}/${f}`));

  // --- 1. links relativos ---
  const companionPresent = await exists(`${root}/../security-playbook/SECURITY.md`);
  let companionRefs = 0;
  for (const [file, text] of texts) {
    const dir = file.includes("/") ? file.slice(0, file.lastIndexOf("/")) : ".";
    for (const m of prose(text).matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1]!.split("#")[0]!;
      if (!target || /^(https?:|mailto:)/.test(target)) continue;
      if (target.includes("security-playbook")) {
        companionRefs++;
        if (!companionPresent) continue;
      }
      if (!(await exists(`${root}/${dir}/${target}`))) errors.push(`link quebrado: ${file} -> ${m[1]}`);
    }
  }
  if (companionRefs) {
    info.push(companionPresent
      ? `${companionRefs} referência(s) ao security-playbook conferida(s) (repo irmão presente).`
      : `${companionRefs} referência(s) ao security-playbook NÃO conferida(s): repo irmão ausente.`);
  }

  // --- 2. frontmatter + 3a. ids de regra ---
  interface Module { path: string; name: string; ids: Set<string>; review: string | null }
  const modules = new Map<string, Module>();
  for (const dir of MODULE_DIRS) {
    for (const path of await mdIn(root, dir)) {
      const text = texts.get(path)!;
      const fm = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
      if (fm === undefined) errors.push(`sem frontmatter no topo: ${path}`);
      const review = fm?.match(/^last-review:\s*(\d{4}-\d{2}-\d{2})\s*$/m)?.[1] ?? null;
      if (!review || Number.isNaN(Date.parse(review))) errors.push(`frontmatter sem last-review válido: ${path}`);
      const src = fm?.match(/^sources:\s*\n((?:\s+-.*\n?)*)/m);
      if (fm !== undefined && /^sources:/m.test(fm)) {
        const items = (src?.[1] ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
        if (items.length === 0) errors.push(`sources vazio: ${path}`);
        for (const it of items) if (!/^-\s+https?:\/\/\S+$/.test(it)) errors.push(`source inválida em ${path}: ${it}`);
      }
      const ids = new Set<string>();
      const found = [
        ...[...text.matchAll(/^- \*\*(R\d+) — /gm)].map((m) => m[1]!),
        ...[...text.matchAll(/^### (P\d+) — /gm)].map((m) => m[1]!),
      ];
      for (const id of found) {
        if (ids.has(id)) errors.push(`id duplicado: ${path} define ${id} mais de uma vez`);
        ids.add(id);
      }
      if (![...ids].some((i) => i.startsWith("R"))) errors.push(`módulo sem regras (Rn): ${path}`);
      const name = path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "");
      modules.set(name, { path, name, ids, review: Number.isNaN(Date.parse(review ?? "")) ? null : review });
    }
  }

  // --- 3b. referências a regras ---
  const names = [...modules.keys()].sort((a, b) => b.length - a.length).join("|");
  const crossRe = new RegExp("(?<![\\w/-])`?(" + names + ")(?:\\.md)?`?\\s+([RP]\\d+)", "g");
  for (const [file, text] of texts) {
    const own = [...modules.values()].find((m) => m.path === file);
    const ownCheck = (id: string, ctx: string) => {
      if (own && !own.ids.has(id)) errors.push(`referência inexistente: ${file} cita ${id} (${ctx})`);
    };
    // "módulo Rn" em qualquer arquivo
    for (const m of text.matchAll(crossRe)) {
      if (!modules.get(m[1]!)!.ids.has(m[2]!)) errors.push(`referência inexistente: ${file} cita ${m[1]} ${m[2]}`);
    }
    if (!own) continue;
    // "[viola R1, R7]" / "[viola test-layers R3]"
    for (const m of text.matchAll(/\[viola ([^\]]+)\]/g)) {
      for (const part of m[1]!.split(/[,;]/).map((p) => p.trim())) {
        if (/^[RP]\d+$/.test(part)) ownCheck(part, m[0]);
        else if (!new RegExp(`^\`?(?:${names})(?:\\.md)?\`? [RP]\\d+$`).test(part)) {
          errors.push(`referência não reconhecida: ${file} ${m[0]} — use "Rn" ou "<módulo> Rn"`);
        }
      }
    }
    // "(R1, R7)" / "(R4/R5)" / "(P1)"
    for (const m of text.matchAll(/\(((?:[RP]\d+)(?:\s*[,/]\s*[RP]\d+)*)\)/g)) {
      for (const id of m[1]!.split(/\s*[,/]\s*/)) ownCheck(id, m[0]);
    }
  }

  // --- 4. inegociáveis e contagens ---
  const testing = texts.get("TESTING.md") ?? "";
  const b1 = testing.slice(testing.indexOf("## Bloco 1"), testing.indexOf("## Bloco 2"));
  const rules = [...b1.matchAll(/^(\d+)\. \*\*/gm)].map((m) => Number(m[1]));
  if (rules.length === 0) errors.push("TESTING.md: Bloco 1 sem inegociáveis");
  rules.forEach((n, i) => { if (n !== i + 1) errors.push(`TESTING.md: inegociável fora de sequência (esperado ${i + 1}, achado ${n})`); });
  const count = (dir: string) => files.filter((f) => f.startsWith(`${dir}/`)).length;
  const expected = { rules: rules.length, strategy: count("strategy"), playbooks: count("playbooks"), prompts: count("prompts") };
  const expectCount = (file: string, re: RegExp, n: number, what: string, required = true) => {
    const all = [...(texts.get(file) ?? "").matchAll(re)];
    if (all.length === 0 && required) errors.push(`${file}: não anuncia a contagem de ${what}`);
    for (const m of all) if (Number(m[1]) !== n) errors.push(`${file}: anuncia ${m[1]} ${what}, mas existem ${n}`);
  };
  for (const f of ["README.md", "TESTING.md"]) {
    expectCount(f, /(\d+) (?:regras )?inegociáveis/gi, expected.rules, "inegociáveis", f === "README.md");
    expectCount(f, /(\d+) módulos (?:de estratégia|(?:de )?\[strategy\/\])/g, expected.strategy, "módulos de strategy");
    expectCount(f, /(\d+) (?:\[playbooks\/\]|playbooks de camada)/g, expected.playbooks, "playbooks");
    expectCount(f, /(\d+) (?:\[prompts?\/?\]|prompts? prontos?)/g, expected.prompts, "prompts");
  }

  // --- 5. roteamento completo ---
  const b2 = testing.slice(testing.indexOf("## Bloco 2"), testing.indexOf("## Bloco 3"));
  for (const f of files) {
    if (DOC_DIRS.some((d) => f.startsWith(`${d}/`)) && !b2.includes(`(${f})`)) errors.push(`fora do roteamento: ${f} não aparece no Bloco 2 do TESTING.md`);
  }

  // --- 6. tamanho e cadência ---
  const lines = (f: string) => (texts.get(f) ?? "").split("\n").length;
  if (lines("TESTING.md") > 150) errors.push(`TESTING.md com ${lines("TESTING.md")} linhas (limite 150 — é o arquivo que sempre vai para o contexto)`);
  for (const mod of modules.values()) {
    if (lines(mod.path) > 400) errors.push(`${mod.path} com ${lines(mod.path)} linhas (limite 400)`);
    if (!mod.review) continue;
    const age = Math.floor((today - Date.parse(mod.review)) / 86_400_000);
    const limit = REVIEW_LIMIT[mod.path.split("/")[0]!]!;
    if (age < 0) errors.push(`last-review no futuro: ${mod.path} (${mod.review})`);
    else if (age > limit) (opts.strictDates ? errors : warnings).push(`revisão vencida: ${mod.path} revisado há ${age} dias (limite ${limit})`);
  }

  const summary = `${files.length} arquivos, ${modules.size} módulos (${expected.strategy} strategy + ${expected.playbooks} playbooks), ` +
    `${expected.prompts} prompts, ${expected.rules} inegociáveis`;
  return { errors, warnings, info, summary };
}

if (import.meta.main) {
  const r = await verify(".", { strictDates: Deno.args.includes("--strict-dates") });
  for (const i of r.info) console.log(`  (i) ${i}`);
  for (const w of r.warnings) console.warn(`  aviso: ${w}`);
  if (r.errors.length) {
    console.error(`verify-docs: ${r.errors.length} problema(s)\n`);
    for (const e of r.errors) console.error(`  - ${e}`);
    Deno.exit(1);
  }
  console.log(`verify-docs OK: ${r.summary}; links, frontmatter, referências, contagens e roteamento conferidos.`);
}
