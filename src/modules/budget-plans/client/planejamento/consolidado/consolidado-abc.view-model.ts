/**
 * ViewModel PURO (§XI) do Consolidado ABC (HANDBOOK §2). Deriva o cabeçalho: "{ano} ABC" + "Total: R$ …" +
 * o subtotal do programa filtrado. Sem React/TanStack — testável por `node:test`.
 *
 * **Histórico, porque explica o que NÃO está aqui:** a versão front-first tinha uma matriz Centro × meses de
 * placeholder. Ao ligar o endpoint real (062), a matriz saiu — o `consolidated-result` entrega só total por
 * programa — e no lugar dela entrou uma "Curva ABC por programa" (barras de participação). Era um substituto
 * razoável para não deixar a tela vazia.
 *
 * A curva **saiu** (2026-07-16): a matriz voltou, e agora REAL — o BFF a compõe dos lançamentos de cada plano
 * vigente. Com a matriz de volta, o substituto perdeu a razão. E a P.O. apontou o que decidiu: a curva **não
 * existe no legado** (print dela) nem no handbook §2, que descreve a tela como filtros + "Consolidado dos
 * programas" (a matriz) + export. Era invenção nossa — nascida de uma limitação que não existe mais.
 */
import type { ConsolidatedAbc } from '#modules/budget-plans/client/data/model/consolidado-abc.model.ts'
import { formatCentsBRL } from '#modules/budget-plans/client/domain/calc/derive.ts'

export type ConsolidadoAbcHeader = Readonly<{
  /** "{ano} ABC" (ex.: "2026 ABC"). */
  title: string
  /** "R$ …" (total geral do ano). */
  totalLabel: string
  /**
   * Subtotal do programa filtrado — "Programa PARC: R$ 25.824.688,03" (handbook §2 + print do legado).
   * `null` sem filtro: com "Todos os programas" o subtotal seria o PRÓPRIO total, e repetir o mesmo número
   * duas vezes não informa nada.
   */
  programSubtotalLabel: string | null
}>

/** Cabeçalho do Consolidado: ano + ABC, total geral e o subtotal do programa quando filtrado. */
export const deriveConsolidadoHeader = (result: ConsolidatedAbc): ConsolidadoAbcHeader => {
  const only = result.plans.length === 1 ? result.plans[0] : undefined
  return {
    title: `${String(result.year)} ABC`,
    totalLabel: formatCentsBRL(result.totalInCents),
    programSubtotalLabel:
      only !== undefined
        ? `Programa ${only.programAbbreviation}: ${formatCentsBRL(only.totalInCents)}`
        : null,
  }
}

/** Há resultado a exibir? (falso → view mostra "Nenhum resultado encontrado"). */
export const hasConsolidadoResult = (result: ConsolidatedAbc): boolean => result.plans.length > 0
