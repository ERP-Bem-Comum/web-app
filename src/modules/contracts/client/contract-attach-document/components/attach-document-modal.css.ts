import { style } from '@vanilla-extract/css'
import { vars } from '#shared/ui/tokens/index.ts'

export const overlay = style({
  position: 'fixed',
  inset: 0,
  background: vars.color.institutional.overlay,
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 300,
  padding: vars.space.md,
})

// <dialog> nativo (A4): showModal() entrega ESC + focus-trap + inert + restauração de foco. O card
// continua sendo `content`; o dialog só centraliza e pinta o backdrop (espelha o overlay anterior).
export const dialog = style({
  border: 'none',
  padding: vars.space.md,
  background: 'transparent',
  maxInlineSize: '100%',
  maxBlockSize: '100%',
  selectors: {
    '&::backdrop': {
      background: vars.color.institutional.overlay,
      backdropFilter: 'blur(6px)',
    },
  },
})

export const content = style({
  position: 'relative',
  background: vars.color.surface.default,
  borderRadius: vars.radius.xl,
  boxShadow: vars.shadow.cardElevated,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  width: '100%',
  maxWidth: '30rem',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
})

export const header = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  padding: vars.space.lg,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const title = style({
  fontFamily: vars.font.family.heading,
  fontSize: '1.0625rem',
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const titleNum = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink4,
  background: vars.color.institutional.paperWarm,
  padding: `0.125rem ${vars.space.xs}`,
  borderRadius: vars.radius.sm,
  marginInlineStart: vars.space.sm,
})

export const subtitle = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink4,
  marginTop: vars.space.xs,
})

export const close = style({
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.ink4,
  fontSize: '1.25rem',
  cursor: 'pointer',
  lineHeight: 1,
  ':hover': { color: vars.color.institutional.ink2 },
})

export const body = style({
  padding: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  overflowY: 'auto',
})

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const label = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const hint = style({
  fontFamily: vars.font.family.body,
  fontSize: '0.75rem',
  color: vars.color.institutional.ink4,
})

export const input = style({
  height: '2.5rem',
  display: 'flex', // centraliza verticalmente o valor read-only (modo somente leitura)
  alignItems: 'center',
  padding: `0 ${vars.space.sm}`,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  ':focus': {
    outline: 'none',
    borderColor: vars.color.institutional.blue,
    boxShadow: `0 0 0 ${vars.borderWidth.thin} ${vars.color.institutional.blueLine}`,
  },
})

export const uploadZone = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: vars.space.md,
  border: `${vars.borderWidth.thin} dashed ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  background: vars.color.institutional.paperWarm,
  cursor: 'pointer',
  transition: 'border-color 120ms, background 120ms',
  // Acessibilidade (M4): respeita quem pediu menos movimento — zera a duração da transição.
  '@media': { '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' } },
})

export const uploadZoneActive = style({
  borderColor: vars.color.institutional.blue,
  background: vars.color.institutional.blueBg,
})

export const uploadInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minWidth: 0,
})

export const uploadName = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const uploadMeta = style({
  fontFamily: vars.font.family.body,
  fontSize: '0.75rem',
  color: vars.color.institutional.ink4,
})

// Resumo dos dados do contrato (espelha o modal de finalização do incluir contrato)
export const summaryGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: vars.space.sm,
})

export const summaryCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  padding: vars.space.sm,
  // Caixas em tom de azul suave (identidade do cliente), no lugar do bege.
  background: vars.color.institutional.blueBg,
  borderRadius: vars.radius.md,
  minWidth: 0,
})

export const summaryLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.6rem',
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})

export const summaryValue = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const statusRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingTop: vars.space.xs,
})

export const statusRowLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.6rem',
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})

export const statusBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  padding: `0.1875rem ${vars.space.sm}`,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading, // padrão das badges (Inter)
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
  marginInlineStart: 'auto',
})
export const statusBadgePending = style({ background: vars.color.status.pendingBg, color: vars.color.status.pendingText })
export const statusBadgeActive = style({ background: vars.color.status.activeBg, color: vars.color.status.activeText })

// Documento já anexado (modo somente leitura)
export const attachedFile = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  padding: vars.space.md,
  // Borda azul mais discreta (color-mix) + raio médio: caixa em tom de azul suave.
  border: `${vars.borderWidth.thin} solid color-mix(in srgb, ${vars.color.institutional.blueLine} 50%, transparent)`,
  borderRadius: vars.radius.md,
  background: vars.color.institutional.blueBg,
})

export const errorAlert = style({
  fontFamily: vars.font.family.body,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
})

export const footer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
  padding: vars.space.lg,
  borderTop: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const buttonPrimary = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  height: '2.5rem',
  padding: `0 ${vars.space.lg}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.surface.default,
  background: vars.color.institutional.blue,
  border: 'none',
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  transition: 'background 150ms',
  ':hover': { background: vars.color.institutional.blueDeep },
  selectors: {
    '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  },
})

// Botão-gatilho da ação (usado na tela de detalhe para abrir o modal).
export const triggerButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  height: '2.25rem',
  padding: `0 ${vars.space.md}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.surface.default,
  background: vars.color.institutional.blue,
  border: 'none',
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  transition: 'background 150ms',
  ':hover': { background: vars.color.institutional.blueDeep },
})

export const buttonSecondary = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  height: '2.5rem',
  padding: `0 ${vars.space.lg}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink4,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  transition: 'background 150ms, border-color 150ms',
  ':hover': {
    background: vars.color.institutional.blueBg,
    borderColor: vars.color.institutional.blueLine,
  },
})
