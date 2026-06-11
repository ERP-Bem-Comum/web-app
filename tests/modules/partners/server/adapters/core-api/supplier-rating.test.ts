/**
 * Mapeadores de avaliação de fornecedor (§1.6) — node:test puro (imports `#`).
 *  - toWriteBody envia serviceRating/ratingComment (e null quando sem avaliação);
 *  - detailToModel lê os 2 campos (válido + null + desconhecido → null, leitura tolerante D2);
 *  - parseServiceRating: string conhecida → ServiceRating; desconhecida/null/undefined → null.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  toWriteBody,
  detailToModel,
  parseServiceRating,
} from '#modules/partners/server/adapters/core-api/core-api-suppliers.ts'

const baseWrite = {
  name: 'Fornecedor X',
  email: 'x@example.com',
  cnpj: '11.222.333/0001-81',
  corporateName: 'Fornecedor X LTDA',
  fantasyName: 'X',
  serviceCategory: 'Limpeza',
  bankAccount: null,
  pixKey: null,
} as const

const baseDetailDto = {
  id: 'sup-1',
  name: 'Fornecedor X',
  email: 'x@example.com',
  cnpj: '11222333000181',
  corporateName: 'Fornecedor X LTDA',
  fantasyName: 'X',
  serviceCategory: 'Limpeza',
  bankAccount: null,
  pixKey: null,
  active: true,
} as const

describe('toWriteBody — avaliação de serviço', () => {
  it('envia serviceRating/ratingComment quando avaliado', () => {
    const body = toWriteBody({ ...baseWrite, serviceRating: 'BOM', ratingComment: 'Atende bem' })
    assert.strictEqual(body.serviceRating, 'BOM')
    assert.strictEqual(body.ratingComment, 'Atende bem')
  })

  it('envia null quando sem avaliação', () => {
    const body = toWriteBody({ ...baseWrite, serviceRating: null, ratingComment: null })
    assert.strictEqual(body.serviceRating, null)
    assert.strictEqual(body.ratingComment, null)
  })
})

describe('detailToModel — leitura tolerante da avaliação', () => {
  it('lê serviceRating/ratingComment válidos', () => {
    const r = detailToModel({ ...baseDetailDto, serviceRating: 'OTIMO', ratingComment: 'Excelente' })
    assert.ok(r.ok)
    assert.strictEqual(r.value.serviceRating, 'OTIMO')
    assert.strictEqual(r.value.ratingComment, 'Excelente')
  })

  it('lê null quando ausente/nulo', () => {
    const r = detailToModel({ ...baseDetailDto, serviceRating: null, ratingComment: null })
    assert.ok(r.ok)
    assert.strictEqual(r.value.serviceRating, null)
    assert.strictEqual(r.value.ratingComment, null)
  })

  it('degrada valor desconhecido de serviceRating para null (tolerante)', () => {
    const r = detailToModel({ ...baseDetailDto, serviceRating: 'LEGACY_X', ratingComment: 'c' })
    assert.ok(r.ok)
    assert.strictEqual(r.value.serviceRating, null)
    assert.strictEqual(r.value.ratingComment, 'c')
  })

  it('lê null quando o campo nem vem (dados legados)', () => {
    const r = detailToModel(baseDetailDto)
    assert.ok(r.ok)
    assert.strictEqual(r.value.serviceRating, null)
    assert.strictEqual(r.value.ratingComment, null)
  })
})

describe('parseServiceRating', () => {
  it('mapeia os 4 níveis canônicos', () => {
    assert.strictEqual(parseServiceRating('RUIM'), 'RUIM')
    assert.strictEqual(parseServiceRating('REGULAR'), 'REGULAR')
    assert.strictEqual(parseServiceRating('BOM'), 'BOM')
    assert.strictEqual(parseServiceRating('OTIMO'), 'OTIMO')
  })

  it('null/undefined/desconhecido → null', () => {
    assert.strictEqual(parseServiceRating(null), null)
    assert.strictEqual(parseServiceRating(undefined), null)
    assert.strictEqual(parseServiceRating('???'), null)
  })
})
