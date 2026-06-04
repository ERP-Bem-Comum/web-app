/**
 * Design tokens — VALORES crus (tema claro), fiéis à identidade da v1.
 *
 * Módulo PURO: objeto `as const`, sem import de framework/vanilla-extract — é a fonte
 * única de verdade dos valores e é testável por `node:test` (ver tests/shared/ui/tokens).
 * O `theme.css.ts` consome este objeto ao aplicar `createGlobalTheme(':root', vars, …)`.
 *
 * ⚠ Fidelidade v1: paleta de marca LEGADA (ciano #32C6F4). NÃO herdar a paleta
 * "institucional" da v1 (azul #396496 / verde #1f7d55). Ver ADR-0007/0008 e data-model.md.
 *
 * Famílias self-host via @fontsource (ADR-0008): os family-names abaixo casam com os
 * registrados pelos pacotes (`Inter Variable`, `Nunito Variable`, `JetBrains Mono`).
 */

const SANS_FALLBACK =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const MONO_FALLBACK = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'

export const tokenValues = {
  color: {
    brand: {
      normal: '#32C6F4',
      hover: '#76D9F8',
      onBrand: '#000000',
      disabled: '#E0E0E0',
      onDisabled: '#6F6F6F',
    },
    surface: {
      default: '#ffffff',
      raised: '#ffffff',
      // Fundo de "tela" (canvas) — fallback quando a imagem de fundo do login não carrega.
      // Tom de marca claro (provisório; P.O. confirma). Contrasta com o card branco.
      canvas: '#e8f6fc',
      // Fundo sutil/cinza claro para telas de autenticação (login).
      subtle: '#F5F5F7',
    },
    text: {
      primary: '#292820',
      secondary: '#4d4740',
      muted: '#736b61',
      onBrand: '#000000',
    },
    border: {
      default: '#e5ded4',
      focus: '#32C6F4',
      // Hairline neutra-fria (~oklab 14% da marca sobre branco): define a aresta de superfícies
      // elevadas sobre fundo claro de baixo contraste (ex.: card de login sobre o canvas ciano)
      // sem a dissonância quente do `default`. Harmoniza com branco E com o canvas.
      subtle: '#d6e4ea',
    },
    feedback: {
      errorBg: '#fef2f2',
      errorText: '#dc2626',
    },
    status: {
      pendingBg: '#FFF3E0',
      pendingText: '#E65100',
      activeBg: '#E8F5E9',
      activeText: '#2E7D32',
      finishedBg: '#E3F2FD',
      finishedText: '#1565C0',
      terminatedBg: '#FFEBEE',
      terminatedText: '#C62828',
      prazoBg: '#E0F7FA',
      prazoText: '#298CAB',
      valorBg: '#E8F5E9',
      valorText: '#33B266',
      escopoBg: '#FFF8E1',
      escopoText: '#D97706',
      distratoBg: '#FFEBEE',
      distratoText: '#E54D40',
      outroBg: '#F5F5F5',
      outroText: '#736961',
    },
    institutional: {
      blue: '#396496',
      blueDeep: '#2d4f75',
      blueBg: '#e8eef5',
      blueLine: '#8bb0d6',
      green: '#1f7d55',
      greenDeep: '#176642',
      orange: '#F5A623',
      orangeLight: '#FFF8E7',
      ink2: '#332e29',
      ink3: '#4d4740',
      ink4: '#736b61',
      ink5: '#999187',
      paperRule: '#e5ded4',
      paperWarm: '#faf7f2',
      paperBeige: '#f2ede5',
      overlay: 'rgba(0,0,0,0.45)',
      surfaceTranslucent: 'rgba(255,255,255,0.92)',
    },
  },
  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  space: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  font: {
    family: {
      heading: `"Inter Variable", ${SANS_FALLBACK}`,
      body: `"Nunito Variable", ${SANS_FALLBACK}`,
      mono: `"JetBrains Mono", ${MONO_FALLBACK}`,
    },
    size: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  shadow: {
    // Elevação base do átomo Card (sobre fundo branco): discreta.
    card: '0 4px 22px 0 rgba(0, 0, 0, 0.05)',
    // Elevação em CAMADAS (ambient de contato + key light com spread negativo): separa a superfície
    // de um fundo claro de baixo contraste. Usada na variante `elevated` (card do login).
    cardElevated: '0 1px 2px 0 rgba(0, 0, 0, 0.06), 0 8px 24px -4px rgba(0, 0, 0, 0.12)',
  },
  // Anel de foco (acessibilidade): largura do traço + distância. Conceito semântico próprio —
  // um tema de alto contraste pode engrossar o anel sem tocar nos componentes. A cor vive em
  // color.border.focus. Não há degrau de 2px em `space` (xs já é 4px), por isso token dedicado.
  focusRing: {
    width: '2px',
    offset: '2px',
  },
  // Largura de traço de borda. `thin` (1px, hairline) é a borda padrão de input/superfície.
  // Vira token porque o lint "só-tokens" do DS proíbe `px` cru — INCLUSIVE 1px e dentro de
  // template literal (não há exceção). Um tema de alto contraste pode engrossar sem tocar
  // componentes. A COR da borda vive em color.border.*; aqui é só a espessura.
  borderWidth: {
    thin: '1px',
    thick: '2px',
  },
} as const

export type TokenValues = typeof tokenValues

/**
 * Forma (estrutura) do tema, sem amarrar aos literais — todo valor-folha é `string`.
 * Útil para provar que um tema alternativo (ex.: dark) satisfaz o MESMO contrato
 * sem precisar repetir os valores exatos do tema claro. Ver contract-extensibility.test.ts.
 */
export type TokenShape = {
  readonly [G in keyof TokenValues]: {
    readonly [K in keyof TokenValues[G]]: TokenValues[G][K] extends Record<string, unknown>
      ? { readonly [L in keyof TokenValues[G][K]]: string }
      : string
  }
}
