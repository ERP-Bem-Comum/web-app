import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  formatSupplierDocument,
  mapItemToRow,
  mapResponseToRows,
  totalPages,
} from '../../../../../src/modules/partners/client/supplier-list/supplier-list.view-model.ts'
import type { SupplierListItem } from '../../../../../src/modules/partners/server/domain/supplier/supplier.io.ts'

const item: SupplierListItem = {
  id: '1',
  name: 'Acme',
  email: 'c@acme.dev',
  document: '12345678000190',
  personType: 'PJ',
  corporateName: 'Acme LTDA',
  fantasyName: 'Acme',
  serviceCategory: 'Limpeza',
  activation: 'active',
  contractCount: 0,
}

describe('supplier-list.view-model — pessoa física (#1022)', () => {
  it('fornecedor PF: CPF mascarado como CPF (não como CNPJ) e etiqueta PF', () => {
    const row = mapItemToRow({
      ...item,
      document: '52998224725',
      personType: 'PF',
      corporateName: null,
      fantasyName: null,
    })
    assert.equal(row.document, '529.982.247-25')
    assert.equal(row.personType, 'PF')
  })

  it('formatSupplierDocument: CNPJ alfanumérico mascarado; formato inesperado volta cru', () => {
    assert.equal(formatSupplierDocument('12ABC34501DE35'), '12.ABC.345/01DE-35')
    assert.equal(formatSupplierDocument('123'), '123')
  })
})

describe('supplier-list.view-model', () => {
  it('mapItemToRow projeta só os campos da linha (documento já mascarado)', () => {
    const row = mapItemToRow(item)
    assert.deepEqual(row, {
      id: '1',
      name: 'Acme',
      document: '12.345.678/0001-90',
      personType: 'PJ',
      email: 'c@acme.dev',
      serviceCategory: 'Limpeza',
      activation: 'active',
      contractCount: 0,
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
