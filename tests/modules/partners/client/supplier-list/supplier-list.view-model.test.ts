import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  mapItemToRow,
  mapResponseToRows,
  totalPages,
} from '../../../../../src/modules/partners/client/supplier-list/supplier-list.view-model.ts'
import type { SupplierListItem } from '../../../../../src/modules/partners/server/domain/supplier/supplier.io.ts'

const item: SupplierListItem = {
  id: '1',
  name: 'Acme',
  email: 'c@acme.dev',
  cnpj: '12345678000190',
  corporateName: 'Acme LTDA',
  fantasyName: 'Acme',
  serviceCategory: 'Limpeza',
  activation: 'active',
}

describe('supplier-list.view-model', () => {
  it('mapItemToRow projeta só os campos da linha', () => {
    const row = mapItemToRow(item)
    assert.deepEqual(row, {
      id: '1',
      name: 'Acme',
      cnpj: '12345678000190',
      email: 'c@acme.dev',
      serviceCategory: 'Limpeza',
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
