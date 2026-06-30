/**
 * Tipos derivados de UI do vertical de Fornecedores (client). Os modelos de resposta vêm do
 * `#modules/partners/public-api` (SupplierListItem/Detail/ListResponse); aqui só o que a UI deriva.
 */
// Fonte única no `data/model` (client-domain PODE importar de client-data; o inverso é proibido pelo
// boundary). Reexporta para quem consome o `ActivationStatus` pela camada de domínio.
import type { ActivationStatus } from '#modules/partners/client/data/model/supplier.model.ts'
export type { ActivationStatus }

/** Linha da tabela (DataTable<SupplierRow>) — derivada de SupplierListItem por mapper puro. */
export type SupplierRow = Readonly<{
  id: string
  name: string
  cnpj: string
  email: string
  serviceCategory: string
  activation: ActivationStatus
  contractCount: number
}>

/** Ação de ciclo de vida no detalhe. */
export type StatusAction = 'deactivate' | 'reactivate'
