/**
 * client/data Model — Zod do input de login + usuário atual (padronização client-side). §VI.
 * TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  LoginInputSchema,
  CurrentUserSchema,
} from '#modules/auth/client/data/model/auth.model.ts'

describe('LoginInputSchema', () => {
  it('aceita email + senha + rememberDevice', () => {
    const r = LoginInputSchema.safeParse({ email: 'a@b.com', password: 'p', rememberDevice: false })
    assert.equal(r.success, true)
  })
  it('rejeita email inválido', () => {
    assert.equal(LoginInputSchema.safeParse({ email: 'x', password: 'p', rememberDevice: false }).success, false)
  })
  it('rejeita senha vazia', () => {
    assert.equal(LoginInputSchema.safeParse({ email: 'a@b.com', password: '', rememberDevice: false }).success, false)
  })
})

describe('CurrentUserSchema', () => {
  it('aceita { userId }', () => {
    assert.equal(CurrentUserSchema.safeParse({ userId: 'u' }).success, true)
  })
})
