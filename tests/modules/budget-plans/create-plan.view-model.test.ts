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
  toCreateInput,
  importYearsState,
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

// Spec 134 (core-api#1092) — "Criar a partir do ano de".
describe('validateCreatePlan — importar de outro ano (spec 134)', () => {
  it('importar ligado sem ano de origem → requiredImportYear', () => {
    assert.equal(
      validateCreatePlan(formWith({ year: '2027', program: REF, importData: true, importFromYear: '' })),
      'budget-plans.create.requiredImportYear',
    )
  })
  it('ano de origem = ano do plano → importSameYear', () => {
    assert.equal(
      validateCreatePlan(formWith({ year: '2027', program: REF, importData: true, importFromYear: '2027' })),
      'budget-plans.create.importSameYear',
    )
  })
  it('importar ligado com ano diferente → null', () => {
    assert.equal(
      validateCreatePlan(formWith({ year: '2027', program: REF, importData: true, importFromYear: '2026' })),
      null,
    )
  })
  it('importar DESLIGADO ignora o ano de origem', () => {
    assert.equal(
      validateCreatePlan(formWith({ year: '2027', program: REF, importData: false, importFromYear: '2027' })),
      null,
    )
  })
})

describe('toCreateInput (spec 134)', () => {
  it('importar ligado → manda importFromYear numérico', () => {
    assert.deepEqual(
      toCreateInput(formWith({ year: '2027', program: REF, importData: true, importFromYear: '2026' })),
      { year: 2027, programRef: REF, importFromYear: 2026 },
    )
  })
  it('importar desligado → sem a chave (plano nasce vazio)', () => {
    const input = toCreateInput(
      formWith({ year: '2027', program: REF, importData: false, importFromYear: '2026' }),
    )
    assert.deepEqual(input, { year: 2027, programRef: REF })
    assert.equal('importFromYear' in input, false)
  })
})

describe('importYearsState (spec 134)', () => {
  it('sem programa → needs-program (mesmo com anos em cache)', () => {
    assert.deepEqual(importYearsState('', '2027', [2026]), { kind: 'needs-program' })
  })
  it('carregando → loading', () => {
    assert.deepEqual(importYearsState(REF, '2027', undefined), { kind: 'loading' })
  })
  it('falha na leitura → failed (não "nenhum plano")', () => {
    assert.deepEqual(importYearsState(REF, '2027', null), { kind: 'failed' })
  })
  it('tira o ano do próprio plano novo da lista', () => {
    assert.deepEqual(importYearsState(REF, '2026', [2026, 2025]), { kind: 'ready', years: [2025] })
  })
  it('só sobra o próprio ano → empty', () => {
    assert.deepEqual(importYearsState(REF, '2026', [2026]), { kind: 'empty' })
  })
  it('nenhum aprovado → empty', () => {
    assert.deepEqual(importYearsState(REF, '2027', []), { kind: 'empty' })
  })
})

describe('createErrorTag — erros da importação (spec 134)', () => {
  it('mesmo ano → importSameYear', () => {
    assert.equal(createErrorTag('budget-plan-import-same-year'), 'budget-plans.create.importSameYear')
  })
  it('origem sem plano aprovado → importSourceNotApproved (não "já existe")', () => {
    assert.equal(
      createErrorTag('budget-plan-import-source-not-approved'),
      'budget-plans.create.importSourceNotApproved',
    )
  })
  it('lançamento órfão na origem → importOrphan', () => {
    assert.equal(createErrorTag('budget-result-orphan-subcategory'), 'budget-plans.create.importOrphan')
  })
})
