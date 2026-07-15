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
}>
