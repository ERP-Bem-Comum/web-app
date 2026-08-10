/**
 * forgotPasswordViewModel — derivação PURA (node:test). Só mapeia erro → tag i18n e expõe a mutation.
 * O sucesso é uniforme (anti-enumeração) e é decidido no binding a partir do Result.ok — aqui só ERRO.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { forgotPasswordViewModel } from '#modules/auth/client/forgot-password/viewModel/forgot-password.view-model.ts'

describe('forgotPasswordViewModel.toErrorTag', () => {
  it('connectivity → tag de conectividade', () => {
    assert.equal(forgotPasswordViewModel.toErrorTag('connectivity'), 'auth.error.connectivity')
  })
  it('server → tag genérica (não vaza detalhe)', () => {
    assert.equal(forgotPasswordViewModel.toErrorTag('server'), 'auth.error.unexpected')
  })
  it('unexpectedErrorTag é a tag genérica', () => {
    assert.equal(forgotPasswordViewModel.unexpectedErrorTag, 'auth.error.unexpected')
  })
})
