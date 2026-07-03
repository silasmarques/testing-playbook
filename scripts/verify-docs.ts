// Verificação determinística do testing-playbook (roda no CI e localmente):
//   deno run --allow-read scripts/verify-docs.ts
//
// 1. Todo link relativo .md resolve para arquivo existente — EXCETO referências
//    cruzadas ao repo companheiro (../security-playbook/...), que só existem quando
//    os dois repos estão clonados lado a lado. Essas são apenas contadas e listadas,
//    não falham o CI (o CI roda com um repo só no runner).
// 2. Limite de tamanho: TESTING.md <= 150 linhas; módulos <= 400.
// 3. Todo módulo de strategy/ e playbooks/ tem frontmatter com last-review (data).

const errors: string[] = [];
const companionRefs: string[] = [];
const decoder = new TextDecoder();

async function read(path: string): Promise<string> {
  return decoder.decode(await Deno.readFile(path));
}

async function* mdFiles(): AsyncGenerator<string> {
  yield "TESTING.md";
  yield "README.md";
  yield "AGENTS.md";
  for (const dir of ["strategy", "playbooks", "prompts"]) {
    for await (const e of Deno.readDir(dir)) {
      if (e.isFile && e.name.endsWith(".md")) yield `${dir}/${e.name}`;
    }
  }
}

// --- 1. links relativos ---
for await (const file of mdFiles()) {
  const text = await read(file);
  const dir = file.includes("/") ? file.slice(0, file.lastIndexOf("/")) : ".";
  for (const m of text.matchAll(/\]\(([^)#\s]+\.md)(?:#[^)]*)?\)/g)) {
    const link = m[1];
    if (link.startsWith("http")) continue;
    // Referência cruzada ao repo companheiro: legítima, mas fora deste repo.
    if (link.includes("security-playbook")) { companionRefs.push(`${file} -> ${link}`); continue; }
    const target = `${dir}/${link}`;
    try {
      await Deno.stat(target);
    } catch {
      errors.push(`link quebrado: ${file} -> ${link}`);
    }
  }
}

// --- 2. limites de tamanho + 3. frontmatter last-review ---
const testingLines = (await read("TESTING.md")).split("\n").length;
if (testingLines > 150) errors.push(`TESTING.md com ${testingLines} linhas (limite ~150)`);

for (const dir of ["strategy", "playbooks"]) {
  for await (const e of Deno.readDir(dir)) {
    if (!e.isFile || !e.name.endsWith(".md")) continue;
    const path = `${dir}/${e.name}`;
    const text = await read(path);
    const n = text.split("\n").length;
    if (n > 400) errors.push(`${path} com ${n} linhas (limite ~400)`);
    if (!/^last-review:\s*\d{4}-\d{2}-\d{2}/m.test(text)) {
      errors.push(`frontmatter sem last-review válido: ${path}`);
    }
  }
}

// --- resultado ---
if (companionRefs.length) {
  console.log(`(i) ${companionRefs.length} referência(s) cruzada(s) ao security-playbook (verificadas só com os dois repos lado a lado).`);
}
if (errors.length) {
  console.error(`\nverify-docs: ${errors.length} problema(s)\n`);
  for (const e of errors) console.error(`  - ${e}`);
  Deno.exit(1);
}
console.log("verify-docs OK: links internos íntegros, limites de tamanho respeitados, frontmatter com last-review.");
