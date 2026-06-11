import { style, styleVariants } from '@vanilla-extract/css'
import { vars } from '../../tokens/index.ts'

const base = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.lg,
  fontFamily: vars.font.family.heading, // brand: Inter (badges)
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.02em',
  lineHeight: 1,
  whiteSpace: 'nowrap',
})

export const badge = styleVariants({
  pending: [base, { background: vars.color.status.pendingBg, color: vars.color.status.pendingText }],
  active: [base, { background: vars.color.status.activeBg, color: vars.color.status.activeText }],
  finished: [base, { background: vars.color.status.finishedBg, color: vars.color.status.finishedText }],
  terminated: [base, { background: vars.color.status.terminatedBg, color: vars.color.status.terminatedText }],
  prazo: [base, { background: vars.color.status.prazoBg, color: vars.color.status.prazoText }],
  valor: [base, { background: vars.color.status.valorBg, color: vars.color.status.valorText }],
  escopo: [base, { background: vars.color.status.escopoBg, color: vars.color.status.escopoText }],
  distrato: [base, { background: vars.color.status.distratoBg, color: vars.color.status.distratoText }],
  outro: [base, { background: vars.color.status.outroBg, color: vars.color.status.outroText }],
})

export type BadgeVariant = keyof typeof badge
