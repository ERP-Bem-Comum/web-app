/**
 * Mapper de detalhe do core-api → domínio (node:test, puro).
 * Cobre a leitura dos metadados editáveis (observations/email/telephone), que o
 * PATCH /api/v2/contracts/:id atualiza e a rota gorda GET /:id devolve no detalhe.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import { apiContractDetailToDomain } from '#modules/contracts/server/adapters/core-api/core-api-contracts.ts'

const baseDetailPending = {
  id: '11111111-1111-4111-8111-111111111111',
  sequentialNumber: '001/2026',
  title: 'Contrato de Teste',
  objective: 'Objetivo do contrato',
  originalValue: { cents: 100_000 },
  originalPeriod: { kind: 'Fixed', start: '2026-01-01', end: '2026-12-31' },
  status: 'Pending',
  amendments: [],
  documents: [],
} as const

describe('apiContractDetailToDomain — metadados editáveis (PATCH)', () => {
  it('propaga observations/email/telephone quando o detalhe os traz', () => {
    // O mapper agora retorna Result (C3 / errors-as-values) — desembrulhamos o caso ok.
    const r = apiContractDetailToDomain({
      ...baseDetailPending,
      observations: 'Observação atualizada',
      email: 'contato@exemplo.com',
      telephone: '+55 11 99999-8888',
    })
    assert.ok(r.ok)
    assert.strictEqual(r.value.observations, 'Observação atualizada')
    assert.strictEqual(r.value.email, 'contato@exemplo.com')
    assert.strictEqual(r.value.telephone, '+55 11 99999-8888')
  })

  it('deixa os metadados como undefined quando ausentes no detalhe', () => {
    const r = apiContractDetailToDomain(baseDetailPending)
    assert.ok(r.ok)
    assert.strictEqual(r.value.observations, undefined)
    assert.strictEqual(r.value.email, undefined)
    assert.strictEqual(r.value.telephone, undefined)
  })
})
