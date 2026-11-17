// Peças do laboratório: copiar a cobaia, aplicar uma mutação e rodar a suíte dela.

export const LAB_DIR = new URL(".", import.meta.url).pathname.replace(/\/$/, "");

export interface Teste { nome: string; defeito: string; veredictos: string[]; nota: string }
export interface Mutacao { id: string; bug: string; de: string; para: string; mata: string[] }
export interface Lacuna { id: string; mutacao: string; funcao: string; risco: string; pistas: string }
export interface Gabarito { testes: Teste[]; mutacoes: Mutacao[]; lacunas: Lacuna[] }

export async function gabarito(): Promise<Gabarito> {
  return JSON.parse(await Deno.readTextFile(`${LAB_DIR}/gabarito.json`));
}

async function copyDir(from: string, to: string): Promise<void> {
  await Deno.mkdir(to, { recursive: true });
  for await (const e of Deno.readDir(from)) {
    if (e.isDirectory) await copyDir(`${from}/${e.name}`, `${to}/${e.name}`);
    else await Deno.copyFile(`${from}/${e.name}`, `${to}/${e.name}`);
  }
}

/** Cópia descartável da cobaia — só o projeto; o gabarito nunca vai junto. */
export async function copiarCobaia(): Promise<string> {
  const dir = await Deno.makeTempDir({ prefix: "tp-cobaia-" });
  await copyDir(`${LAB_DIR}/cobaia`, dir);
  return dir;
}

export async function aplicarMutacao(dir: string, m: Mutacao): Promise<void> {
  const path = `${dir}/src/share.ts`;
  const before = await Deno.readTextFile(path);
  if (before.split(m.de).length !== 2) throw new Error(`${m.id}: o trecho "de" precisa aparecer exatamente uma vez no código da cobaia`);
  await Deno.writeTextFile(path, before.replace(m.de, m.para));
}

export interface Execucao { passaram: string[]; falharam: string[]; saida: string }

/** Roda a suíte da cobaia em `dir` e devolve o resultado por nome de teste. */
export async function rodarSuite(dir: string, extra: string[] = []): Promise<Execucao> {
  const out = await new Deno.Command(Deno.execPath(), {
    args: ["test", "--no-lock", ...extra, "."],
    cwd: dir,
    env: { NO_COLOR: "1" },
    stdout: "piped",
    stderr: "piped",
  }).output();
  const saida = new TextDecoder().decode(out.stdout) + new TextDecoder().decode(out.stderr);
  const passaram: string[] = [], falharam: string[] = [];
  for (const m of saida.matchAll(/^(.+?) \.\.\. (ok|FAILED)\b/gm)) (m[2] === "ok" ? passaram : falharam).push(m[1]!);
  return { passaram, falharam, saida };
}

/** Cobertura de linhas (%) da suíte da cobaia, medida pelo próprio Deno. */
export async function coberturaDeLinhas(dir: string): Promise<number> {
  await rodarSuite(dir, ["--coverage=cov"]);
  const out = await new Deno.Command(Deno.execPath(), { args: ["coverage", "cov"], cwd: dir, env: { NO_COLOR: "1" }, stdout: "piped", stderr: "piped" }).output();
  const texto = new TextDecoder().decode(out.stdout);
  const linha = texto.match(/^\|\s*All files\s*\|\s*[\d.]+\s*\|\s*[\d.]+\s*\|\s*([\d.]+)\s*\|/m);
  if (!linha) throw new Error(`não consegui ler a cobertura:\n${texto}`);
  return Number(linha[1]);
}
