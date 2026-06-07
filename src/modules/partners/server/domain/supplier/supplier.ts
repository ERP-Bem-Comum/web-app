/**
 * Supplier — transições de domínio PURAS (sem I/O, sem throw; §II/§IV). Status único ativo/inativo:
 *  - nasce `active`;
 *  - desativar/reativar são idempotentes e SEM motivo (o core-api `POST /suppliers/:id/deactivate`
 *    não recebe body — diferente do Colaborador).
 * A invariante "ao menos um payment target (bankAccount|pixKey)" é validada pelo core-api (422).
 */
import type { Supplier, SupplierInput } from './supplier.types.ts'

export const buildSupplier = (input: SupplierInput): Supplier => ({
  ...input,
  activation: 'active',
})

export const deactivate = (s: Supplier): Supplier =>
  s.activation === 'inactive' ? s : { ...s, activation: 'inactive' }

export const reactivate = (s: Supplier): Supplier =>
  s.activation === 'active' ? s : { ...s, activation: 'active' }
