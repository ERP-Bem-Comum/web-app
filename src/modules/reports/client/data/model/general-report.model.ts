/**
 * Relatório Geral — model do client (GET /reports/generalReport, #442). Espelha os tipos do server
 * (`reports.io.ts`): LEDGER plano e PAGINADO de títulos a-pagar (A+B+C+D). `payeeKind` distingue o favorecido;
 * só o NOME relevante vem preenchido. `pixKey`/`bankAccount` só chegam para fornecedor com `bank-account:read`
 * (senão null — Slice C). `valueCents` em centavos (§IV). Datas cruas (`dueDate` ISO) — o view-model formata.
 * Arquivo NEUTRO de `client/data` (boundary §I).
 */
export type GeneralReportPixKey = Readonly<{ keyType: string; key: string }>
export type GeneralReportBankAccount = Readonly<{
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
}>

export type GeneralReportRow = Readonly<{
  payableId: string
  documentId: string
  code: string | null
  dueDate: string
  payeeKind: 'supplier' | 'financier' | 'act' | 'collaborator'
  supplierName: string | null
  financierName: string | null
  collaboratorName: string | null
  costCenterName: string | null
  categoryName: string | null
  subcategoryName: string | null
  valueCents: number
  contractNumber: string | null
  pixKey: GeneralReportPixKey | null
  bankAccount: GeneralReportBankAccount | null
}>

export type GeneralReportPage = Readonly<{
  items: readonly GeneralReportRow[]
  page: number
  pageSize: number
  total: number
}>

/**
 * Consulta do Relatório Geral (#442). Paginação obrigatória; demais filtros opcionais (AND no servidor).
 * `search` = LIKE em nº do documento + fornecedor. `dueFrom`/`dueTo` em `YYYY-MM-DD`.
 */
export type GeneralReportQuery = Readonly<{
  page: number
  limit: number
  search?: string
  programId?: string
  budgetPlanId?: string
  dueFrom?: string
  dueTo?: string
  accountId?: string
  costCenterId?: string
  categoryId?: string
  subCategoryId?: string
  entityId?: string
  status?: string
}>
