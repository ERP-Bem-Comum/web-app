import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// T004 (TDD vermelho) — lógica PURA de variante do Button (node:test, import relativo).
// Decisão A1: a escolha do estado visual é uma função pura `resolveButtonState(disabled, loading)`
// (sem DOM/CSS) que o button.tsx usa para indexar o mapa `buttonState` do .css.ts.
// node:test não roda o plugin do vanilla-extract → testamos a FUNÇÃO, não o .css.ts.
import { resolveButtonState } from '../../../../src/shared/ui/atoms/button/button-state.ts'

describe('resolveButtonState — qual estado visual aplicar', () => {
  it('normal quando habilitado', () => {
    assert.equal(resolveButtonState(false, false), 'normal')
  })

  it('loading tem precedência (mostra carregando mesmo se também disabled)', () => {
    assert.equal(resolveButtonState(false, true), 'loading')
    assert.equal(resolveButtonState(true, true), 'loading')
  })

  it('disabled quando desabilitado e não-carregando', () => {
    assert.equal(resolveButtonState(true, false), 'disabled')
  })
})
