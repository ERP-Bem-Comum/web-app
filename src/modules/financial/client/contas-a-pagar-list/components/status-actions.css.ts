// Menu do "Mudar Status" (refino de layout, spec 119). Próprio — não reaproveita o do "Exportar":
// aqui cada item tem rótulo + dica, e o menu estreito de antes (8.75rem) quebrava os dois em quatro
// linhas, misturando item ativo com desativado. Agora: largura para a dica caber numa linha, grupos
// nomeados (Aprovação · Pagamento · Correção) e a ação destrutiva separada, no tom de erro.
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const statusMenu = style({
  position: 'absolute',
  insetBlockEnd: 'calc(100% + 0.375rem)', // abre p/ CIMA (está no rodapé)
  insetInlineStart: 0,
  zIndex: 50,
  inlineSize: '20rem',
  padding: vars.space.xs,
  background: vars.color.surface.default,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.cardElevated,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const statusGroup = style({
  display: 'flex',
  flexDirection: 'column',
  selectors: {
    '& + &': {
      marginBlockStart: vars.space.xs,
      paddingBlockStart: vars.space.xs,
      borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
    },
  },
})

export const statusGroupLabel = style({
  paddingInline: vars.space.sm,
  paddingBlock: vars.space.xs,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})

export const statusItem = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.125rem',
  inlineSize: '100%',
  paddingInline: vars.space.sm,
  paddingBlock: vars.space.sm,
  border: 'none',
  borderRadius: vars.radius.md,
  background: 'transparent',
  fontFamily: vars.font.family.body,
  textAlign: 'start',
  cursor: 'pointer',
  ':hover': { background: vars.color.institutional.paperWarm },
  ':disabled': { cursor: 'not-allowed', background: 'transparent' },
})

export const statusItemLabel = style({
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink2,
  selectors: { [`${statusItem}:disabled &`]: { color: vars.color.institutional.ink5 } },
})

export const statusItemLabelDanger = style({
  color: vars.color.feedback.errorText,
})

export const statusItemHint = style({
  fontSize: vars.font.size.xs,
  lineHeight: 1.4,
  color: vars.color.institutional.ink5,
  selectors: { [`${statusItem}:disabled &`]: { opacity: 0.7 } },
})
