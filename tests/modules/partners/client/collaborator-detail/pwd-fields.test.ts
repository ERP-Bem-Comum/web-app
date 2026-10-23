/**
 * Pessoa com Deficiência (spec 131) — núcleo PURO do form (node:test, sem React/DOM): o que falta na resposta
 * (`pwdIssues`), o input para o core-api (`buildPwdInput`), a régua de "completo" que trava o campo
 * (`isPwdComplete` / `lockedPersonalFrom().pwd`), o marcar/desmarcar de tipos e a validação do detalhe.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  buildPwdInput,
  isPwdComplete,
  pwdIssues,
  pwdStateFrom,
  togglePwdType,
  type CollaboratorCompleteFieldsState,
} from '#modules/partners/client/collaborator-detail/components/collaborator-complete-fields.ts'
import {
  lockedPersonalFrom,
  stateFromDetail,
  validatePwd,
  type CollaboratorDetailFormState,
} from '#modules/partners/client/collaborator-detail/components/collaborator-detail-form.controller.ts'
import type { CollaboratorDetail, Pwd } from '#modules/partners/client/data/model/collaborator.model.ts'

type PwdState = Pick<CollaboratorCompleteFieldsState, 'pwdAnswer' | 'pwdTypes' | 'pwdOtherDescription'>

const pwd = (over: Partial<PwdState> = {}): PwdState => ({
  pwdAnswer: '',
  pwdTypes: [],
  pwdOtherDescription: '',
  ...over,
})

const detail = (p: Pwd | undefined): CollaboratorDetail => ({
  id: 'c-1',
  name: 'Fulana',
  email: 'f@x.org',
  occupationArea: 'PARC',
  role: 'Dev',
  registration: 'complete',
  activation: 'active',
  contractCount: 0,
  cpf: '12345678901',
  startOfContract: '2024-01-01T00:00:00.000Z',
  employmentRelationship: 'CLT',
  territory: null,
  bankAccount: null,
  pixKey: null,
  ...(p !== undefined ? { pwd: p } : {}),
})

describe('pwdIssues', () => {
  it('sem resposta: obrigatório → answer-required; opcional → nada', () => {
    assert.deepEqual(pwdIssues(pwd(), { required: true }), ['answer-required'])
    assert.deepEqual(pwdIssues(pwd(), { required: false }), [])
  })

  it('"Não" e "Prefiro não responder" → completos', () => {
    assert.deepEqual(pwdIssues(pwd({ pwdAnswer: 'NAO' }), { required: true }), [])
    assert.deepEqual(pwdIssues(pwd({ pwdAnswer: 'PREFIRO_NAO_RESPONDER' }), { required: true }), [])
  })

  it('"Sim" sem tipo → type-required (obrigatório ou não)', () => {
    assert.deepEqual(pwdIssues(pwd({ pwdAnswer: 'SIM' }), { required: true }), ['type-required'])
    assert.deepEqual(pwdIssues(pwd({ pwdAnswer: 'SIM' }), { required: false }), ['type-required'])
  })

  it('"Sim" + "Outra" sem texto (ou só espaços) → other-required', () => {
    const s = pwd({ pwdAnswer: 'SIM', pwdTypes: ['OUTRA'], pwdOtherDescription: '   ' })
    assert.deepEqual(pwdIssues(s, { required: false }), ['other-required'])
  })

  it('"Sim" com tipo (e texto em "Outra") → completo', () => {
    assert.deepEqual(pwdIssues(pwd({ pwdAnswer: 'SIM', pwdTypes: ['VISUAL'] }), { required: true }), [])
    const s = pwd({ pwdAnswer: 'SIM', pwdTypes: ['OUTRA'], pwdOtherDescription: 'Dislexia' })
    assert.deepEqual(pwdIssues(s, { required: true }), [])
  })
})

describe('buildPwdInput', () => {
  it('sem resposta → undefined (mantém o gravado)', () => {
    assert.equal(buildPwdInput(pwd()), undefined)
  })

  it('"Não" → só a resposta, mesmo com tipos/texto sobrando no estado', () => {
    const s = pwd({ pwdAnswer: 'NAO', pwdTypes: ['VISUAL'], pwdOtherDescription: 'x' })
    assert.deepEqual(buildPwdInput(s), { answer: 'NAO' })
  })

  it('"Sim" → tipos na ordem do formulário, não na ordem em que foram marcados', () => {
    const s = pwd({ pwdAnswer: 'SIM', pwdTypes: ['TEA', 'FISICA', 'AUDITIVA'] })
    assert.deepEqual(buildPwdInput(s), { answer: 'SIM', types: ['FISICA', 'AUDITIVA', 'TEA'] })
  })

  it('texto só vai com "Outra", aparado', () => {
    const s = pwd({ pwdAnswer: 'SIM', pwdTypes: ['OUTRA', 'VISUAL'], pwdOtherDescription: '  Dislexia ' })
    assert.deepEqual(buildPwdInput(s), {
      answer: 'SIM',
      types: ['VISUAL', 'OUTRA'],
      otherDescription: 'Dislexia',
    })
  })

  it('desmarcar "Outra" descarta o texto digitado', () => {
    const s = pwd({ pwdAnswer: 'SIM', pwdTypes: ['VISUAL'], pwdOtherDescription: 'Dislexia' })
    assert.deepEqual(buildPwdInput(s), { answer: 'SIM', types: ['VISUAL'] })
  })
})

describe('isPwdComplete', () => {
  it('incompletos: não respondeu, "Sim" sem tipo, "Outra" sem texto', () => {
    assert.equal(isPwdComplete(undefined), false)
    assert.equal(isPwdComplete({ answer: 'SIM', types: [], otherDescription: null }), false)
    assert.equal(isPwdComplete({ answer: 'SIM', types: ['OUTRA'], otherDescription: null }), false)
    assert.equal(isPwdComplete({ answer: 'SIM', types: ['OUTRA'], otherDescription: '  ' }), false)
  })

  it('completos: "Não", "Prefiro não responder", "Sim" com tipo', () => {
    assert.equal(isPwdComplete({ answer: 'NAO', types: [], otherDescription: null }), true)
    assert.equal(isPwdComplete({ answer: 'PREFIRO_NAO_RESPONDER', types: [], otherDescription: null }), true)
    assert.equal(isPwdComplete({ answer: 'SIM', types: ['VISUAL'], otherDescription: null }), true)
    assert.equal(isPwdComplete({ answer: 'SIM', types: ['OUTRA'], otherDescription: 'Dislexia' }), true)
  })
})

describe('togglePwdType', () => {
  it('marcar mantém a ordem do formulário', () => {
    assert.deepEqual(togglePwdType(['TEA'], 'FISICA', true), ['FISICA', 'TEA'])
    assert.deepEqual(togglePwdType(['FISICA', 'TEA'], 'VISUAL', true), ['FISICA', 'VISUAL', 'TEA'])
  })

  it('desmarcar remove só o tipo; marcar de novo não duplica', () => {
    assert.deepEqual(togglePwdType(['FISICA', 'VISUAL', 'TEA'], 'VISUAL', false), ['FISICA', 'TEA'])
    assert.deepEqual(togglePwdType(['VISUAL'], 'VISUAL', true), ['VISUAL'])
  })
})

describe('pwdStateFrom', () => {
  it('não respondeu → tudo vazio; gravado → hidrata resposta, tipos e texto', () => {
    assert.deepEqual(pwdStateFrom(undefined), { pwdAnswer: '', pwdTypes: [], pwdOtherDescription: '' })
    assert.deepEqual(pwdStateFrom({ answer: 'SIM', types: ['OUTRA'], otherDescription: 'Dislexia' }), {
      pwdAnswer: 'SIM',
      pwdTypes: ['OUTRA'],
      pwdOtherDescription: 'Dislexia',
    })
  })
})

describe('lockedPersonalFrom(detail).pwd — trava só quando COMPLETO', () => {
  it('não respondeu ou "Sim" sem tipo (dado antigo) → aberto', () => {
    assert.equal(lockedPersonalFrom(detail(undefined)).pwd, false)
    assert.equal(lockedPersonalFrom(detail({ answer: 'SIM', types: [], otherDescription: null })).pwd, false)
  })

  it('"Não" ou "Sim" com tipo → travado', () => {
    assert.equal(lockedPersonalFrom(detail({ answer: 'NAO', types: [], otherDescription: null })).pwd, true)
    assert.equal(
      lockedPersonalFrom(detail({ answer: 'SIM', types: ['TEA'], otherDescription: null })).pwd,
      true,
    )
  })
})

describe('validatePwd (detalhe — pergunta opcional, resposta completa)', () => {
  const state = (over: Partial<PwdState>): CollaboratorDetailFormState => ({
    ...stateFromDetail(detail(undefined)),
    ...over,
  })

  it('sem resposta, "Não" ou "Sim" completo → sem erro', () => {
    assert.deepEqual(validatePwd(state({})), {})
    assert.deepEqual(validatePwd(state({ pwdAnswer: 'NAO' })), {})
    assert.deepEqual(validatePwd(state({ pwdAnswer: 'SIM', pwdTypes: ['VISUAL'] })), {})
  })

  it('"Sim" sem tipo → pwd.types', () => {
    assert.deepEqual(validatePwd(state({ pwdAnswer: 'SIM' })), { 'pwd.types': true })
  })

  it('"Outra" sem texto → pwd.other', () => {
    assert.deepEqual(validatePwd(state({ pwdAnswer: 'SIM', pwdTypes: ['OUTRA'] })), { 'pwd.other': true })
  })
})
