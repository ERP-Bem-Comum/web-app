/**
 * Mapeamentos puros do agregador de parceiros (node:test).
 * `GET /api/v1/partners` unifica os 4 tipos; o BFF traduz entre o `kind` público
 * (PascalCase) e o `type` do core-api (lowercase), e o `type` de volta para o rótulo PT.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  partnerKindToType,
  aggregateTypeToLabel,
} from '#modules/contracts/server/adapters/core-api/core-api-partners.ts'

describe('partnerKindToType — kind público → type do agregador', () => {
  it('mapeia os 4 tipos para o enum lowercase do core-api', () => {
    assert.strictEqual(partnerKindToType('Supplier'), 'supplier')
    assert.strictEqual(partnerKindToType('Financier'), 'financier')
    assert.strictEqual(partnerKindToType('Collaborator'), 'collaborator')
    assert.strictEqual(partnerKindToType('ACT'), 'act')
  })
})

describe('aggregateTypeToLabel — type do agregador → rótulo PT exibido', () => {
  it('mapeia o enum do core-api para o rótulo da UI', () => {
    assert.strictEqual(aggregateTypeToLabel('supplier'), 'Fornecedor')
    assert.strictEqual(aggregateTypeToLabel('financier'), 'Financiador')
    assert.strictEqual(aggregateTypeToLabel('collaborator'), 'Colaborador')
    assert.strictEqual(aggregateTypeToLabel('act'), 'ACT')
  })
})
