/**
 * CSS Global — reset e normalização base.
 *
 * Side-effect de registro: importar uma única vez no boot (src/app/router.tsx).
 * Usa `globalStyle` do vanilla-extract (zero-runtime, SSR-safe).
 */
import { globalStyle } from '@vanilla-extract/css'

// Reset de margin/padding no root para evitar scrollbars indesejadas e gaps na borda.
globalStyle('html, body', {
  margin: 0,
  padding: 0,
  minBlockSize: '100%',
})

// Border-box universal: padding e border NÃO somam à largura/altura externa.
// Resolve overflow causado por 100% width + padding (ex.: inputs dentro de cards).
globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
})
