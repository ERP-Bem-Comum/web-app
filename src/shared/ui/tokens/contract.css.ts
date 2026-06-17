import { createThemeContract } from '@vanilla-extract/css'

/**
 * Contrato de tokens (T005) — apenas a ESTRUTURA/nomes (folhas `null`), sem valores.
 * `vars` é a API tipada que os componentes consomem (`vars.color.brand.normal`, etc.).
 * Os valores vivem em `theme.css.ts` (createGlobalTheme) a partir de `tokens.values.ts`.
 * Separar contrato↔valores habilita temas alternativos (ex.: dark) sem tocar consumidores
 * (FR-010). A forma DEVE espelhar `tokens.values.ts` / data-model.md.
 */
export const vars = createThemeContract({
  color: {
    brand: {
      normal: null,
      hover: null,
      onBrand: null,
      disabled: null,
      onDisabled: null,
    },
    surface: {
      default: null,
      raised: null,
      canvas: null,
      subtle: null,
      app: null,
    },
    text: {
      primary: null,
      secondary: null,
      muted: null,
      onBrand: null,
    },
    border: {
      default: null,
      focus: null,
      subtle: null,
    },
    feedback: {
      errorBg: null,
      errorText: null,
    },
    nav: {
      background: null,
      surface: null,
      itemActive: null,
      itemHover: null,
      submenuBackground: null,
      textActive: null,
      textMuted: null,
      ink: null,
      textOnSurface: null,
      border: null,
      surfaceHover: null,
    },
    status: {
      pendingBg: null,
      pendingText: null,
      activeBg: null,
      activeText: null,
      finishedBg: null,
      finishedText: null,
      terminatedBg: null,
      terminatedText: null,
      cancelledBg: null,
      cancelledText: null,
      prazoBg: null,
      prazoText: null,
      valorBg: null,
      valorText: null,
      escopoBg: null,
      escopoText: null,
      distratoBg: null,
      distratoText: null,
      outroBg: null,
      outroText: null,
      aditEscopoBg: null,
      aditEscopoText: null,
      aditOutroBg: null,
      aditOutroText: null,
    },
    partnerType: {
      supplier: { text: null, background: null, border: null },
      collaborator: { text: null, background: null, border: null },
      financier: { text: null, background: null, border: null },
      act: { text: null, background: null, border: null },
    },
    institutional: {
      blue: null,
      blueDeep: null,
      blueBg: null,
      blueLine: null,
      green: null,
      greenDeep: null,
      orange: null,
      orangeLight: null,
      ink2: null,
      ink3: null,
      ink4: null,
      ink5: null,
      paperRule: null,
      paperWarm: null,
      paperBeige: null,
      overlay: null,
      surfaceTranslucent: null,
    },
  },
  radius: {
    sm: null,
    md: null,
    lg: null,
    xl: null,
  },
  space: {
    xs: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
  },
  font: {
    family: {
      heading: null,
      body: null,
      mono: null,
    },
    size: {
      '2xs': null,
      xs: null,
      sm: null,
      md: null,
      lg: null,
      xl: null,
    },
    weight: {
      regular: null,
      medium: null,
      semibold: null,
      bold: null,
    },
  },
  shadow: {
    card: null,
    cardElevated: null,
  },
  focusRing: {
    width: null,
    offset: null,
  },
  borderWidth: {
    hairline: null,
    thin: null,
    thick: null,
  },
  size: {
    topbar: null,
  },
})
