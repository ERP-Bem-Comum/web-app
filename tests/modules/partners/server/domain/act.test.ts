/**
 * Act — transições de domínio (node:test, puro). ACT = Acordo de Cooperação Técnica (instituição/CNPJ).
 * Situação única `active` (boolean): nasce ativo; desativar/reativar são idempotentes e SEM motivo
 * (o core-api `POST /acts/:id/deactivate` não recebe body).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import { CNPJ } from '#modules/partners/server/domain/value-objects/cnpj.value-object.ts'
import { Email } from '#modules/partners/server/domain/value-objects/email.value-object.ts'
import { isOk } from '#shared/primitives/result.ts'
import { buildAct, deactivate, reactivate } from '#modules/partners/server/domain/act/act.ts'
import type { ActInput } from '#modules/partners/server/domain/act/act.types.ts'

const makeInput = (): ActInput => {
  const cnpj = CNPJ('11.222.333/0001-81') // CNPJ válido (DV correto)
  const email = Email('act@bemcomum.dev')
  assert.ok(isOk(cnpj), 'CNPJ de fixture deve ser válido')
  assert.ok(isOk(email), 'Email de fixture deve ser válido')
  return {
    actNumber: 'ACT-2026-001',
    name: 'Acordo de Cooperação X',
    email: email.value,
    cnpj: cnpj.value,
    corporateName: 'Instituição Parceira LTDA',
    fantasyName: 'IP',
    occupationArea: 'PARC',
    legalRepresentative: 'João Diretor',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    hasFinancialTransfer: false,
    bankAccount: null,
    pixKey: null,
  }
}

describe('Act — transições de domínio (núcleo)', () => {
  it('nasce active', () => {
    const a = buildAct(makeInput())
    assert.strictEqual(a.active, true)
  })

  it('deactivate: active → inactive (idempotente, sem motivo)', () => {
    const a = buildAct(makeInput())
    const d = deactivate(a)
    assert.strictEqual(d.active, false)
    assert.strictEqual(deactivate(d).active, false)
  })

  it('reactivate: inactive → active (idempotente)', () => {
    const r = reactivate(deactivate(buildAct(makeInput())))
    assert.strictEqual(r.active, true)
    assert.strictEqual(reactivate(r).active, true)
  })
})
