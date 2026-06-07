/**
 * Act — transições de domínio PURAS (sem I/O, sem throw; §II/§IV). Invariantes:
 *  - pré-cadastro nasce `pre-registration` + `active`;
 *  - desativar/reativar são idempotentes e SEM motivo (o core-api `POST /acts/:id/deactivate` não
 *    recebe body — diferente do Colaborador, que exige `disableBy`).
 */
import type { Act, PreRegistrationInput } from './act.types.ts'

/** Pré-cadastro (7 campos) → Act com situação `pre-registration` + `active`. */
export const buildPreRegistration = (input: PreRegistrationInput): Act => ({
  ...input,
  registration: 'pre-registration',
  activation: 'active',
})

/** Desativa (idempotente, sem motivo). */
export const deactivate = (a: Act): Act =>
  a.activation === 'inactive' ? a : { ...a, activation: 'inactive' }

/** Reativa (idempotente). */
export const reactivate = (a: Act): Act =>
  a.activation === 'active' ? a : { ...a, activation: 'active' }
