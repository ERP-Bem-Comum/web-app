/**
 * i18n — catálogo de tags (strings de UI = chaves). §XI: sem literais hardcoded.
 * TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createTranslator } from '../../../src/shared/i18n/index.ts'

describe('createTranslator', () => {
  it('resolve uma chave conhecida para o texto do catálogo', () => {
    const t = createTranslator({ 'auth.login.title': 'Entrar' })

    assert.equal(t('auth.login.title'), 'Entrar')
  })

  it('faz fallback para a própria chave quando ausente (sem quebrar)', () => {
    const t = createTranslator({})

    assert.equal(t('auth.error.unexpected'), 'auth.error.unexpected')
  })
})
