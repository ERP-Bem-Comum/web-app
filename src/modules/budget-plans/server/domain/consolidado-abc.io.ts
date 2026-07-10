/**
 * Domínio server (PURO) do Consolidado ABC. Espelha o retorno REAL do core-api
 * `GET /budget-plans/consolidated-result?year=&programRef=`: o TOTAL do ano + o resumo por FAMÍLIA
 * (programa) da vigente aprovada — a base da curva ABC (programas por contribuição de orçamento).
 * NÃO há matriz Centro de Custo × meses aqui (o endpoint não a entrega). Valores em centavos (§IV);
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

/** Resultado consolidado do ano: total geral + os planos (por programa) que o compõem. */
export type ConsolidatedAbc = Readonly<{
  year: number
  totalInCents: number
  plans: readonly ConsolidatedPlan[]
}>

/** Artefato pronto para download entregue pela server fn (o CSV vem do core-api, o BFF só o repassa). */
export type ConsolidatedAbcCsv = Readonly<{ filename: string; content: string }>
