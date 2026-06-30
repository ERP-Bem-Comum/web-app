/**
 * Financier — transições de domínio PURAS (sem I/O, sem throw; §II/§IV). Status único ativo/inativo:
 * nasce `active`; desativar/reativar idempotentes e SEM motivo (o core-api não recebe body).
 */
import type { Financier, FinancierInput } from './financier.types.ts'

export const buildFinancier = (input: FinancierInput): Financier => ({
  ...input,
  activation: 'active',
})

export const deactivate = (f: Financier): Financier =>
  f.activation === 'inactive' ? f : { ...f, activation: 'inactive' }

export const reactivate = (f: Financier): Financier =>
  f.activation === 'active' ? f : { ...f, activation: 'active' }
