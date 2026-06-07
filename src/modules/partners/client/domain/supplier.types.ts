/**
 * Tipos derivados de UI do vertical de Fornecedores (client). Os modelos de resposta vêm do
 * `#modules/partners/public-api` (SupplierListItem/Detail/ListResponse); aqui só o que a UI deriva.
 */
export type ActivationStatus = 'active' | 'inactive'

/** Linha da tabela (DataTable<SupplierRow>) — derivada de SupplierListItem por mapper puro. */
export type SupplierRow = Readonly<{
  id: string
  name: string
  cnpj: string
  email: string
  serviceCategory: string
  activation: ActivationStatus
}>

/** Ação de ciclo de vida no detalhe. */
export type StatusAction = 'deactivate' | 'reactivate'
