import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// T013 (US3): prova que o contrato é extensível — um SEGUNDO conjunto de valores (ex.: dark)
// satisfaz a MESMA forma que `tokenValues`, logo `createGlobalTheme(darkSelector, vars, dark)`
// type-checaria sem tocar nos consumidores de `vars` (FR-010).
//
// Não importa `contract.css.ts` (exige o compilador do vanilla-extract; não roda em node:test
// puro). A extensibilidade é provada contra a FORMA de `tokens.values.ts`, que É o contrato.
import { tokenValues, type TokenShape } from '../../../../src/shared/ui/tokens/tokens.values.ts'

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
        surface: {
          default: '#1c1c1e',
          raised: '#2c2c2e',
          canvas: '#0d1b1f',
          subtle: '#23232a',
          app: '#15151a',
        },
        text: { primary: '#f2f2f7', secondary: '#c7c7cc', muted: '#8e8e93', onBrand: '#ffffff' },
        border: { default: '#38383a', focus: '#0a84ff', subtle: '#2a3a40' },
        feedback: { errorBg: '#3a1f1f', errorText: '#ff6961' },
        nav: {
          background: '#1a1c2e',
          surface: '#1c1c1e',
          itemActive: '#0a84ff',
          itemHover: 'rgba(255,255,255,0.08)',
          submenuBackground: 'rgba(0,0,0,0.30)',
          textActive: '#ffffff',
          textMuted: '#8a8d9f',
          ink: '#f2f2f7',
          textOnSurface: '#c7c7cc',
          border: '#38383a',
          surfaceHover: '#2c2c2e',
        },
        status: {
          pendingBg: '#3a2f1f',
          pendingText: '#ffb74d',
          activeBg: '#1f3a28',
          activeText: '#81c784',
          finishedBg: '#1f2f3a',
          finishedText: '#64b5f6',
          terminatedBg: '#3a1f24',
          terminatedText: '#e57373',
          cancelledBg: '#2a2620',
          cancelledText: '#bdbdbd',
          prazoBg: '#1f3438',
          prazoText: '#4dd0e1',
          valorBg: '#1f3a28',
          valorText: '#66bb6a',
          escopoBg: '#3a341f',
          escopoText: '#ffd54f',
          distratoBg: '#3a1f24',
          distratoText: '#ef9a9a',
          outroBg: '#2a2a2a',
          outroText: '#bdbdbd',
          aditEscopoBg: '#2e2820',
          aditEscopoText: '#c8a06a',
          aditOutroBg: '#3a2e1f',
          aditOutroText: '#ffb774',
        },
        partnerType: {
          supplier: {
            text: '#81c784',
            background: 'rgba(129,199,132,0.10)',
            border: 'rgba(129,199,132,0.20)',
          },
          collaborator: { text: '#64b5f6', background: '#1f2f3a', border: '#3a5f7a' },
          financier: { text: '#ffd54f', background: '#3a341f', border: 'rgba(255,213,79,0.25)' },
          act: { text: '#ffb74d', background: 'rgba(255,183,77,0.08)', border: 'rgba(255,183,77,0.20)' },
        },
        institutional: {
          blue: '#5a8cc8',
          blueDeep: '#3a5f8a',
          blueBg: '#1f2a38',
          blueLine: '#4a6f9a',
          green: '#4caf80',
          greenDeep: '#2e7d55',
          orange: '#ffb74d',
          orangeLight: '#3a341f',
          ink2: '#e0dcd6',
          ink3: '#c4beb6',
          ink4: '#a39b91',
          ink5: '#7d756b',
          paperRule: '#38342e',
          paperWarm: '#2a2620',
          paperBeige: '#231f18',
          overlay: 'rgba(255,255,255,0.45)',
          surfaceTranslucent: 'rgba(0,0,0,0.92)',
        },
      },
      radius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem' },
      space: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
      font: {
        family: { heading: 'X', body: 'Y', mono: 'Z' },
        size: { '2xs': '0.5625rem', xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.25rem', xl: '1.5rem' },
        weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
      },
      shadow: { card: 'none', cardElevated: 'none' },
      focusRing: { width: '3px', offset: '1px' },
      borderWidth: { hairline: '0.25px', thin: '0.5px', thick: '1.5px' },
      size: { topbar: '4rem' },
    } satisfies TokenShape

    // Em runtime, confirma que as duas formas têm exatamente os mesmos caminhos de folha.
    assert.deepEqual([...leafPaths(darkValues)].sort(), [...leafPaths(tokenValues)].sort())
  })
})
