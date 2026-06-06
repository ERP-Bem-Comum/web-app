/**
 * Collaborator — transições de domínio PURAS (sem I/O, sem throw; §II/§IV). Invariantes:
 *  - pré-cadastro nasce `pre-registration` + `active`;
 *  - situação cadastral só avança `pre-registration → complete` (unidirecional);
 *  - desativar exige motivo (o tipo `DeactivationReason` força isso na borda).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type { PartnersError } from '../errors/partners.errors.ts'
import type { Collaborator, PreRegistrationInput, DeactivationReason } from './collaborator.types.ts'

/** Pré-cadastro (dados ABC) → Colaborador com situação `pre-registration`. */
export const buildPreRegistration = (input: PreRegistrationInput): Collaborator => ({
  ...input,
  registration: 'pre-registration',
  activation: 'active',
  deactivationReason: null,
})

/** Promove a situação cadastral. Erro se já estava `complete` (transição inválida). */
export const completeRegistration = (c: Collaborator): Result<Collaborator, PartnersError> =>
  c.registration === 'complete'
    ? err('invalid-registration-transition')
    : ok({ ...c, registration: 'complete' })

/** Desativa (idempotente) registrando o motivo. */
export const deactivate = (
  c: Collaborator,
  reason: DeactivationReason,
): Collaborator =>
  c.activation === 'inactive'
    ? c
    : { ...c, activation: 'inactive', deactivationReason: reason }

/** Reativa (idempotente), limpando o motivo. */
export const reactivate = (c: Collaborator): Collaborator =>
  c.activation === 'active' ? c : { ...c, activation: 'active', deactivationReason: null }
