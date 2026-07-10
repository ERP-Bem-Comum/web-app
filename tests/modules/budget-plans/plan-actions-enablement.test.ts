/**
 * Testes puros (feature 060) de `isActionEnabled` (quais ações do menu têm endpoint real × ficam desabilitadas)
 * e de `actionErrorTag` (mapa exaustivo do erro do BFF → tag i18n do feedback). Sem DOM.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  isActionEnabled,
  actionErrorTag,
} from '#modules/budget-plans/client/planejamento/plan-actions.view-model.ts'
import { PLAN_ACTIONS } from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

describe('isActionEnabled', () => {
  it('ações com endpoint real → habilitadas', () => {
    assert.equal(isActionEnabled('approve'), true)
    assert.equal(isActionEnabled('start-calibration'), true)
    assert.equal(isActionEnabled('create-scenery'), true)
    assert.equal(isActionEnabled('export-csv'), true)
  })
  it('ações SEM endpoint → desabilitadas (visíveis porém disabled)', () => {
    assert.equal(isActionEnabled('share'), false)
    assert.equal(isActionEnabled('planned-vs-actual'), false)
    assert.equal(isActionEnabled('delete'), false)
  })
  it('cobre TODAS as PLAN_ACTIONS (sem ação órfã)', () => {
    for (const a of PLAN_ACTIONS) assert.equal(typeof isActionEnabled(a), 'boolean')
  })
})

describe('actionErrorTag', () => {
  it('mapeia os 409 de ciclo de vida por contexto', () => {
    assert.equal(actionErrorTag('budget-plan-already-approved'), 'budget-plans.action.error.alreadyApproved')
    assert.equal(actionErrorTag('budget-plan-not-approved'), 'budget-plans.action.error.notApproved')
    assert.equal(
      actionErrorTag('budget-plan-invalid-transition'),
      'budget-plans.action.error.invalidTransition',
    )
  })
  it('mapeia 401/404/genéricos', () => {
    assert.equal(actionErrorTag('unauthorized'), 'budget-plans.action.error.unauthorized')
    assert.equal(actionErrorTag('budget-plan-not-found'), 'budget-plans.action.error.notFound')
    assert.equal(actionErrorTag('invalid-input'), 'budget-plans.action.error.invalidInput')
    assert.equal(actionErrorTag('unexpected'), 'budget-plans.action.error.unexpected')
    assert.equal(actionErrorTag('budget-plan-already-exists'), 'budget-plans.action.error.unexpected')
  })
})
