/**
 * Act — transições de domínio PURAS (sem I/O, sem throw; §II/§IV). Situação única `active` (boolean):
 *  - nasce `active: true`;
 *  - desativar/reativar são idempotentes e SEM motivo (o core-api `POST /acts/:id/deactivate` não
 *    recebe body — igual ao Fornecedor).
 * Invariantes de repasse (hasFinancialTransfer ⇒ conta|pix) e vigência (endDate > startDate) são
 * validadas na borda (act.io-schemas) + core-api (422).
 */
import type { Act, ActInput } from './act.types.ts'

export const buildAct = (input: ActInput): Act => ({
  ...input,
  active: true,
})

export const deactivate = (a: Act): Act => (a.active ? { ...a, active: false } : a)

export const reactivate = (a: Act): Act => (a.active ? a : { ...a, active: true })
