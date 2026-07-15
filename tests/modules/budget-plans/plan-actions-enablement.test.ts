/**
 * Testes puros (feature 060) de `isActionEnabled` (quais ações do menu têm endpoint real × ficam desabilitadas)
 * e de `actionErrorTag` (mapa exaustivo do erro do BFF → tag i18n do feedback). Sem DOM.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  isActionEnabled,
  actionDisabledTitleKey,
  actionErrorTag,
  MAX_SCENERIES,
} from '#modules/budget-plans/client/planejamento/plan-actions.view-model.ts'
import { PLAN_ACTIONS } from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

describe('isActionEnabled', () => {
  it('ações com endpoint real (sem status) → habilitadas', () => {
    assert.equal(isActionEnabled('approve'), true)
    assert.equal(isActionEnabled('start-calibration'), true)
    assert.equal(isActionEnabled('create-scenery'), true)
    assert.equal(isActionEnabled('export-csv'), true)
  })
  it('ações SEM endpoint → desabilitadas (mesmo com status)', () => {
    assert.equal(isActionEnabled('share'), false)
    assert.equal(isActionEnabled('planned-vs-actual'), false)
    assert.equal(isActionEnabled('delete'), false)
    assert.equal(isActionEnabled('delete', 'APROVADO'), false)
    assert.equal(isActionEnabled('share', 'RASCUNHO'), false)
  })
  it('create-scenery: só em plano NÃO aprovado', () => {
    assert.equal(isActionEnabled('create-scenery', 'RASCUNHO'), true)
    assert.equal(isActionEnabled('create-scenery', 'EM_CALIBRACAO'), true)
    assert.equal(isActionEnabled('create-scenery', 'APROVADO'), false)
  })
  it('start-calibration: só em plano APROVADO', () => {
    assert.equal(isActionEnabled('start-calibration', 'APROVADO'), true)
    assert.equal(isActionEnabled('start-calibration', 'RASCUNHO'), false)
    assert.equal(isActionEnabled('start-calibration', 'EM_CALIBRACAO'), false)
  })
  it('cobre TODAS as PLAN_ACTIONS (sem ação órfã)', () => {
    for (const a of PLAN_ACTIONS) assert.equal(typeof isActionEnabled(a), 'boolean')
  })
})

describe('actionDisabledTitleKey', () => {
  it('tooltip específico por ação × status', () => {
    assert.equal(
      actionDisabledTitleKey('create-scenery', 'APROVADO'),
      'budget-plans.action.disabled.sceneryNeedsDraft',
    )
    assert.equal(
      actionDisabledTitleKey('start-calibration', 'RASCUNHO'),
      'budget-plans.action.disabled.calibrationNeedsApproved',
    )
    assert.equal(
      actionDisabledTitleKey('start-calibration', 'EM_CALIBRACAO'),
      'budget-plans.action.disabled.calibrationNeedsApproved',
    )
  })
  it('ações sem endpoint (ou fora do gate de status) → tooltip genérico', () => {
    assert.equal(actionDisabledTitleKey('delete', 'RASCUNHO'), 'budget-plans.action.noEndpoint')
    assert.equal(actionDisabledTitleKey('share'), 'budget-plans.action.noEndpoint')
  })
})

describe('actionErrorTag', () => {
  it('mapeia os 409 de ciclo de vida por contexto', () => {
    assert.equal(actionErrorTag('budget-plan-already-approved'), 'budget-plans.action.error.alreadyApproved')
    // calibração em plano NÃO aprovado
    assert.equal(actionErrorTag('budget-plan-not-approved'), 'budget-plans.action.error.notApproved')
    // cenário em plano APROVADO
    assert.equal(
      actionErrorTag('budget-plan-scenery-needs-draft'),
      'budget-plans.action.error.sceneryNeedsDraft',
    )
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

// O core-api recusa `create-scenery` em 3 casos (domain/budget-plan/budget-plan.ts:145-148) e o front só
// conhecia o 1º. A P.O. bateu no TETO em tela e recebeu a mensagem do 1º caso — erro que estes testes travam.
describe('create-scenery — as 3 recusas do core-api', () => {
  it('1. plano APROVADO → desabilitado', () => {
    assert.equal(isActionEnabled('create-scenery', 'APROVADO'), false)
  })

  it('2. o nó É um cenário → desabilitado (cenário não gera cenário)', () => {
    assert.equal(isActionEnabled('create-scenery', 'RASCUNHO', { isScenario: true }), false)
    assert.equal(
      actionDisabledTitleKey('create-scenery', 'RASCUNHO', { isScenario: true }),
      'budget-plans.action.disabled.sceneryFromScenery',
    )
  })

  it('3. já tem MAX_SCENERIES (2) → desabilitado', () => {
    assert.equal(isActionEnabled('create-scenery', 'RASCUNHO', { sceneryCount: MAX_SCENERIES }), false)
    assert.equal(
      actionDisabledTitleKey('create-scenery', 'RASCUNHO', { sceneryCount: MAX_SCENERIES }),
      'budget-plans.action.disabled.sceneryLimit',
    )
  })

  it('rascunho com 1 cenário → AINDA habilitado (o teto é 2, não 1)', () => {
    assert.equal(isActionEnabled('create-scenery', 'RASCUNHO', { sceneryCount: 1 }), true)
  })

  it('rascunho sem contexto → habilitado (compat: chamada sem a linha)', () => {
    assert.equal(isActionEnabled('create-scenery', 'RASCUNHO'), true)
  })

  it('o tooltip do APROVADO ganha do teto — motivo mais específico primeiro', () => {
    assert.equal(
      actionDisabledTitleKey('create-scenery', 'APROVADO', { sceneryCount: 5 }),
      'budget-plans.action.disabled.sceneryNeedsDraft',
    )
  })
})

// 403 (RBAC) ≠ erro inesperado. Sem esta distinção a tela dizia "Tente novamente" para falta de permissão —
// conselho errado: tentar de novo nunca resolve. Cenário real do core-api#374 (42 permissões em vez de 44).
describe('actionErrorTag — 403 tem mensagem própria, não "tente novamente"', () => {
  it('forbidden → tag de permissão (não a genérica)', () => {
    assert.equal(actionErrorTag('forbidden'), 'budget-plans.action.error.forbidden')
    assert.notEqual(actionErrorTag('forbidden'), 'budget-plans.action.error.unexpected')
  })

  it('forbidden ≠ unauthorized — 403 não é sessão expirada', () => {
    assert.notEqual(actionErrorTag('forbidden'), actionErrorTag('unauthorized'))
  })

  it('o inesperado continua caindo no genérico', () => {
    assert.equal(actionErrorTag('unexpected'), 'budget-plans.action.error.unexpected')
  })
})
