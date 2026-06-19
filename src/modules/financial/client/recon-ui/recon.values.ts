/**
 * recon.values.ts — camada de tokens do módulo de Conciliação Bancária (034), **fiel ao mock da
 * consultoria** (`Desktop/CONSULTORIA/Financeiro/conciliacao/*.css`, `:root`). Fonte de verdade dos
 * literais (arquivo `*.values.ts` — isento do lint "só-tokens"; §X exceção). Os `.css.ts` do módulo
 * importam `recon` e referenciam `recon.color.teal.normal` etc. — nunca literais crus.
 *
 * Por que módulo-escopo e não o DS global: a paleta da consultoria (teal/paper/ink) não existe no
 * `#shared/ui/tokens` (que é azul/Nunito). Mantemos aqui, aditivo e isolado (zero regressão no DS),
 * espelhando o protótipo. Pode ser promovido ao DS global depois.
 *
 * Tipografia = MARCA DO CLIENTE (decisão do P.O.): Inter (texto/títulos) + JetBrains Mono (valores),
 * ambas self-host (fontsource). O mock usa Fraunces (serif) em alguns títulos; NÃO adotamos — mantemos a
 * estética da marca em Inter.
 */

const SANS = '"Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const MONO = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace'

export const recon = {
  color: {
    ink: {
      1: 'rgb(31, 28, 26)',
      2: 'rgb(51, 46, 41)',
      3: 'rgb(77, 71, 64)',
      4: 'rgb(115, 107, 97)',
      5: 'rgb(153, 145, 135)',
      6: 'rgb(199, 191, 178)',
    },
    paper: {
      default: 'rgb(255, 255, 255)',
      warm: 'rgb(250, 247, 242)',
      beige: 'rgb(242, 237, 229)',
      rule: 'rgb(229, 222, 212)',
    },
    teal: {
      bg: 'rgb(232, 245, 250)',
      bg2: 'rgb(199, 229, 242)',
      line: 'rgb(140, 199, 222)',
      normal: 'rgb(41, 140, 171)',
      deep: 'rgb(26, 112, 140)',
    },
    amber: {
      bg: 'rgb(255, 247, 224)',
      bg2: 'rgb(255, 235, 178)',
      normal: 'rgb(242, 191, 51)',
      deep: 'rgb(217, 153, 26)',
    },
    green: {
      normal: 'rgb(51, 178, 102)',
      deep: 'rgb(28, 121, 67)',
      bg: 'rgba(51, 178, 102, 0.10)',
      line: 'rgba(51, 178, 102, 0.40)',
    },
    red: {
      normal: 'rgb(229, 77, 64)',
      deep: 'rgb(168, 47, 36)',
      bg: 'rgba(229, 77, 64, 0.08)',
      line: 'rgba(229, 77, 64, 0.30)',
    },
    orange: {
      normal: 'rgb(217, 119, 6)',
      deep: 'rgb(154, 84, 2)',
      bg: 'rgba(217, 119, 6, 0.08)',
      line: 'rgba(217, 119, 6, 0.30)',
    },
    purple: {
      normal: 'rgb(124, 92, 184)',
      deep: 'rgb(86, 60, 142)',
      bg: 'rgba(124, 92, 184, 0.10)',
    },
    overlay: 'rgba(28, 30, 40, 0.42)',
    // badge PIX do mock (verde-água suave, fora das escalas acima)
    pix: { bg: 'rgb(238, 246, 245)', text: 'rgb(52, 132, 124)' },
  },
  // Tipografia da MARCA do cliente (sem serif/Fraunces): Inter (texto/títulos) + JetBrains Mono (valores).
  font: {
    sans: SANS,
    mono: MONO,
  },
  // Degrau de tamanhos do mock (px → rem em /16).
  size: {
    '3xs': '0.5625rem', // 9px (overlines/labels)
    '2xs': '0.625rem', // 10px (meta mono)
    xs: '0.6563rem', // 10.5px
    sm: '0.6875rem', // 11px
    md: '0.78125rem', // 12.5px (corpo denso)
    lg: '0.8125rem', // 13px (valor)
    xl: '0.9375rem', // 15px
    '2xl': '1.1875rem', // 19px (nome da conta, Fraunces)
    '3xl': '1.375rem', // 22px (saldo)
  },
  weight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  radius: { sm: '0.375rem', md: '0.5rem', lg: '0.625rem', xl: '0.875rem', pill: '999px' },
  // Espaçamentos recorrentes do mock (8/10/12/14/18/24).
  space: {
    '2xs': '0.25rem', // 4
    xs: '0.375rem', // 6
    sm: '0.5rem', // 8
    md: '0.625rem', // 10
    lg: '0.75rem', // 12
    xl: '0.875rem', // 14
    '2xl': '1.125rem', // 18
    '3xl': '1.5rem', // 24
  },
  border: { hairline: '0.5px', thin: '1px', thick: '2px', ring: '3px' },
  shadow: {
    menu: '0 1px 2px rgba(15,23,42,0.04), 0 4px 8px -2px rgba(15,23,42,0.06), 0 16px 32px -8px rgba(15,23,42,0.12)',
    card: '0 1px 2px rgba(15,23,42,0.03)',
    toast: '0 8px 24px rgba(0,0,0,0.18)',
  },
  ease: 'cubic-bezier(.2, .7, .2, 1)',
  tFast: '120ms',
  tMid: '220ms',
} as const
