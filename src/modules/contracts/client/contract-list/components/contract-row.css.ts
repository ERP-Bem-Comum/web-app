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
  // Brand: linhas da tabela em Nunito (body), não mais mono.
  fontFamily: vars.font.family.body,
})

// Variantes de alinhamento do conteúdo da célula (text-align afeta inline / inline-flex como as badges).
export const cellCenter = style({ textAlign: 'center' })
export const cellRight = style({ textAlign: 'right' })

export const numberText = style({
  fontFamily: vars.font.family.body,
  fontSize: '0.75rem', // +1px (era 0.6875rem) — dá mais destaque ao número do contrato
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
  whiteSpace: 'nowrap', // "CT 0001/2026" em uma só linha
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

// Avatar do tipo de parceiro — tints derivados dos tokens `color.partnerType.*` (antes hex cru).
export const avatarVariant = styleVariants({
  Fornecedor: {
    background: `color-mix(in srgb, ${vars.color.partnerType.supplier.text} 15%, transparent)`,
    color: vars.color.partnerType.supplier.text,
  },
  Colaborador: {
    background: vars.color.partnerType.collaborator.background,
    color: vars.color.partnerType.collaborator.text,
  },
  Financiador: {
    background: vars.color.partnerType.financier.background,
    color: vars.color.partnerType.financier.text,
  },
  ACT: {
    background: `color-mix(in srgb, ${vars.color.partnerType.act.text} 10%, transparent)`,
    color: vars.color.partnerType.act.text,
  },
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
  fontFamily: vars.font.family.body,
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

// Base sofisticada compartilhada pelas badges de TIPO e STATUS do grid: uppercase, cantos médios
// (arredondamento suave), letter-spacing e fundo tonalizado — SEM borda (look mais suave). Cada
// variante só define cor/fundo. (Inter p/ o "look" de tag.)
const gridBadgeBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBlock: '0.1875rem',
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: '0.625rem',
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
})

export const tipoVariant = styleVariants({
  Fornecedor: [gridBadgeBase, {
    color: vars.color.partnerType.supplier.text,
    background: vars.color.partnerType.supplier.background,
  }],
  Colaborador: [gridBadgeBase, {
    color: vars.color.partnerType.collaborator.text,
    background: vars.color.partnerType.collaborator.background,
  }],
  Financiador: [gridBadgeBase, {
    color: vars.color.partnerType.financier.text,
    background: vars.color.partnerType.financier.background,
  }],
  ACT: [gridBadgeBase, {
    color: vars.color.partnerType.act.text,
    background: vars.color.partnerType.act.background,
  }],
})

export const programText = style({
  fontFamily: vars.font.family.body,
  fontSize: '0.6875rem',
  color: vars.color.institutional.ink4,
})

export const currencyText = style({
  fontFamily: vars.font.family.body,
  fontSize: '0.75rem',
  color: vars.color.institutional.ink2,
})

// Saldo — mesmo do valor, porém em bold (destaque).
export const balanceText = style([currencyText, { fontWeight: vars.font.weight.bold }])

export const periodText = style({
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink4,
  whiteSpace: 'nowrap', // vigência em uma só linha (início — fim)
})

export const additiveBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${vars.space.xs} ${vars.space.sm}`,
  borderRadius: vars.radius.lg,
  fontFamily: vars.font.family.heading, // brand: Inter (badges)
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  background: vars.color.institutional.blueBg,
  color: vars.color.institutional.blueDeep,
})

export const additiveEmpty = style({
  color: vars.color.institutional.ink4,
  fontSize: vars.font.size.sm,
})

// Badge de status (coluna Status) — LOCAL ao grid de contratos (não reusa o átomo `Badge`, que é
// compartilhado com Parceiros). Reaproveita `gridBadgeBase` (mesmo look da badge de TIPO), SEM borda
// (só fundo tonalizado + texto), p/ um visual mais suave.
export const statusVariant = styleVariants({
  pending: [gridBadgeBase, {
    background: vars.color.status.pendingBg,
    color: vars.color.status.pendingText,
  }],
  active: [gridBadgeBase, {
    background: vars.color.status.activeBg,
    color: vars.color.status.activeText,
  }],
  finished: [gridBadgeBase, {
    background: vars.color.status.finishedBg,
    color: vars.color.status.finishedText,
  }],
  terminated: [gridBadgeBase, {
    background: vars.color.status.terminatedBg,
    color: vars.color.status.terminatedText,
  }],
  // Cancelado (§1.7) — NEUTRO/cinza (token cancelled*), distinto do vermelho do distrato.
  cancelled: [gridBadgeBase, {
    background: vars.color.status.cancelledBg,
    color: vars.color.status.cancelledText,
  }],
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
  insetInlineEnd: 0,
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
  fontFamily: vars.font.family.body,
  color: vars.color.institutional.ink2,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover:not(:disabled)': { background: vars.color.institutional.paperWarm },
    '&:disabled': { opacity: '0.5', cursor: 'not-allowed' },
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
