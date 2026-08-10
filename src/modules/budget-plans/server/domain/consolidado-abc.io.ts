/**
 * Domínio server (PURO) do Consolidado ABC. Espelha o retorno REAL do core-api
 * `GET /budget-plans/consolidated-result?year=&programRef=`: o TOTAL do ano + o resumo por FAMÍLIA
 * (programa) da vigente aprovada — a base da curva ABC (programas por contribuição de orçamento).
 * A MATRIZ Centro de Custo × 12 meses (§2 — o que o legado mostra) NÃO vem do endpoint: o `consolidated-result`
 * entrega só total por programa. O BFF a compõe buscando a estrutura + os lançamentos de cada plano vigente e
 * FUNDINDO os programas (`mergeConsolidatedMatrices`). Valores em centavos (§IV);
 * sem I/O, sem framework (§II/§XI). A resposta é validada na borda e mapeada para este tipo
 * (ver `adapters/core-api/consolidado-result.schema.ts`).
 */

/** Plano aprovado de UM programa que compõe a curva ABC do ano (uma família por linha). */
export type ConsolidatedPlan = Readonly<{
  id: string
  programName: string
  programAbbreviation: string
  version: number
  totalInCents: number
}>

/** Resultado consolidado do ano: total geral + os planos (curva ABC) + a matriz Centro × meses (§2). */
export type ConsolidatedAbc = Readonly<{
  year: number
  totalInCents: number
  plans: readonly ConsolidatedPlan[]
  /**
   * Matriz "Consolidado dos programas" — Centro de Custo × 12 meses, com as categorias sufixadas pelo
   * programa. Composta pelo BFF (o endpoint não a entrega). Vazia = nenhum plano aprovado no filtro.
   */
  costCenters: readonly CostCenterConsolidated[]
}>

import type { CostCenterConsolidated } from '#modules/budget-plans/server/domain/plan-detail.io.ts'

/** Artefato pronto para download entregue pela server fn (o CSV vem do core-api, o BFF só o repassa). */
export type ConsolidatedAbcCsv = Readonly<{ filename: string; content: string }>
