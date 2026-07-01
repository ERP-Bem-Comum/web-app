/**
 * Use-cases do Autocadastro (#040) — thin sobre a porta AutocadastroClient. Fake inline (fixture só em
 * tests/, ADR-0011). Confirma que o Result do client atravessa sem transformação (preview/submit).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { ok, err, isOk, isErr } from '#shared/primitives/result.ts'
import {
  createAutocadastroPreview,
  createAutocadastroSubmit,
  type AutocadastroClient,
} from '#modules/partners/server/application/collaborator/collaborator-autocadastro.use-cases.ts'
import type { AutocadastroSubmitInput } from '#modules/partners/server/domain/collaborator/collaborator-autocadastro.io.ts'

const submitInput: AutocadastroSubmitInput = { token: 't', cpfPrefix: '123' }

const fakeClient = (over: Partial<AutocadastroClient> = {}): AutocadastroClient => ({
  preview: () => Promise.resolve(ok({ collaboratorId: 'c1', name: 'Ana', cpfMasked: '***' })),
  submit: () => Promise.resolve(ok(undefined)),
  ...over,
})

describe('createAutocadastroPreview', () => {
  it('ok(preview) atravessa', async () => {
    const r = await createAutocadastroPreview({ client: fakeClient() })('t')
    assert.equal(isOk(r) && r.value.name === 'Ana', true)
  })

  it('err(autocadastro-invalid) atravessa', async () => {
    const client = fakeClient({ preview: () => Promise.resolve(err('autocadastro-invalid')) })
    const r = await createAutocadastroPreview({ client })('t')
    assert.equal(isErr(r) && r.error === 'autocadastro-invalid', true)
  })
})

describe('createAutocadastroSubmit', () => {
  it('ok atravessa', async () => {
    const r = await createAutocadastroSubmit({ client: fakeClient() })(submitInput)
    assert.equal(isOk(r), true)
  })

  it('err(autocadastro-cpf-mismatch) atravessa', async () => {
    const client = fakeClient({ submit: () => Promise.resolve(err('autocadastro-cpf-mismatch')) })
    const r = await createAutocadastroSubmit({ client })(submitInput)
    assert.equal(isErr(r) && r.error === 'autocadastro-cpf-mismatch', true)
  })
})
