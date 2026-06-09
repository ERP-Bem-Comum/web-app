import { style, styleVariants } from '@vanilla-extract/css'
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

// <dialog> nativo (A4): ESC + focus-trap + inert de graça. O card continua em `content`.
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
  maxWidth: '35rem',
  maxHeight: '92vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.sm,
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const headLeft = style({ display: 'flex', alignItems: 'baseline', gap: vars.space.sm, minWidth: 0 })

export const title = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: '1.0625rem',
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const autoNum = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink4,
  background: vars.color.institutional.paperWarm,
  padding: `0.125rem ${vars.space.xs}`,
  borderRadius: vars.radius.sm,
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
  gap: vars.space.lg,
  overflowY: 'auto',
})

export const sectionLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.6rem',
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
  marginBottom: vars.space.sm,
})

/* Tipo — grid de cards */
export const tipoGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: vars.space.sm,
})

export const tipoCard = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: vars.space.xs,
  padding: vars.space.sm,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'border-color 120ms, background 120ms',
  ':hover': { borderColor: vars.color.institutional.ink5, background: vars.color.institutional.paperWarm },
  // Acessibilidade (M4): respeita quem pediu menos movimento — zera a duração da transição.
  '@media': { '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' } },
})

export const tipoIcon = style({
  width: '1.375rem',
  height: '1.375rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.color.institutional.ink4,
})

export const tipoName = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.75rem',
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink2,
})

export const tipoDesc = style({
  fontFamily: vars.font.family.body,
  fontSize: '0.625rem',
  color: vars.color.institutional.ink5,
  lineHeight: 1.3,
})

/* Conditional row (Prazo / Valor) */
export const condRow = style({
  marginTop: vars.space.sm,
  padding: vars.space.md,
  background: vars.color.institutional.blueBg,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.blueLine}`,
})

export const condHead = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.5625rem',
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.blueDeep,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: vars.space.sm,
})

/* Toggle Acréscimo/Supressão */
export const toggleBar = style({
  display: 'flex',
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  padding: '0.125rem',
})

export const toggleButton = style({
  flex: 1,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontFamily: vars.font.family.body,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink4,
  background: 'transparent',
  border: 'none',
  borderRadius: vars.radius.sm,
  cursor: 'pointer',
})

export const toggleButtonActive = style({
  background: vars.color.institutional.blueBg,
  color: vars.color.institutional.blueDeep,
})

export const fieldRow2 = style({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: vars.space.md })
export const field = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs })

export const label = style({
  fontFamily: vars.font.family.heading,
  fontSize: '0.6rem',
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})

export const req = style({ color: vars.color.feedback.errorText })

export const input = style({
  width: '100%',
  boxSizing: 'border-box',
  height: '2.5rem',
  display: 'flex', // centraliza verticalmente o conteúdo read-only (modo view)
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

export const textarea = style({
  width: '100%',
  boxSizing: 'border-box',
  minHeight: '4.5rem',
  padding: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  resize: 'vertical',
  lineHeight: 1.45,
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
})

export const uploadInfo = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs, minWidth: 0 })
export const uploadName = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  color: vars.color.institutional.ink2,
})
export const uploadHint = style({ fontFamily: vars.font.family.body, fontSize: '0.6875rem', color: vars.color.institutional.ink5 })

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
  alignItems: 'center',
  gap: vars.space.sm,
  padding: vars.space.lg,
  borderTop: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.institutional.paperWarm,
})

// Empurra o "Excluir aditivo" para a esquerda do footer.
export const footerStart = style({ marginInlineEnd: 'auto' })

// Botão danger SUAVE — "Excluir aditivo" (texto, sem borda; discreto no layout).
export const buttonDanger = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  height: '2.5rem',
  padding: `0 ${vars.space.md}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.feedback.errorText,
  background: 'transparent',
  border: 'none',
  borderRadius: vars.radius.md,
  cursor: 'pointer',
  selectors: {
    '&:disabled': { opacity: '0.5', cursor: 'not-allowed' },
    '&:hover:not(:disabled)': { background: vars.color.feedback.errorBg },
  },
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
  ':hover': { background: vars.color.institutional.blueBg, borderColor: vars.color.institutional.blueLine },
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
  ':hover': { background: vars.color.institutional.blueDeep },
  selectors: { '&:disabled': { opacity: 0.5, cursor: 'not-allowed' } },
})

/* ── Cor por tipo de aditivo (caixa = cor da badge) ──
   prazo azul · valor verde · escopo marrom · outro laranja · distrato vermelho.
   Tone-only: aplicado SOBRE tipoCard/condRow/condHead (definido depois → vence em precedência). */
const TONE = {
  prazo: { bg: vars.color.status.prazoBg, fg: vars.color.status.prazoText },
  valor: { bg: vars.color.status.valorBg, fg: vars.color.status.valorText },
  escopo: { bg: vars.color.status.aditEscopoBg, fg: vars.color.status.aditEscopoText },
  outro: { bg: vars.color.status.aditOutroBg, fg: vars.color.status.aditOutroText },
  distrato: { bg: vars.color.status.distratoBg, fg: vars.color.status.distratoText },
} as const

export const tipoCardActiveTone = styleVariants(TONE, (t) => ({
  // Borda discreta (color-mix) em vez da cor cheia → mais suave/sofisticado.
  borderColor: `color-mix(in srgb, ${t.fg} 38%, transparent)`,
  background: t.bg,
}))

export const tipoIconActiveTone = styleVariants(TONE, (t) => ({ color: t.fg }))

export const condRowTone = styleVariants(TONE, (t) => ({
  background: t.bg,
  borderColor: `color-mix(in srgb, ${t.fg} 25%, transparent)`,
}))

export const condHeadTone = styleVariants(TONE, (t) => ({ color: t.fg }))

export const distratoWarn = style({
  marginTop: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.medium,
  color: vars.color.status.distratoText,
  lineHeight: 1.4,
})
