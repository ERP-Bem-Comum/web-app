/**
 * Tipos derivados de UI do vertical de ACTs (client). ACT = Acordo de Cooperação Técnica (instituição).
 * Situação = `active` boolean (rótulo Ativo/Inativo derivado no view-model). Espelha o supplier.
 */

/** Linha da tabela (DataTable<ActRow>) — derivada de ActListItem por mapper puro. */
export type ActRow = Readonly<{
  id: string
  actNumber: string
  name: string
  corporateName: string
  occupationArea: string
  hasFinancialTransfer: boolean
  active: boolean
  contractCount: number
}>

/** Ação de ciclo de vida no detalhe (sobre a situação ativa/inativa). */
export type StatusAction = 'deactivate' | 'reactivate'
