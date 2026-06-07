import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  mapItemToRow,
  mapResponseToRows,
  totalPages,
} from '../../../../../src/modules/partners/client/act-list/act-list.view-model.ts'
import type { ActListItem } from '../../../../../src/modules/partners/client/data/model/act.model.ts'

const item: ActListItem = {
  id: '1',
  name: 'João Souza',
  email: 'joao@org.dev',
  occupationArea: 'PARC',
  role: 'Analista',
  registration: 'pre-registration',
  activation: 'active',
}

describe('act-list.view-model', () => {
  it('mapItemToRow projeta os campos da linha (com os 2 status)', () => {
    const row = mapItemToRow(item)
    assert.equal(row.registration, 'pre-registration')
    assert.equal(row.activation, 'active')
    assert.equal(row.occupationArea, 'PARC')
  })

  it('mapResponseToRows mapeia todos os itens', () => {
    const rows = mapResponseToRows({
      items: [item, { ...item, id: '2', activation: 'inactive', registration: 'complete' }],
      meta: { page: 1, limit: 5, total: 2 },
    })
    assert.equal(rows.length, 2)
    assert.equal(rows[1]?.registration, 'complete')
  })

  it('totalPages (teto, mínimo 1)', () => {
    assert.equal(totalPages({ page: 1, limit: 5, total: 12 }), 3)
    assert.equal(totalPages({ page: 1, limit: 5, total: 0 }), 1)
  })
})
