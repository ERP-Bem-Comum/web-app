/**
 * act.io-schemas (node:test, puro) — `.superRefine` da borda: regra de repasse (hasFinancialTransfer ⇒
 * conta|pix) e vigência (endDate > startDate estrito). Comparação como string ISO YYYY-MM-DD.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { CreateActInputSchema } from '#modules/partners/server/adapters/act.io-schemas.ts'

const valid = {
  actNumber: 'ACT-2026-001',
  name: 'Acordo X',
  email: 'contato@org.dev',
  cnpj: '11222333000181',
  corporateName: 'Instituição LTDA',
  fantasyName: 'IP',
  occupationArea: 'PARC',
  legalRepresentative: 'João',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  hasFinancialTransfer: false,
  bankAccount: null,
  pixKey: null,
}

describe('CreateActInputSchema.superRefine', () => {
  it('aceita um Acordo válido sem repasse', () => {
    assert.equal(CreateActInputSchema.safeParse(valid).success, true)
  })

  it('repasse true sem conta nem PIX → falha', () => {
    const r = CreateActInputSchema.safeParse({ ...valid, hasFinancialTransfer: true })
    assert.equal(r.success, false)
  })

  it('repasse true com conta bancária → passa', () => {
    const r = CreateActInputSchema.safeParse({
      ...valid,
      hasFinancialTransfer: true,
      bankAccount: { bank: '001', agency: '1234', accountNumber: '5678', checkDigit: '9' },
    })
    assert.equal(r.success, true)
  })

  it('repasse true com PIX → passa', () => {
    const r = CreateActInputSchema.safeParse({
      ...valid,
      hasFinancialTransfer: true,
      pixKey: { keyType: 'email', key: 'pix@org.dev' },
    })
    assert.equal(r.success, true)
  })

  it('endDate igual a startDate → falha (duração zero)', () => {
    const r = CreateActInputSchema.safeParse({ ...valid, startDate: '2026-01-01', endDate: '2026-01-01' })
    assert.equal(r.success, false)
  })

  it('endDate antes de startDate → falha', () => {
    const r = CreateActInputSchema.safeParse({ ...valid, startDate: '2026-12-31', endDate: '2026-01-01' })
    assert.equal(r.success, false)
  })
})
