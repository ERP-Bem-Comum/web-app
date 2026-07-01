/**
 * autocadastroViewModel — derivação PURA (node:test) do Autocadastro (#040). Cobre:
 * - derivePageState: token ausente → 'invalid'; sem result → 'loading'; erro 'autocadastro-invalid' →
 *   'invalid'; erro de rede → 'loading' (a página nunca mostra o form sem preview); ok → 'ready'.
 * - canSubmit: gate do botão por cpfPrefix (< 3 → false; ≥ 3 dígitos → true; ignora não-dígitos).
 * - toErrorTag: PartnersError → tag i18n (incl. os 2 erros do #040).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { ok, err } from '#shared/primitives/result.ts'
import type { AutocadastroPreview } from '#modules/partners/public-api/index.ts'
import { autocadastroViewModel } from '#modules/partners/client/collaborator-autocadastro/viewModel/autocadastro.view-model.ts'

const preview: AutocadastroPreview = {
  collaboratorId: 'c-1',
  name: 'Maria',
  cpfMasked: '***.***.789-**',
}

describe('autocadastroViewModel.derivePageState', () => {
  it('token null → invalid (sem buscar)', () => {
    const s = autocadastroViewModel.derivePageState({ token: null, pending: false, result: undefined })
    assert.equal(s.status, 'invalid')
  })

  it('token vazio/whitespace → invalid', () => {
    const s = autocadastroViewModel.derivePageState({ token: '   ', pending: false, result: undefined })
    assert.equal(s.status, 'invalid')
  })

  it('token presente mas sem result ainda → loading', () => {
    const s = autocadastroViewModel.derivePageState({ token: 'tk', pending: true, result: undefined })
    assert.equal(s.status, 'loading')
  })

  it('preview erro autocadastro-invalid (404) → invalid', () => {
    const s = autocadastroViewModel.derivePageState({
      token: 'tk',
      pending: false,
      result: err('autocadastro-invalid'),
    })
    assert.equal(s.status, 'invalid')
  })

  it('preview erro de rede/servidor → loading (não expõe form sem preview)', () => {
    const s = autocadastroViewModel.derivePageState({
      token: 'tk',
      pending: false,
      result: err('connectivity'),
    })
    assert.equal(s.status, 'loading')
  })

  it('preview ok → ready com o preview', () => {
    const s = autocadastroViewModel.derivePageState({ token: 'tk', pending: false, result: ok(preview) })
    assert.equal(s.status, 'ready')
    if (s.status === 'ready') assert.deepEqual(s.preview, preview)
  })
})

describe('autocadastroViewModel.canSubmit (gate do botão)', () => {
  it('cpfPrefix vazio → false', () => {
    assert.equal(autocadastroViewModel.canSubmit(''), false)
  })
  it('2 dígitos → false', () => {
    assert.equal(autocadastroViewModel.canSubmit('12'), false)
  })
  it('3 dígitos → true', () => {
    assert.equal(autocadastroViewModel.canSubmit('123'), true)
  })
  it('conta só dígitos: "1.2" (2 dígitos) → false', () => {
    assert.equal(autocadastroViewModel.canSubmit('1.2'), false)
  })
  it('com máscara "123.4" (4 dígitos) → true', () => {
    assert.equal(autocadastroViewModel.canSubmit('123.4'), true)
  })
  it('só não-dígitos → false', () => {
    assert.equal(autocadastroViewModel.canSubmit('abc'), false)
  })
})

describe('autocadastroViewModel.onlyDigits', () => {
  it('remove máscara e não-dígitos', () => {
    assert.equal(autocadastroViewModel.onlyDigits('123.456'), '123456')
    assert.equal(autocadastroViewModel.onlyDigits('a1b2'), '12')
  })
})

describe('autocadastroViewModel.toErrorTag', () => {
  it('autocadastro-invalid → tag específica', () => {
    assert.equal(
      autocadastroViewModel.toErrorTag('autocadastro-invalid'),
      'partners.error.autocadastro-invalid',
    )
  })
  it('autocadastro-cpf-mismatch → tag específica', () => {
    assert.equal(
      autocadastroViewModel.toErrorTag('autocadastro-cpf-mismatch'),
      'partners.error.autocadastro-cpf-mismatch',
    )
  })
  it('server → tag genérica', () => {
    assert.equal(autocadastroViewModel.toErrorTag('server'), 'partners.error.server')
  })
})
