/**
 * ViewModel PURO (§XI) do Consolidado ABC (HANDBOOK §2). Deriva o cabeçalho ("{ano} ABC" + "Total: R$ …") e a
 * CURVA ABC: a lista de planos por FAMÍLIA (programa) ordenada por contribuição de orçamento (desc), cada um
 * com o total e a participação (%) no total do ano — que é exatamente o que o core-api entrega em
 * `GET /budget-plans/consolidated-result`. Sem React/TanStack — testável por `node:test`.
 *
 * Reconciliação (feature 062): a versão front-first tinha uma matriz Centro de Custo × meses de placeholder;
 * o endpoint REAL não a entrega (só o resumo por programa). A matriz foi REMOVIDA (não se inventa fonte) e a
 * tela passa a mostrar a curva por programa — o dado real. Os totais podem vir 0 até existirem orçamentos por
 * rede (dependem do core-api#394): mostramos o real (planos aprovados com total 0), não o placeholder.
 */
import type { ConsolidatedAbc } from '#modules/budget-plans/client/data/model/consolidado-abc.model.ts'
import { formatCentsBRL } from '#modules/budget-plans/client/domain/calc/derive.ts'

export type ConsolidadoAbcHeader = Readonly<{
  /** "{ano} ABC" (ex.: "2026 ABC"). */
  title: string
  /** "R$ …" (total geral do ano). */
  totalLabel: string
}>

/** Uma linha da curva ABC (um programa). */
export type ConsolidadoCurveRow = Readonly<{
  id: string
  /** Sigla do programa (ex.: "PARC"). */
  program: string
  /** Nome completo do programa. */
  name: string
  /** "v{n}" da vigente. */
  versionLabel: string
  /** Total do programa formatado em BRL. */
  totalLabel: string
  /** Participação (0..100) no total do ano — largura da barra. */
  sharePct: number
  /** Participação formatada (ex.: "41,2%"). */
  shareLabel: string
}>

/** Cabeçalho do Consolidado: ano + ABC e total geral. */
export const deriveConsolidadoHeader = (result: ConsolidatedAbc): ConsolidadoAbcHeader => ({
  title: `${String(result.year)} ABC`,
  totalLabel: formatCentsBRL(result.totalInCents),
})

/** Participação (0..100) de um valor no total — 0 quando o total é 0 (evita divisão por zero). */
const shareOf = (partInCents: number, totalInCents: number): number =>
  totalInCents > 0 ? (partInCents / totalInCents) * 100 : 0

/** Formata a participação em pt-BR com 1 casa (ex.: 41.2 → "41,2%"). */
const formatShare = (pct: number): string => `${pct.toFixed(1).replace('.', ',')}%`

/**
 * Curva ABC: planos por programa ORDENADOS por contribuição (desc) — a definição da curva ABC (as maiores
 * famílias primeiro). Cada linha carrega a participação no total do ano.
 */
export const deriveConsolidadoCurve = (result: ConsolidatedAbc): readonly ConsolidadoCurveRow[] =>
  [...result.plans]
    .sort((a, b) => b.totalInCents - a.totalInCents)
    .map((p) => {
      const pct = shareOf(p.totalInCents, result.totalInCents)
      return {
        id: p.id,
        program: p.programAbbreviation,
        name: p.programName,
        versionLabel: `v${String(p.version)}`,
        totalLabel: formatCentsBRL(p.totalInCents),
        sharePct: pct,
        shareLabel: formatShare(pct),
      }
    })

/** Há resultado a exibir? (falso → view mostra "Nenhum resultado encontrado"). */
export const hasConsolidadoResult = (result: ConsolidatedAbc): boolean => result.plans.length > 0
