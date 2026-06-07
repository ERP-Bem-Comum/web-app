/**
 * Financier — transições de domínio (node:test, puro). PJ-only (CNPJ branded); status único, desativação
 * SIMPLES (sem motivo). Sem CPF, sem payment-target.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import { CNPJ } from '#modules/partners/server/domain/value-objects/cnpj.value-object.ts'
import { isOk } from '#shared/primitives/result.ts'
import { buildFinancier, deactivate, reactivate } from '#modules/partners/server/domain/financier/financier.ts'
import type { FinancierInput } from '#modules/partners/server/domain/financier/financier.types.ts'

const makeInput = (): FinancierInput => {
  const cnpj = CNPJ('11.222.333/0001-81') // CNPJ válido
  assert.ok(isOk(cnpj), 'CNPJ de fixture deve ser válido')
  return {
    name: 'Financiador Y',
    corporateName: 'Financiador Y S.A.',
    legalRepresentative: 'Maria Souza',
    cnpj: cnpj.value,
    telephone: '+55 11 4000-0000',
    address: 'Av. Central, 100 — São Paulo/SP',
  }
}

describe('Financier — transições de domínio (PJ-only)', () => {
  it('nasce active', () => {
    assert.strictEqual(buildFinancier(makeInput()).activation, 'active')
  })

  it('deactivate: active → inactive (idempotente, sem motivo)', () => {
    const d = deactivate(buildFinancier(makeInput()))
    assert.strictEqual(d.activation, 'inactive')
    assert.strictEqual(deactivate(d).activation, 'inactive')
  })

  it('reactivate: inactive → active (idempotente)', () => {
    const r = reactivate(deactivate(buildFinancier(makeInput())))
    assert.strictEqual(r.activation, 'active')
    assert.strictEqual(reactivate(r).activation, 'active')
  })
})
