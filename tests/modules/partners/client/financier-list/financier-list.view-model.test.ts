import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  mapItemToRow,
  mapResponseToRows,
  totalPages,
} from '../../../../../src/modules/partners/client/financier-list/financier-list.view-model.ts'
import type { FinancierListItem } from '../../../../../src/modules/partners/client/data/model/financier.model.ts'

const item: FinancierListItem = {
  id: '1',
  name: 'Fundo XPTO',
  corporateName: 'Fundo XPTO LTDA',
  legalRepresentative: 'Maria Silva',
  cnpj: '12345678000190',
  telephone: '1140000000',
  activation: 'active',
}

describe('financier-list.view-model', () => {
  it('mapItemToRow projeta só os campos da linha (sem email/categoria)', () => {
    const row = mapItemToRow(item)
    assert.deepEqual(row, {
      id: '1',
      name: 'Fundo XPTO',
      corporateName: 'Fundo XPTO LTDA',
      legalRepresentative: 'Maria Silva',
      cnpj: '12345678000190',
      telephone: '1140000000',
      activation: 'active',
    })
  })

  it('mapResponseToRows mapeia todos os itens', () => {
    const rows = mapResponseToRows({
      items: [item, { ...item, id: '2', activation: 'inactive' }],
      meta: { page: 1, limit: 5, total: 2 },
    })
    assert.equal(rows.length, 2)
    assert.equal(rows[1]?.activation, 'inactive')
  })

  it('totalPages calcula o número de páginas (teto), mínimo 1', () => {
    assert.equal(totalPages({ page: 1, limit: 5, total: 12 }), 3)
    assert.equal(totalPages({ page: 1, limit: 5, total: 0 }), 1)
    assert.equal(totalPages({ page: 1, limit: 10, total: 10 }), 1)
  })
})
