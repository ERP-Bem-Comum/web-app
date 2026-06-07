import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Esqueleto da tela-raiz: topbar fixa no topo + (sidebar | conteúdo) abaixo.
export const shell = style({
  blockSize: '100dvh',
  overflow: 'hidden',
  paddingBlockStart: vars.size.topbar,
})

export const body = style({
  display: 'flex',
  blockSize: `calc(100dvh - ${vars.size.topbar})`,
  overflow: 'hidden',
})

export const sidebarSticky = style({
  position: 'sticky',
  insetBlockStart: 0,
  blockSize: '100%',
  zIndex: 200,
  flexShrink: 0,
})
