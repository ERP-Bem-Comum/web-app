/**
 * document-form.view (puro, node:test) — preview do líquido, gating de retenção, agregação CSRF, build do
 * input. Números do mock: NFS-e R$ 10.000 com ISS 350 / IRRF 150 / INSS 1.100 / PIS 65 / COFINS 300 /
 * CSLL 100 → líquido R$ 7.935,00; CSRF (PIS+COFINS+CSLL) = R$ 465,00.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  retentionsEnabledFor,
  netPreviewCents,
  titulosPrevistos,
  canSubmit,
  buildCreateInput,
  type DocumentFormFields,
} from '../../../../../src/modules/financial/client/document-create/document-form.view.ts'

const base: DocumentFormFields = {
  type: 'NFS-e',
  documentNumber: '0847',
  series: 'A1',
  supplierRef: 's-1',
  paymentMethod: 'PIX',
  grossValue: 'R$ 10.000,00',
  dueDate: '2026-06-10',
  description: 'Consultoria',
  retentions: { iss: '350', irrf: '150', inss: '1100', pis: '65', cofins: '300', csll: '100' },
}

describe('retentionsEnabledFor', () => {
  it('só NFS-e e RPA', () => {
    assert.equal(retentionsEnabledFor('NFS-e'), true)
    assert.equal(retentionsEnabledFor('RPA'), true)
    assert.equal(retentionsEnabledFor('Boleto'), false)
    assert.equal(retentionsEnabledFor(''), false)
  })
})

describe('netPreviewCents', () => {
  it('líquido = bruto − Σretenções', () => {
    assert.equal(netPreviewCents(base), '793500')
  })
  it('tipo sem retenção: líquido = bruto (retenções ignoradas)', () => {
    assert.equal(netPreviewCents({ ...base, type: 'Boleto' }), '1000000')
  })
})

describe('titulosPrevistos', () => {
  it('pai + filhos com CSRF agregado', () => {
    const t = titulosPrevistos(base)
    assert.equal(t.length, 5)
    assert.deepEqual(t[0], { kind: 'Pai', valueCents: '793500' })
    const csrf = t.find((x) => x.kind === 'CSRF')
    assert.equal(csrf?.valueCents, '46500') // 6500 + 30000 + 10000
  })
  it('tipo sem retenção: só o pai', () => {
    const t = titulosPrevistos({ ...base, type: 'Boleto' })
    assert.equal(t.length, 1)
    assert.equal(t[0]?.kind, 'Pai')
  })
})

describe('canSubmit', () => {
  it('válido com os obrigatórios + líquido > 0', () => {
    assert.equal(canSubmit(base), true)
  })
  it('falha sem tipo / sem fornecedor / líquido ≤ 0', () => {
    assert.equal(canSubmit({ ...base, type: '' }), false)
    assert.equal(canSubmit({ ...base, supplierRef: '' }), false)
    // retenções > bruto → líquido negativo
    assert.equal(canSubmit({ ...base, grossValue: '100' }), false)
  })
})

describe('buildCreateInput', () => {
  it('agrega CSRF e converte para centavos', () => {
    const input = buildCreateInput(base)
    assert.notEqual(input, null)
    if (input !== null) {
      assert.equal(input.grossValueCents, '1000000')
      assert.equal(input.retentions.length, 4) // ISS, IRRF, INSS, CSRF
      const csrf = input.retentions.find((r) => r.type === 'CSRF')
      assert.equal(csrf?.valueCents, '46500')
      assert.equal(input.registeredTaxes.length, 0)
      assert.equal(input.type, 'NFS-e')
    }
  })
  it('null quando não pode submeter', () => {
    assert.equal(buildCreateInput({ ...base, documentNumber: '' }), null)
  })
})
