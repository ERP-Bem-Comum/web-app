/**
 * Collaborator — transições de domínio puras. TDD: escrito ANTES da impl.
 * Invariantes: nasce pré+ativo; situação só avança pre→complete; desativar registra motivo.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { CPF } from '#modules/partners/server/domain/value-objects/cpf.value-object.ts'
import { Email } from '#modules/partners/server/domain/value-objects/email.value-object.ts'
import {
  buildPreRegistration,
  completeRegistration,
  deactivate,
  reactivate,
} from '#modules/partners/server/domain/collaborator/collaborator.ts'
import type { PreRegistrationInput } from '#modules/partners/server/domain/collaborator/collaborator.types.ts'
import { isOk, isErr } from '#shared/primitives/result.ts'

const cpf = CPF('111.444.777-35')
const email = Email('ana@bemcomum.dev')
if (!isOk(cpf) || !isOk(email)) throw new Error('fixtures inválidas')

const input: PreRegistrationInput = {
  name: 'Ana',
  email: email.value,
  cpf: cpf.value,
  occupationArea: 'EPV',
  role: 'Analista',
  startOfContract: '2024-01-01',
  employmentRelationship: 'PJ',
}

describe('Collaborator', () => {
  it('pré-cadastro nasce pre-registration + active', () => {
    const c = buildPreRegistration(input)
    assert.equal(c.registration, 'pre-registration')
    assert.equal(c.activation, 'active')
    assert.equal(c.deactivationReason, null)
  })

  it('completeRegistration: pre → complete', () => {
    const r = completeRegistration(buildPreRegistration(input))
    assert.equal(isOk(r) && r.value.registration === 'complete', true)
  })

  it('completeRegistration de já-complete → err(invalid-registration-transition)', () => {
    const once = completeRegistration(buildPreRegistration(input))
    if (!isOk(once)) throw new Error('setup')
    const twice = completeRegistration(once.value)
    assert.equal(isErr(twice) && twice.error === 'invalid-registration-transition', true)
  })

  it('deactivate registra motivo e fica inactive', () => {
    const c = deactivate(buildPreRegistration(input), 'contract-ended')
    assert.equal(c.activation, 'inactive')
    assert.equal(c.deactivationReason, 'contract-ended')
  })

  it('reactivate limpa o motivo', () => {
    const c = reactivate(deactivate(buildPreRegistration(input), 'other'))
    assert.equal(c.activation, 'active')
    assert.equal(c.deactivationReason, null)
  })
})
