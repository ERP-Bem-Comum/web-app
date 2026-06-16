/**
 * Mappers do core-api financial (puro, node:test): status EN→PT, mapHttpError slug→FinancialError,
 * detailToModel/listToModel com parse de borda. Import relativo (os #alias da fonte resolvem via
 * package.json "imports").
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  mapStatus,
  mapHttpError,
  detailToModel,
  listToModel,
} from '../../../../../../src/modules/financial/server/adapters/core-api/financial.mappers.ts'
import { isOk, isErr } from '../../../../../../src/shared/primitives/result.ts'
import type { HttpError } from '../../../../../../src/shared/http/http-error.types.ts'

describe('mapStatus', () => {
  it('traduz EN→PT', () => {
    assert.equal(mapStatus('Draft'), 'Rascunho')
    assert.equal(mapStatus('Open'), 'Aberto')
    assert.equal(mapStatus('Approved'), 'Aprovado')
  })
  it('desconhecido degrada para Aberto', () => {
    assert.equal(mapStatus('Whatever'), 'Aberto')
  })
})

describe('mapHttpError', () => {
  const http = (status: number, code?: string): HttpError => ({
    kind: 'http',
    status,
    body: code === undefined ? null : { error: { code, message: '', requestId: 'r' } },
  })

  it('mapeia slugs de negócio', () => {
    assert.equal(mapHttpError(http(404, 'document-not-found')), 'not-found')
    assert.equal(mapHttpError(http(409, 'invalid-state-transition')), 'invalid-transition')
    assert.equal(mapHttpError(http(422, 'net-value-not-positive')), 'net-value-invalid')
    assert.equal(mapHttpError(http(422, 'retention-not-allowed-for-type')), 'retention-not-allowed')
    assert.equal(mapHttpError(http(422, 'document-incomplete')), 'document-incomplete')
  })
  it('cai no status quando não há slug', () => {
    assert.equal(mapHttpError(http(404)), 'not-found')
    assert.equal(mapHttpError(http(403)), 'forbidden')
    assert.equal(mapHttpError(http(422)), 'validation')
    assert.equal(mapHttpError(http(500)), 'server')
  })
  it('rede/timeout → connectivity', () => {
    assert.equal(mapHttpError({ kind: 'network' }), 'connectivity')
    assert.equal(mapHttpError({ kind: 'timeout' }), 'connectivity')
  })
})

const validDoc = {
  id: 'd1',
  status: 'Open',
  type: 'NFS-e',
  documentNumber: '0847',
  supplierRef: 's1',
  paymentMethod: 'PIX',
  grossValueCents: '1000000',
  netValueCents: '793500',
  dueDate: '2026-06-10',
  description: 'Consultoria',
  payables: [
    { id: 'p0', kind: 'Parent', retentionType: null, valueCents: '793500', status: 'Open' },
    { id: 'p1', kind: 'Child', retentionType: 'ISS', valueCents: '35000', status: 'Open' },
  ],
}

describe('detailToModel', () => {
  it('mapeia documento válido (status PT, type, payables)', () => {
    const r = detailToModel(validDoc)
    assert.equal(isOk(r), true)
    if (isOk(r)) {
      assert.equal(r.value.status, 'Aberto')
      assert.equal(r.value.type, 'NFS-e')
      assert.equal(r.value.payables.length, 2)
      assert.equal(r.value.payables[1]?.retentionType, 'ISS')
    }
  })
  it('drift de contrato → err(server)', () => {
    assert.equal(isErr(detailToModel({ id: 1 })), true)
  })
})

describe('listToModel', () => {
  it('mapeia lista vazia (stub Fatia 1)', () => {
    const r = listToModel({ items: [], page: 1, pageSize: 20, total: 0 })
    assert.equal(isOk(r) && r.value.total, 0)
  })
  it('drift → err(server)', () => {
    assert.equal(isErr(listToModel({ items: 'x' })), true)
  })
})
