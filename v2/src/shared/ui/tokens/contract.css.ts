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
    },
    feedback: {
      errorBg: null,
      errorText: null,
    },
  },
  radius: {
    sm: null,
    md: null,
    lg: null,
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
  },
  focusRing: {
    width: null,
    offset: null,
  },
  borderWidth: {
    thin: null,
  },
})
