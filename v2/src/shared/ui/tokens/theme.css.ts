import { createGlobalTheme, globalStyle } from '@vanilla-extract/css'

import { vars } from './contract.css.ts'
import { tokenValues } from './tokens.values.ts'

/**
 * Tema claro (T006) — aplica os VALORES (tokens.values.ts) ao contrato (`vars`) no `:root`,
 * globalmente. Side-effect de registro: importar este módulo uma vez no boot
 * (ver src/app/router.tsx). Gera CSS estático (zero-runtime).
 *
 * `tokenValues` é `as const` (readonly); o spread cria uma cópia mutável que satisfaz a
 * assinatura de `createGlobalTheme`, preservando os literais.
 */

// CSS Reset: zera margin/padding padrão do browser em html/body.
// Evita faixas brancas nas bordas (login, dashboard, sidebar).
globalStyle('html, body', {
  margin: 0,
  padding: 0,
  blockSize: '100%',
})
createGlobalTheme(':root', vars, {
  color: {
    brand: { ...tokenValues.color.brand },
    surface: { ...tokenValues.color.surface },
    text: { ...tokenValues.color.text },
    border: { ...tokenValues.color.border },
    feedback: { ...tokenValues.color.feedback },
    status: { ...tokenValues.color.status },
    institutional: { ...tokenValues.color.institutional },
  },
  radius: { ...tokenValues.radius },
  space: { ...tokenValues.space },
  font: {
    family: { ...tokenValues.font.family },
    size: { ...tokenValues.font.size },
    weight: { ...tokenValues.font.weight },
  },
  shadow: { ...tokenValues.shadow },
  focusRing: { ...tokenValues.focusRing },
  borderWidth: { ...tokenValues.borderWidth },
})
