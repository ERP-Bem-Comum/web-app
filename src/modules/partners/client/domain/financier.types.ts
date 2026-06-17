/**
 * Tipos derivados de UI do vertical de Financiadores (client). Os modelos de resposta vêm do
 * `data/model` (client-domain PODE importar de client-data; o inverso é proibido pelo boundary);
 * aqui só o que a UI deriva. Espelha `supplier.types.ts`.
 */
import type { ActivationStatus } from '#modules/partners/client/data/model/financier.model.ts'
export type { ActivationStatus }

/** Linha da tabela (DataTable<FinancierRow>) — derivada de FinancierListItem por mapper puro. */
export type FinancierRow = Readonly<{
  id: string
  name: string
  corporateName: string
  legalRepresentative: string
  cnpj: string
  telephone: string
  activation: ActivationStatus
  contractCount: number
}>

/** Ação de ciclo de vida no detalhe. */
export type StatusAction = 'deactivate' | 'reactivate'
