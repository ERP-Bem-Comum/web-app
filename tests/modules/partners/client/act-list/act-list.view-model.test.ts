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
  actNumber: 'ACT-2026-001',
  name: 'Acordo X',
  email: 'contato@org.dev',
  corporateName: 'Instituição LTDA',
  fantasyName: 'IP',
  occupationArea: 'PARC',
  hasFinancialTransfer: false,
  active: true,
  contractCount: 0,
}

describe('act-list.view-model', () => {
  it('mapItemToRow projeta os campos da linha do Acordo', () => {
    const row = mapItemToRow(item)
    assert.equal(row.actNumber, 'ACT-2026-001')
    assert.equal(row.corporateName, 'Instituição LTDA')
    assert.equal(row.occupationArea, 'PARC')
    assert.equal(row.hasFinancialTransfer, false)
    assert.equal(row.active, true)
  })

  it('mapResponseToRows mapeia todos os itens', () => {
    const rows = mapResponseToRows({
      items: [item, { ...item, id: '2', active: false, hasFinancialTransfer: true }],
      meta: { page: 1, limit: 5, total: 2 },
    })
    assert.equal(rows.length, 2)
    assert.equal(rows[1]?.active, false)
    assert.equal(rows[1]?.hasFinancialTransfer, true)
  })

  it('totalPages (teto, mínimo 1)', () => {
    assert.equal(totalPages({ page: 1, limit: 5, total: 12 }), 3)
    assert.equal(totalPages({ page: 1, limit: 5, total: 0 }), 1)
  })
})
