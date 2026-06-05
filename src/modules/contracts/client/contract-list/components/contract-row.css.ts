import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Inset shadow da v1 (azul #396496 = vars.color.institutional.blue); o px cru é
// inevitável em offsets de shadow que não existem no design system — desabilitado por linha (T009).
// eslint-disable-next-line no-restricted-syntax
const hoverInsetShadow = `inset 3px 0 0 0 ${vars.color.institutional.blue}`

export const rowStyle = style({
  height: '3.625rem',
  borderBottom: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  cursor: 'pointer',
  transition: 'background 0.15s ease, box-shadow 0.15s ease',
  ':hover': {
    background: vars.color.institutional.paperWarm,
    boxShadow: hoverInsetShadow,
  },
})

export const cell = style({
  paddingInline: vars.space.md,
  verticalAlign: 'middle',
})

export const numberText = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink2,
})

export const contractorWrap = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const avatar = style({
  width: '1.75rem',
  height: '1.75rem',
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.medium,
  flexShrink: 0,
})

// Cores legadas da v1 não mapeiam 1:1 para tokens institucionais;
// desabilitado por linha (T009) até definição de tokens de tipo de contrato.
export const avatarVariant = styleVariants({
  // eslint-disable-next-line no-restricted-syntax
  Fornecedor: { background: 'rgba(51,178,102,0.15)', color: '#1c7943' },
  // eslint-disable-next-line no-restricted-syntax
  Colaborador: { background: '#c7e5f2', color: '#1a708c' },
  // eslint-disable-next-line no-restricted-syntax
  Financiador: { background: '#fff7e0', color: '#d9991a' },
  // eslint-disable-next-line no-restricted-syntax
  ACT: { background: 'rgba(217,119,6,0.10)', color: '#9a5402' },
})

export const contractorInfo = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
})

export const contractorName = style({
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

export const contractorDoc = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink4,
})

export const objectText = style({
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  maxWidth: '22.5rem',
  color: vars.color.institutional.ink3,
  fontSize: '0.78125rem',
  lineHeight: 1.4,
})

const tipoBadgeBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.lg,
  fontSize: '0.65625rem',
  fontWeight: vars.font.weight.medium,
  lineHeight: 1,
  whiteSpace: 'nowrap',
})

export const tipoVariant = styleVariants({
  // eslint-disable-next-line no-restricted-syntax
  Fornecedor: [tipoBadgeBase, { color: '#1c7943', background: 'rgba(51,178,102,0.10)', border: '0.5px solid rgba(51,178,102,0.20)' }],
  // eslint-disable-next-line no-restricted-syntax
  Colaborador: [tipoBadgeBase, { color: '#1a708c', background: '#e8f5fa', border: '0.5px solid #8cc7de' }],
  // eslint-disable-next-line no-restricted-syntax
  Financiador: [tipoBadgeBase, { color: '#d9991a', background: '#fff7e0', border: '0.5px solid rgba(217,153,26,0.25)' }],
  // eslint-disable-next-line no-restricted-syntax
  ACT: [tipoBadgeBase, { color: '#9a5402', background: 'rgba(217,119,6,0.08)', border: '0.5px solid rgba(217,119,6,0.20)' }],
})

export const programText = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink4,
})

export const currencyText = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.75rem',
  color: vars.color.institutional.ink2,
})

export const periodText = style({
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink4,
})

export const additiveBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.lg,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.medium,
  background: vars.color.institutional.blueBg,
  color: vars.color.institutional.blueDeep,
})

export const additiveEmpty = style({
  color: vars.color.institutional.ink4,
  fontSize: vars.font.size.sm,
})

export const detailsWrap = style({
  position: 'relative',
  display: 'inline-flex',
})

export const summaryButton = style({
  listStyle: 'none',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: vars.color.institutional.ink4,
  fontSize: vars.font.size.lg,
  padding: vars.space.xs,
  borderRadius: vars.radius.sm,
  lineHeight: 1,
  selectors: {
    '&::-webkit-details-marker': { display: 'none' },
    '&::-moz-list-bullet': { display: 'none' },
  },
  ':hover': {
    color: vars.color.institutional.ink2,
    background: vars.color.institutional.paperWarm,
  },
})

export const dropdownMenu = style({
  position: 'absolute',
  top: '100%',
  right: 0,
  zIndex: 20,
  background: vars.color.surface.default,
  borderRadius: vars.radius.md,
  boxShadow: vars.shadow.cardElevated,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  minWidth: '12rem',
  padding: `${vars.space.xs} 0`,
  marginTop: vars.space.xs,
})

export const actionItem = style({
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  ':hover': {
    background: vars.color.institutional.paperWarm,
  },
})

export const actionItemDanger = style({
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontSize: vars.font.size.sm,
  color: vars.color.feedback.errorText,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  ':hover': {
    background: vars.color.feedback.errorBg,
  },
})
