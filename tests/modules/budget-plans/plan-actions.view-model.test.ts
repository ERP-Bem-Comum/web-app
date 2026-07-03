/**
 * Testes do ViewModel puro das confirmações do menu "…" (§2.5): quais ações abrem modal, quais são
 * destrutivas e quais pedem nome.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { confirmSpecFor } from '#modules/budget-plans/client/planejamento/plan-actions.view-model.ts'

describe('confirmSpecFor', () => {
  it('aprovar → confirma, não destrutivo, sem nome', () => {
    assert.deepEqual(confirmSpecFor('approve'), { action: 'approve', danger: false, needsName: false })
  })
  it('excluir → destrutivo', () => {
    assert.equal(confirmSpecFor('delete')?.danger, true)
  })
  it('iniciar calibração → confirma, não destrutivo', () => {
    assert.deepEqual(confirmSpecFor('start-calibration'), {
      action: 'start-calibration',
      danger: false,
      needsName: false,
    })
  })
  it('criar cenário → pede nome', () => {
    assert.equal(confirmSpecFor('create-scenery')?.needsName, true)
  })
  it('ações de outras telas não abrem confirmação', () => {
    assert.equal(confirmSpecFor('share'), null)
    assert.equal(confirmSpecFor('planned-vs-actual'), null)
    assert.equal(confirmSpecFor('export-csv'), null)
  })
})
