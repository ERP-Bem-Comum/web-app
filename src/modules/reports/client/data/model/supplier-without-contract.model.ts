/**
 * SupplierWithoutContract — model do client p/ o relatório "Fornecedores sem Contrato" (GET
 * /reports/suppliers-without-contract, #114). Espelha o `SupplierWithoutContract` do server (`reports.io.ts`).
 * Total AGREGADO pago sem contrato (centavos, number) + contagem de títulos. `name` nullable (→ cai no
 * `supplierRef` como rótulo). Arquivo NEUTRO da camada `client/data` (boundary §I).
 */
export type SupplierWithoutContract = Readonly<{
  supplierRef: string
  name: string | null
  totalCents: number
  payableCount: number
  /** Quebra por Plano Orçamentário (#694): UMA linha por fornecedor×plano, `supplierRef` repetido. */
  budgetPlanRef: string | null
  /** Rótulo do plano; `null` sem plano ou quando a costura do backend não resolve → a UI cai no traço. */
  budgetPlanName: string | null
}>

/**
 * Filtros da consulta (#694). Todos opcionais: ausente = sem recorte, AND no servidor. `dueTo` EXCLUSIVO.
 * Espelha o `SuppliersWithoutContractFilter` do server.
 */
export type SuppliersWithoutContractFilter = Readonly<{
  programId?: string
  budgetPlanId?: string
  costCenterId?: string
  categoryId?: string
  subCategoryId?: string
  dueFrom?: string
  dueTo?: string
}>
