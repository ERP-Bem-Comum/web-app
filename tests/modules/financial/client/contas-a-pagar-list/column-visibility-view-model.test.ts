/**
 * column-visibility.view-model (node:test) — núcleo PURO do seletor de colunas (spec 129): parse TOLERANTE
 * do storage, colunas fixas (Documento/Status) que nunca somem, round-trip e ordem estável.
 * Imports RELATIVOS (node:test resolve os subpath `#…` via package.json `imports`).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  NO_HIDDEN_COLUMNS,
  parseHiddenColumns,
  serializeHiddenColumns,
  toggleHiddenColumn,
  visibleColumnsOf,
} from '../../../../../src/modules/financial/client/contas-a-pagar-list/column-visibility.view-model.ts'

describe('parseHiddenColumns', () => {
  it('nulo, JSON corrompido ou shape desconhecido → nada escondido (nunca throw)', () => {
    assert.equal(parseHiddenColumns(null).size, 0)
    assert.equal(parseHiddenColumns('{not json').size, 0)
    assert.equal(parseHiddenColumns('{"supplier":true}').size, 0)
  })

  it('ignora chave desconhecida e coluna fixa (storage adulterado não esconde Documento/Status)', () => {
    const hidden = parseHiddenColumns('["supplier","nope","documentNumber","status",3]')
    assert.deepEqual([...hidden], ['supplier'])
  })
})

describe('toggleHiddenColumn', () => {
  it('esconde e volta a mostrar uma coluna comum, sem mutar a origem', () => {
    const once = toggleHiddenColumn(NO_HIDDEN_COLUMNS, 'contract')
    assert.equal(once.has('contract'), true)
    assert.equal(NO_HIDDEN_COLUMNS.size, 0)
    assert.equal(toggleHiddenColumn(once, 'contract').has('contract'), false)
  })

  it('coluna fixa é no-op', () => {
    assert.equal(toggleHiddenColumn(NO_HIDDEN_COLUMNS, 'status'), NO_HIDDEN_COLUMNS)
    assert.equal(toggleHiddenColumn(NO_HIDDEN_COLUMNS, 'documentNumber'), NO_HIDDEN_COLUMNS)
  })
})

describe('serializeHiddenColumns', () => {
  it('round-trip e ordem do COLUMNS (independe da ordem de inserção)', () => {
    const raw = serializeHiddenColumns(new Set(['net', 'type'] as const))
    assert.equal(raw, '["type","net"]')
    assert.deepEqual([...parseHiddenColumns(raw)], ['type', 'net'])
  })
})

describe('visibleColumnsOf', () => {
  it('tira as escondidas e mantém a ordem', () => {
    const keys = visibleColumnsOf(new Set(['supplier', 'gross'] as const)).map((c) => c.key)
    assert.deepEqual(keys, [
      'type',
      'documentNumber',
      'contract',
      'paymentMethod',
      'emissao',
      'due',
      'pagamento',
      'net',
      'status',
    ])
  })
})
