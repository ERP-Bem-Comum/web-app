/**
 * Build do submit do Autocadastro (#040) — node:test PURO. O `buildSubmit` do controller (React) é
 * `{ token, cpfPrefix: onlyDigits(cpfPrefix), pwd, ...buildCompleteFields(state) }`, ou `null` enquanto o PcD
 * (spec 131, obrigatório no autocadastro) estiver incompleto. Aqui validamos as PARTES
 * puras que ele compõe: reuso de `buildCompleteFields` (mesma saída do detail) + normalização do cpfPrefix
 * + presença do token. Assim garantimos o contrato sem renderizar hooks.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  emptyCompleteFieldsState,
  buildCompleteFields,
  pwdIssues,
  type CollaboratorCompleteFieldsState,
} from '#modules/partners/client/collaborator-detail/components/collaborator-complete-fields.ts'
import { autocadastroViewModel } from '#modules/partners/client/collaborator-autocadastro/viewModel/autocadastro.view-model.ts'
import type { AutocadastroSubmitInput } from '#modules/partners/public-api/index.ts'

// PcD respondido "Não" — o mínimo para o autocadastro poder enviar (spec 131).
const answered: CollaboratorCompleteFieldsState = { ...emptyCompleteFieldsState, pwdAnswer: 'NAO' }

// Réplica pura do que `useAutocadastroFormController.buildSubmit(token)` monta (sem React).
const buildSubmitOrNull = (
  token: string,
  cpfPrefixRaw: string,
  state: CollaboratorCompleteFieldsState,
): AutocadastroSubmitInput | null => {
  const { pwd, ...fields } = buildCompleteFields(state)
  if (pwd === undefined || pwdIssues(state, { required: true }).length > 0) return null
  return { token, cpfPrefix: autocadastroViewModel.onlyDigits(cpfPrefixRaw), pwd, ...fields }
}

const buildSubmit = (
  token: string,
  cpfPrefixRaw: string,
  state: CollaboratorCompleteFieldsState = answered,
): AutocadastroSubmitInput => {
  const input = buildSubmitOrNull(token, cpfPrefixRaw, state)
  assert.ok(input !== null, 'PcD respondido deveria permitir o envio')
  return input
}

describe('buildSubmit (Autocadastro #040)', () => {
  it('inclui token + cpfPrefix normalizado (só dígitos)', () => {
    const input = buildSubmit('token-123', '123.4')
    assert.equal(input.token, 'token-123')
    assert.equal(input.cpfPrefix, '1234')
  })

  it('estado vazio → campos da 2ª fase todos undefined (via buildCompleteFields)', () => {
    const input = buildSubmit('tk', '123')
    // Amostra representativa dos campos do complete-registration.
    assert.equal(input.rg, undefined)
    assert.equal(input.dateOfBirth, undefined)
    assert.equal(input.sex, undefined)
    assert.equal(input.hasChildren, undefined)
    assert.equal(input.childrenAges, undefined)
  })

  it('reusa EXATAMENTE buildCompleteFields (mesmo objeto de campos do detail)', () => {
    const filled = {
      ...answered,
      rg: '12.345.678-9',
      sex: 'F',
      hasChildren: 'sim' as const,
      childrenCount: '2',
      childrenAges: '5 anos, 12 anos',
    }
    const input = buildSubmit('tk', '123', filled)
    const { token: _t, cpfPrefix: _c, ...fields } = input
    assert.deepEqual(fields, buildCompleteFields(filled))
    // sanity: tri-state e idades resolvidos como no detail
    assert.equal(input.sex, 'F')
    assert.equal(input.hasChildren, true)
    assert.deepEqual(input.pwd, { answer: 'NAO' })
    assert.deepEqual(input.childrenAges, [5, 12])
    assert.equal(input.childrenCount, 2)
  })
})

describe('genderIdentityDescription (core-api#1054) — só vai junto de "Outra"', () => {
  it('"Outra" + texto → envia o texto aparado', () => {
    const input = buildSubmit('tk', '123', {
      ...answered,
      genderIdentity: 'OUTRO',
      genderIdentityDescription: '  Agênero ',
    })
    assert.equal(input.genderIdentity, 'OUTRO')
    assert.equal(input.genderIdentityDescription, 'Agênero')
  })

  it('"Outra" sem texto → descrição undefined (o texto é opcional)', () => {
    const input = buildSubmit('tk', '123', { ...answered, genderIdentity: 'OUTRO' })
    assert.equal(input.genderIdentityDescription, undefined)
  })

  it('outra identidade com texto sobrando no estado → NÃO envia (o core-api recusaria com 422)', () => {
    const input = buildSubmit('tk', '123', {
      ...answered,
      genderIdentity: 'MULHER_CIS',
      genderIdentityDescription: 'Agênero',
    })
    assert.equal(input.genderIdentityDescription, undefined)
  })
})

describe('PcD no Autocadastro (spec 131) — a pergunta 1 é obrigatória', () => {
  it('sem resposta → null (não envia)', () => {
    assert.equal(buildSubmitOrNull('tk', '123', emptyCompleteFieldsState), null)
  })

  it('"Sim" sem tipo → null', () => {
    assert.equal(buildSubmitOrNull('tk', '123', { ...emptyCompleteFieldsState, pwdAnswer: 'SIM' }), null)
  })

  it('"Sim" com "Outra" sem texto → null', () => {
    const state = { ...emptyCompleteFieldsState, pwdAnswer: 'SIM' as const, pwdTypes: ['OUTRA' as const] }
    assert.equal(buildSubmitOrNull('tk', '123', state), null)
  })

  it('"Prefiro não responder" → envia com pwd', () => {
    const input = buildSubmitOrNull('tk', '123', {
      ...emptyCompleteFieldsState,
      pwdAnswer: 'PREFIRO_NAO_RESPONDER',
    })
    assert.deepEqual(input?.pwd, { answer: 'PREFIRO_NAO_RESPONDER' })
  })

  it('"Sim" completo → envia tipos e texto de "Outra"', () => {
    const input = buildSubmitOrNull('tk', '123', {
      ...emptyCompleteFieldsState,
      pwdAnswer: 'SIM',
      pwdTypes: ['OUTRA', 'VISUAL'],
      pwdOtherDescription: ' Dislexia ',
    })
    assert.deepEqual(input?.pwd, { answer: 'SIM', types: ['VISUAL', 'OUTRA'], otherDescription: 'Dislexia' })
  })
})
