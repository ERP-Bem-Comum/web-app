/**
 * Layout da página de Planejamento (lista). Cartão branco com a barra de filtros + tabela + paginação,
 * dentro da área de conteúdo do shell (altura fixa → rola o próprio conteúdo). Só tokens (§X).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  padding: vars.space.xl,
  display: 'flex',
  flexDirection: 'column',
  blockSize: '100%',
  overflowY: 'auto',
  fontFamily: vars.font.family.body,
})

export const card = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  // Sem borda/cartão em volta do grid (pedido da P.O.) — a lista fica direto na área de conteúdo.
  paddingBlock: vars.space.md,
})

// Chip do ícone ao lado do título "Planejamento": quadrado arredondado azul-claro + ícone índigo.
// 3.25rem ≈ altura do título (xl) + gap + legenda (sm) — MESMA proporção do chip do Consolidado.
export const titleIcon = style({
  flexShrink: 0,
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '3.25rem',
  blockSize: '3.25rem',
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 10%, white)`,
  color: vars.color.nav.background,
})
