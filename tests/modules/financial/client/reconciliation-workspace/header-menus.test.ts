/**
 * formatCustomRange (PERÍODO → Personalizado) — node:test puro. Rótulo do intervalo escolhido.
 * Import relativo (alias só no bundler).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { formatCustomRange } from '../../../../../src/modules/financial/client/reconciliation-workspace/header-menus.binding.ts'

describe('formatCustomRange', () => {
  it('formata o intervalo completo em DD/MM/AAAA – DD/MM/AAAA', () => {
    assert.equal(formatCustomRange('2026-06-01', '2026-06-30'), '01/06/2026 – 30/06/2026')
  })
  it('mostra reticências no lado ainda não escolhido', () => {
    assert.equal(formatCustomRange('2026-06-01', ''), '01/06/2026 – …')
    assert.equal(formatCustomRange('', '2026-06-30'), '… – 30/06/2026')
  })
  it('null quando nenhuma data foi escolhida', () => {
    assert.equal(formatCustomRange('', ''), null)
  })
})
