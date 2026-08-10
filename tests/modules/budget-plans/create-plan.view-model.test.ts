/**
 * ViewModel PURO do modal "Adicionar Plano Orçamentário" (feature 058). Cobre a validação dos obrigatórios
 * (sem checagem de unicidade — agora é do backend) e o mapeamento do erro do BFF → tag i18n do modal.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  validateCreatePlan,
  createErrorTag,
  createPlanInitialForm,
  type CreatePlanForm,
} from '#modules/budget-plans/client/planejamento/create-plan.view-model.ts'

const REF = '11111111-1111-1111-1111-111111111111'

const formWith = (over: Partial<CreatePlanForm>): CreatePlanForm => ({ ...createPlanInitialForm, ...over })

describe('validateCreatePlan', () => {
  it('ano vazio → requiredYear', () => {
    assert.equal(validateCreatePlan(formWith({ year: '', program: REF })), 'budget-plans.create.requiredYear')
  })
  it('ano não-inteiro → requiredYear', () => {
    assert.equal(
      validateCreatePlan(formWith({ year: 'abc', program: REF })),
      'budget-plans.create.requiredYear',
    )
  })
  it('programa vazio → requiredProgram', () => {
    assert.equal(
      validateCreatePlan(formWith({ year: '2027', program: '' })),
      'budget-plans.create.requiredProgram',
    )
  })
  it('ano + programa preenchidos → null (a unicidade é do backend, não checa aqui)', () => {
    assert.equal(validateCreatePlan(formWith({ year: '2027', program: REF })), null)
  })
  it('ano repetido não é bloqueado no client (só required)', () => {
    assert.equal(validateCreatePlan(formWith({ year: '2026', program: REF })), null)
  })
})

describe('createErrorTag', () => {
  it('409 já existe → conflito', () => {
    assert.equal(createErrorTag('budget-plan-already-exists'), 'budget-plans.create.conflict')
  })
  it('invalid-input → genérico', () => {
    assert.equal(createErrorTag('invalid-input'), 'budget-plans.create.unexpected')
  })
  it('unauthorized → genérico', () => {
    assert.equal(createErrorTag('unauthorized'), 'budget-plans.create.unexpected')
  })
  it('unexpected → genérico', () => {
    assert.equal(createErrorTag('unexpected'), 'budget-plans.create.unexpected')
  })
})

// A mensagem que a P.O. VIU em tela ao tentar criar um plano em produção era a genérica ("Tente novamente").
// Pode ter sido 403 o tempo todo (core-api#374: 42 permissões em vez de 44) — e a tela mandava insistir.
describe('createErrorTag — 403 não vira "tente novamente"', () => {
  it('forbidden → tag de permissão', () => {
    assert.equal(createErrorTag('forbidden'), 'budget-plans.create.forbidden')
  })

  it('409 continua conflito, e o resto continua genérico', () => {
    assert.equal(createErrorTag('budget-plan-already-exists'), 'budget-plans.create.conflict')
    assert.equal(createErrorTag('unexpected'), 'budget-plans.create.unexpected')
    assert.equal(createErrorTag('unauthorized'), 'budget-plans.create.unexpected')
  })
})
