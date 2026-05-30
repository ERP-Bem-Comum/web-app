import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// T013 (US3): prova que o contrato é extensível — um SEGUNDO conjunto de valores (ex.: dark)
// satisfaz a MESMA forma que `tokenValues`, logo `createGlobalTheme(darkSelector, vars, dark)`
// type-checaria sem tocar nos consumidores de `vars` (FR-010).
//
// Não importa `contract.css.ts` (exige o compilador do vanilla-extract; não roda em node:test
// puro). A extensibilidade é provada contra a FORMA de `tokens.values.ts`, que É o contrato.
import { tokenValues, type TokenValues } from '../../../../src/shared/ui/tokens/tokens.values.ts'

// Caminhos de todas as folhas (ex.: "color.brand.normal"), ordenados — a "forma" do objeto.
function leafPaths(node: unknown, prefix = '', acc: string[] = []): string[] {
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      leafPaths(v, prefix ? `${prefix}.${k}` : k, acc)
    }
  } else {
    acc.push(prefix)
  }
  return acc
}

describe('contract — extensibilidade (tema alternativo)', () => {
  it('um tema dark fictício satisfaz a MESMA forma do contrato', () => {
    // `satisfies TokenValues` garante em COMPILE-TIME que a forma bate (chaves obrigatórias).
    // Valores arbitrários (não precisam ser fiéis — é só prova de forma).
    const darkValues = {
      color: {
        brand: {
          normal: '#0a84ff',
          hover: '#409cff',
          onBrand: '#ffffff',
          disabled: '#3a3a3c',
          onDisabled: '#8e8e93',
        },
        surface: { default: '#1c1c1e', raised: '#2c2c2e' },
        text: { primary: '#f2f2f7', secondary: '#c7c7cc', muted: '#8e8e93', onBrand: '#ffffff' },
        border: { default: '#38383a', focus: '#0a84ff' },
        feedback: { errorBg: '#3a1f1f', errorText: '#ff6961' },
      },
      radius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem' },
      space: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
      font: {
        family: { heading: 'X', body: 'Y', mono: 'Z' },
        size: { xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.25rem', xl: '1.5rem' },
        weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
      },
      shadow: { card: 'none' },
    } satisfies TokenValues

    // Em runtime, confirma que as duas formas têm exatamente os mesmos caminhos de folha.
    assert.deepEqual(leafPaths(darkValues).toSorted(), leafPaths(tokenValues).toSorted())
  })
})
