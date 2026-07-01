/**
 * Build do submit do Autocadastro (#040) — node:test PURO. O `buildSubmit` do controller (React) é
 * `{ token, cpfPrefix: onlyDigits(cpfPrefix), ...buildCompleteFields(state) }`. Aqui validamos as PARTES
 * puras que ele compõe: reuso de `buildCompleteFields` (mesma saída do detail) + normalização do cpfPrefix
 * + presença do token. Assim garantimos o contrato sem renderizar hooks.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  emptyCompleteFieldsState,
  buildCompleteFields,
} from '#modules/partners/client/collaborator-detail/components/collaborator-complete-fields.ts'
import { autocadastroViewModel } from '#modules/partners/client/collaborator-autocadastro/viewModel/autocadastro.view-model.ts'
import type { AutocadastroSubmitInput } from '#modules/partners/public-api/index.ts'

// Réplica pura do que `useAutocadastroFormController.buildSubmit(token)` monta (sem React).
const buildSubmit = (
  token: string,
  cpfPrefixRaw: string,
  state = emptyCompleteFieldsState,
): AutocadastroSubmitInput => ({
  token,
  cpfPrefix: autocadastroViewModel.onlyDigits(cpfPrefixRaw),
  ...buildCompleteFields(state),
})

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
      ...emptyCompleteFieldsState,
      rg: '12.345.678-9',
      sex: 'F',
      hasChildren: 'sim' as const,
      childrenCount: '2',
      childrenAges: '5 anos, 12 anos',
      isPwd: 'nao' as const,
    }
    const input = buildSubmit('tk', '123', filled)
    const { token: _t, cpfPrefix: _c, ...fields } = input
    assert.deepEqual(fields, buildCompleteFields(filled))
    // sanity: tri-state e idades resolvidos como no detail
    assert.equal(input.sex, 'F')
    assert.equal(input.hasChildren, true)
    assert.equal(input.isPwd, false)
    assert.deepEqual(input.childrenAges, [5, 12])
    assert.equal(input.childrenCount, 2)
  })
})
