/**
 * Schemas Zod do Autocadastro (#040) — validação da borda (§IX). Confirma o gating do cpfPrefix
 * (só-dígitos, 3..14), o token obrigatório e que os campos da 2ª fase são aceitos (reuso do complete).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  AutocadastroPreviewInputSchema,
  AutocadastroSubmitInputSchema,
} from '#modules/partners/server/adapters/collaborator-autocadastro.io-schemas.ts'

describe('AutocadastroPreviewInputSchema', () => {
  it('token válido → ok', () => {
    assert.equal(AutocadastroPreviewInputSchema.safeParse({ token: 'abc' }).success, true)
  })
  it('token vazio → falha', () => {
    assert.equal(AutocadastroPreviewInputSchema.safeParse({ token: '' }).success, false)
  })
})

describe('AutocadastroSubmitInputSchema', () => {
  it('token + cpfPrefix (3 dígitos) + campos opcionais → ok', () => {
    const parsed = AutocadastroSubmitInputSchema.safeParse({
      token: 't',
      cpfPrefix: '123',
      biography: 'Olá',
    })
    assert.equal(parsed.success, true)
  })

  it('NÃO aceita id (o backend identifica pelo token)', () => {
    const parsed = AutocadastroSubmitInputSchema.safeParse({ token: 't', cpfPrefix: '123', id: 'x' })
    // z.object faz strip de chaves desconhecidas: `id` some do resultado (não vaza p/ o backend).
    assert.equal(parsed.success, true)
    if (parsed.success) assert.equal('id' in parsed.data, false)
  })

  it('cpfPrefix com < 3 dígitos → falha', () => {
    assert.equal(AutocadastroSubmitInputSchema.safeParse({ token: 't', cpfPrefix: '12' }).success, false)
  })

  it('cpfPrefix não-numérico → falha', () => {
    assert.equal(AutocadastroSubmitInputSchema.safeParse({ token: 't', cpfPrefix: '12a' }).success, false)
  })

  it('cpfPrefix com > 14 dígitos → falha', () => {
    assert.equal(
      AutocadastroSubmitInputSchema.safeParse({ token: 't', cpfPrefix: '123456789012345' }).success,
      false,
    )
  })

  it('token ausente → falha', () => {
    assert.equal(AutocadastroSubmitInputSchema.safeParse({ cpfPrefix: '123' }).success, false)
  })
})
