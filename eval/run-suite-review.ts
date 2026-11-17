// Mede se uma IA, usando o prompt de revisão de suíte, separa os testes bons dos
// defeituosos da cobaia (lab/cobaia) e aponta os riscos sem teste.
//
//   deno task eval                      # IA com o playbook
//   deno task eval --baseline           # IA sem o playbook (para comparar)
//   deno task eval --score revisao.json # só pontua uma revisão já feita (sem chamar IA)
//   opções: --model sonnet  --keep  --out relatorio.md
//
// NÃO roda no CI: chama o CLI `claude`, custa tokens e varia a cada execução.
// A pontuação é determinística e testada (eval/score.ts). Uma execução é uma amostra.
//
// A cobaia é copiada SEM o gabarito. O prompt usado é o próprio bloco de
// prompts/suite-review.md — a medição exercita o artefato publicado, não uma cópia.

import { copiarCobaia, gabarito, LAB_DIR } from "../lab/lib.ts";
import { parseRevisao, pontuar, relatorio } from "./score.ts";

const PLAYBOOK_DIR = LAB_DIR.replace(/\/lab$/, "");
const argv = new Map<string, string>();
for (let i = 0; i < Deno.args.length; i++) {
  const a = Deno.args[i]!;
  if (!a.startsWith("--")) continue;
  const next = Deno.args[i + 1];
  argv.set(a.slice(2), next === undefined || next.startsWith("--") ? "true" : next);
}
const g = await gabarito();

async function finish(titulo: string, raw: string | null): Promise<never> {
  const rev = raw === null ? null : parseRevisao(raw);
  const texto = rev
    ? relatorio(titulo, pontuar(g, rev))
    : `# ${titulo}\n\n**Sem resultado pontuável:** não há revisao.json legível (precisa de "veredictos": [...]).`;
  console.log(texto);
  const out = argv.get("out");
  if (out) await Deno.writeTextFile(out, texto + "\n");
  Deno.exit(rev ? 0 : 1);
}

const scoreOnly = argv.get("score");
if (scoreOnly) await finish(`Revisão de suíte — arquivo ${scoreOnly}`, await Deno.readTextFile(scoreOnly));

const baseline = argv.has("baseline");
const model = argv.get("model") ?? "sonnet";
const dir = await copiarCobaia();

const FORMATO = `
Ao final, escreva o arquivo revisao.json na raiz do projeto, com exatamente esta forma:
{
  "veredictos": [ { "teste": "<nome exato do Deno.test>", "veredicto": "manter" | "consertar" | "mover" | "apagar", "motivo": "<uma frase>" } ],
  "lacunas":    [ { "funcao": "<função de produção sem teste eficaz>", "risco": "<o bug que passaria despercebido>" } ]
}
Um item em "veredictos" para CADA teste da suíte. Rode a suíte com: deno test`;

let prompt: string;
if (baseline) {
  prompt = `Revise a suíte de testes deste projeto (pasta tests/, código em src/). Diga quais testes manter, consertar, mover ou apagar, e que riscos do código não têm teste eficaz.\n${FORMATO}`;
} else {
  const md = await Deno.readTextFile(`${PLAYBOOK_DIR}/prompts/suite-review.md`);
  const bloco = md.match(/```text\n([\s\S]*?)```/)?.[1];
  if (!bloco) throw new Error("não achei o bloco ```text em prompts/suite-review.md");
  prompt = bloco
    .replace("<caminho-do-clone>", PLAYBOOK_DIR)
    .replace(/\[pasta\/arquivos de teste[^\]]*\]/, "a suíte inteira (tests/)")
    .replace(/\[produto, stack[^\]]*\]/, "compartilhamento de documento por link com validade; TypeScript + Deno; crítico: quem pode criar, revogar, listar e ler")
    .replace("Não altere nem apague nada sem eu aprovar a lista. Primeiro o relatório.", "Não altere os testes. Pode quebrar o código de produção para provar a falha, desde que desfaça.") +
    FORMATO;
}

const bin = Deno.env.get("CLAUDE_BIN") ?? "claude";
const args = [
  "-p", prompt,
  "--output-format", "json",
  "--permission-mode", "acceptEdits",
  "--allowedTools", "Read Write Edit Glob Grep Bash(deno test:*)",
  "--model", model,
  "--append-system-prompt", "Sessão não-interativa: não faça perguntas. Conclua e escreva revisao.json com a ferramenta Write.",
];
if (!baseline) args.push("--add-dir", PLAYBOOK_DIR);

console.error(`Revisão de suíte — modelo ${model} — ${baseline ? "SEM" : "com"} playbook — cobaia em ${dir}`);
const started = Date.now();
let code: number;
try {
  code = (await new Deno.Command(bin, { args, cwd: dir, stdout: "piped", stderr: "piped" }).output()).code;
} catch (e) {
  if (!(e instanceof Deno.errors.NotFound)) throw e;
  console.error(`ERRO: CLI "${bin}" não encontrado. Defina CLAUDE_BIN, ou rode o prompt à mão numa cópia de lab/cobaia e pontue com --score.`);
  await Deno.remove(dir, { recursive: true });
  Deno.exit(127);
}

let raw: string | null = null;
try { raw = await Deno.readTextFile(`${dir}/revisao.json`); } catch { /* o agente não escreveu o arquivo */ }
if (!argv.has("keep")) await Deno.remove(dir, { recursive: true });
await finish(
  `Revisão de suíte — ${new Date().toISOString().slice(0, 16)} — modelo ${model} — ${baseline ? "sem" : "com"} playbook — ${Math.round((Date.now() - started) / 1000)}s — exit ${code}`,
  raw,
);
