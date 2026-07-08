/**
 * Domínio server (PURO) do Consolidado ABC — espelha o shape do client
 * (`client/data/model/consolidado-abc.model.ts`): árvore Centro de Custo → Categoria → Subcategoria, cada
 * nó com os 12 valores mensais (centavos) e total; mais o total geral e os subtotais por programa.
 * É a projeção relevante para o CSV — sem I/O, sem framework (§II/§XI). A resposta futura do core-api
 * (`GET /budget-plans/consolidated-result`) é validada na borda e mapeada para este tipo (ver
 * `adapters/core-api/consolidado-result.schema.ts`).
 */

/** 12 valores mensais em centavos (Janeiro…Dezembro). */
export type MonthlyCents = readonly number[]

/** Nó folha (subcategoria) da matriz consolidada. */
export type SubCategoryConsolidated = Readonly<{
  name: string
  totalInCents: number
  monthlyInCents: MonthlyCents
}>

/** Categoria (agrupa subcategorias) — no CSV vira uma linha "Categoria". */
export type CategoryConsolidated = Readonly<{
  name: string
  totalInCents: number
  monthlyInCents: MonthlyCents
  subCategories: readonly SubCategoryConsolidated[]
}>

/** Centro de custo (raiz da árvore) — no CSV vira a linha de GRUPO. */
export type CostCenterConsolidated = Readonly<{
  name: string
  totalInCents: number
  monthlyInCents: MonthlyCents
  categories: readonly CategoryConsolidated[]
}>

/** Subtotal por programa (alimenta os subtítulos "Programa {abrev}: R$ …" quando filtrado). */
export type ProgramSubtotal = Readonly<{ program: string; totalInCents: number }>

/** Resultado consolidado (agregação de planos APROVADOS por Ano Base × Programa). */
export type ConsolidatedAbc = Readonly<{
  year: number
  totalInCents: number
  subtotalsByProgram: readonly ProgramSubtotal[]
  costCenters: readonly CostCenterConsolidated[]
}>

/** Artefato pronto para download entregue pela server fn (o CSV já serializado no BFF). */
export type ConsolidatedAbcCsv = Readonly<{ filename: string; content: string }>
