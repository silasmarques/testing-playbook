// Pontuação determinística de uma revisão de suíte contra lab/gabarito.json.
// Testada em eval/score.test.ts — é a parte da medição que roda no CI.

import type { Gabarito } from "../lab/lib.ts";

export interface Veredicto { teste: string; veredicto: string }
export interface LacunaReportada { funcao: string; risco: string }
export interface Revisao { veredictos: Veredicto[]; lacunas: LacunaReportada[] }

export interface Placar {
  /** Testes com defeito plantado que a revisão NÃO mandou manter. */
  defeituosos: { total: number; detectados: number; perdidos: string[] };
  /** Testes bons (iscas) que a revisão condenou — falso positivo. */
  iscas: { total: number; acusadas: string[] };
  /** Veredicto dentro do conjunto aceito pelo gabarito. */
  exatos: { total: number; certos: number };
  /** Riscos sem teste eficaz que a revisão apontou. */
  lacunas: { total: number; achadas: number; perdidas: string[] };
  semVeredicto: string[];
  desconhecidos: string[];
}

/** Compara nomes sem depender de acento, caixa, aspas ou pontuação. */
export const chave = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Lê a revisão: JSON puro ou dentro de um bloco ```json. Devolve null se não der. */
export function parseRevisao(raw: string): Revisao | null {
  const candidatos = [raw, ...[...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1]!)];
  for (const c of candidatos) {
    try {
      const j = JSON.parse(c);
      if (!j || !Array.isArray(j.veredictos)) continue;
      const veredictos: Veredicto[] = [];
      for (const v of j.veredictos) {
        if (typeof v?.teste === "string" && typeof v?.veredicto === "string") veredictos.push({ teste: v.teste, veredicto: v.veredicto });
      }
      const lacunas: LacunaReportada[] = [];
      for (const l of Array.isArray(j.lacunas) ? j.lacunas : []) {
        if (typeof l?.funcao === "string") lacunas.push({ funcao: l.funcao, risco: typeof l.risco === "string" ? l.risco : "" });
      }
      return { veredictos, lacunas };
    } catch { /* próximo candidato */ }
  }
  return null;
}

export function pontuar(g: Gabarito, r: Revisao): Placar {
  const dado = new Map<string, string>();
  const conhecidos = new Set(g.testes.map((t) => chave(t.nome)));
  const desconhecidos: string[] = [];
  for (const v of r.veredictos) {
    const k = chave(v.teste);
    if (conhecidos.has(k)) dado.set(k, chave(v.veredicto));
    else desconhecidos.push(v.teste);
  }

  const placar: Placar = {
    defeituosos: { total: 0, detectados: 0, perdidos: [] },
    iscas: { total: 0, acusadas: [] },
    exatos: { total: g.testes.length, certos: 0 },
    lacunas: { total: g.lacunas.length, achadas: 0, perdidas: [] },
    semVeredicto: [],
    desconhecidos,
  };

  for (const t of g.testes) {
    const v = dado.get(chave(t.nome));
    const bom = t.defeito === "nenhum";
    if (bom) placar.iscas.total++; else placar.defeituosos.total++;
    if (v === undefined) {
      // Silêncio não é detecção: teste defeituoso sem veredicto conta como perdido.
      placar.semVeredicto.push(t.nome);
      if (!bom) placar.defeituosos.perdidos.push(t.nome);
      continue;
    }
    if (t.veredictos.includes(v)) placar.exatos.certos++;
    if (bom) { if (v !== "manter") placar.iscas.acusadas.push(t.nome); }
    else if (v !== "manter") placar.defeituosos.detectados++;
    else placar.defeituosos.perdidos.push(t.nome);
  }

  for (const l of g.lacunas) {
    const pistas = new RegExp(l.pistas, "i");
    const achou = r.lacunas.some((x) => chave(x.funcao).includes(chave(l.funcao)) && pistas.test(x.risco));
    if (achou) placar.lacunas.achadas++; else placar.lacunas.perdidas.push(`${l.id} — ${l.risco}`);
  }
  return placar;
}

export function relatorio(titulo: string, p: Placar): string {
  const pct = (n: number, d: number) => d === 0 ? "—" : `${Math.round((n / d) * 100)}%`;
  const linhas = [
    `# ${titulo}`,
    "",
    `| Medida | Resultado |`,
    `|---|---|`,
    `| Testes defeituosos detectados | ${p.defeituosos.detectados} de ${p.defeituosos.total} (${pct(p.defeituosos.detectados, p.defeituosos.total)}) |`,
    `| Testes bons condenados (falso positivo) | ${p.iscas.acusadas.length} de ${p.iscas.total} |`,
    `| Veredicto dentro do aceito | ${p.exatos.certos} de ${p.exatos.total} (${pct(p.exatos.certos, p.exatos.total)}) |`,
    `| Lacunas de risco apontadas | ${p.lacunas.achadas} de ${p.lacunas.total} |`,
    "",
  ];
  const lista = (rotulo: string, itens: string[]) => { if (itens.length) linhas.push(`**${rotulo}:**`, ...itens.map((i) => `- ${i}`), ""); };
  lista("Defeituosos que passaram como MANTER (ou ficaram sem veredicto)", p.defeituosos.perdidos);
  lista("Bons que foram condenados", p.iscas.acusadas);
  lista("Lacunas não apontadas", p.lacunas.perdidas);
  lista("Testes sem veredicto", p.semVeredicto);
  lista("Veredictos para testes que não existem na cobaia", p.desconhecidos);
  return linhas.join("\n");
}
