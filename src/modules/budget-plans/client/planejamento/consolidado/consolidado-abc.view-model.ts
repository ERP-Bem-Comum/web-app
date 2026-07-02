/**
 * ViewModel PURO (§XI) do Consolidado ABC (HANDBOOK §2). Deriva o cabeçalho ("{ano} ABC" + "Total: R$ …" +
 * subtotais por programa quando filtrado) e a matriz Centro de Custo × meses (reusa `buildMonthlyMatrixFrom`
 * do Detalhe — mesmo shape `MatrixView`, mesma view burra). Sem React/TanStack — testável por `node:test`.
 */
import type { ConsolidatedAbc } from '#modules/budget-plans/client/data/model/consolidado-abc.model.ts'
import { formatCentsBRL } from '#modules/budget-plans/client/domain/calc/derive.ts'
import {
  buildMonthlyMatrixFrom,
  type MatrixView,
  type Semester,
} from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

export type ProgramSubtotal = Readonly<{ program: string; label: string }>

export type ConsolidadoAbcHeader = Readonly<{
  /** "{ano} ABC" (ex.: "2026 ABC"). */
  title: string
  /** "Total: R$ …". */
  totalLabel: string
  /** Subtítulos "Programa {abrev}: R$ …" (só quando há filtro de programa). */
  subtotals: readonly ProgramSubtotal[]
}>

/** Cabeçalho do Consolidado: ano + ABC, total geral e subtotais por programa. */
export const deriveConsolidadoHeader = (result: ConsolidatedAbc): ConsolidadoAbcHeader => ({
  title: `${String(result.year)} ABC`,
  totalLabel: formatCentsBRL(result.totalInCents),
  subtotals: result.subtotalsByProgram.map((s) => ({
    program: s.program,
    label: formatCentsBRL(s.totalInCents),
  })),
})

/** Há resultado a exibir? (falso → view mostra "Nenhum resultado encontrado"). */
export const hasConsolidadoResult = (result: ConsolidatedAbc): boolean => result.costCenters.length > 0

/** Matriz Centro × meses (mesmo shape `MatrixView` do Detalhe) para o semestre pedido. */
export const buildConsolidadoMatrix = (result: ConsolidatedAbc, semester: Semester): MatrixView =>
  buildMonthlyMatrixFrom(result.costCenters, result.totalInCents, semester)
