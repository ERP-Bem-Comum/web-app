/**
 * Act — transições de domínio (node:test, puro). O ACT é o 4º tipo de parceiro: espelha o NÚCLEO do
 * Colaborador (7 campos de pré-cadastro + status duplo), mas sem complete-registration/import e com
 * desativação SIMPLES (sem motivo — o core-api `POST /acts/:id/deactivate` não recebe body).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import { CPF } from '#modules/partners/server/domain/value-objects/cpf.value-object.ts'
import { Email } from '#modules/partners/server/domain/value-objects/email.value-object.ts'
import { isOk } from '#shared/primitives/result.ts'
import { buildPreRegistration, deactivate, reactivate } from '#modules/partners/server/domain/act/act.ts'
import type { PreRegistrationInput } from '#modules/partners/server/domain/act/act.types.ts'

const makeInput = (): PreRegistrationInput => {
  const cpf = CPF('111.444.777-35') // CPF válido (DV correto)
  const email = Email('act@bemcomum.dev')
  assert.ok(isOk(cpf), 'CPF de fixture deve ser válido')
  assert.ok(isOk(email), 'Email de fixture deve ser válido')
  return {
    name: 'Fulano ACT',
    email: email.value,
    cpf: cpf.value,
    occupationArea: 'PARC',
    role: 'Articulador',
    startOfContract: '2026-01-15',
    employmentRelationship: 'CLT',
  }
}

describe('Act — transições de domínio (núcleo)', () => {
  it('pré-cadastro nasce pre-registration + active', () => {
    const a = buildPreRegistration(makeInput())
    assert.strictEqual(a.registration, 'pre-registration')
    assert.strictEqual(a.activation, 'active')
  })

  it('deactivate: active → inactive (idempotente, sem motivo)', () => {
    const a = buildPreRegistration(makeInput())
    const d = deactivate(a)
    assert.strictEqual(d.activation, 'inactive')
    assert.strictEqual(deactivate(d).activation, 'inactive')
  })

  it('reactivate: inactive → active (idempotente)', () => {
    const r = reactivate(deactivate(buildPreRegistration(makeInput())))
    assert.strictEqual(r.activation, 'active')
    assert.strictEqual(reactivate(r).activation, 'active')
  })
})
