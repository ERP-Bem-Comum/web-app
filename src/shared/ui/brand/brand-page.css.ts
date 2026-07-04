/**
 * Estilos reutilizáveis da PÁGINA de um grid "brand": container full-bleed (fundo cinza + scrollbar visível
 * + filhos não encolhem), cabeçalho (título/subtítulo/ações) e botões (ghost/primary). Cada grid importa
 * daqui. A rota deve ser marcada em `root.view-model → fullBleedContent` para o shell zerar o padding.
 */
import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

import { brand } from './grid-brand.values.ts'

export const screen = style({
  padding: brand.space.xxl,
  display: 'flex',
  flexDirection: 'column',
  blockSize: '100%',
  overflowY: 'auto',
  background: brand.color.pageBg,
  fontFamily: vars.font.family.heading, // Inter
  color: brand.color.ink700,
  scrollbarWidth: 'thin',
  scrollbarColor: `${brand.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.625rem' },
    '&::-webkit-scrollbar-thumb': { background: brand.color.scrollThumb, borderRadius: brand.radius.sm },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

// Impede os filhos flex de encolher — ao expandir o filtro, o container ROLA (não espreme a tabela).
globalStyle(`${screen} > *`, { flexShrink: 0 })

export const header = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.md,
  marginBlockEnd: brand.space.xl,
})
export const headText = style({ display: 'flex', flexDirection: 'column', gap: brand.space.xxs })
export const headTitle = style({
  margin: 0,
  fontSize: brand.text.h1,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
  letterSpacing: '-.01em',
})
export const headSubtitle = style({ margin: 0, fontSize: brand.text.subtitle, color: brand.color.ink400 })
export const headActions = style({ marginInlineStart: 'auto', display: 'flex', gap: brand.space.sm })

const headerButton = style({
  blockSize: brand.size.btnHeight,
  display: 'inline-flex',
  alignItems: 'center',
  gap: brand.space.sm,
  paddingInline: vars.space.md,
  borderRadius: brand.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
    '&:disabled': { opacity: 0.6, cursor: 'default' },
  },
})
export const ghostButton = style([
  headerButton,
  {
    border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    background: brand.color.surface,
    color: brand.color.ink700,
    selectors: {
      '&:hover:not(:disabled)': { background: brand.color.surfaceAlt, borderColor: brand.color.ink400 },
    },
  },
])
export const primaryButton = style([
  headerButton,
  {
    border: 'none',
    background: brand.color.primary,
    color: brand.color.surface,
    boxShadow: brand.shadow.btn,
    selectors: { '&:hover:not(:disabled)': { background: brand.color.primaryHover } },
  },
])
