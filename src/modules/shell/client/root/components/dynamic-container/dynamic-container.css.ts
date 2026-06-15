import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Container do conteúdo dinâmico (onde o <Outlet/> de cada rota renderiza).
export const main = style({
  flex: 1,
  padding: vars.space.xl,
  background: vars.color.nav.surface,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
})

export const content = style({
  flex: 1,
  overflow: 'hidden',
})

export const pageHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBlockEnd: vars.space.lg,
  flexShrink: 0,
})

export const pageTitle = style({
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.nav.ink,
  // Nunito (corpo), igual ao título das telas via PageHeader — consistência entre módulos.
  fontFamily: vars.font.family.body,
  margin: 0,
})
