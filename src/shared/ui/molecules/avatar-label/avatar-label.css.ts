import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

export const wrap = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  minInlineSize: 0,
})

export const avatar = style({
  inlineSize: '2rem',
  blockSize: '2rem',
  flexShrink: 0,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  textTransform: 'uppercase',
})

// Cor por tipo de parceiro (tokens partnerType.*) + `brand` (navy) p/ grids não-parceiro.
export const avatarVariant = styleVariants({
  collaborator: { background: vars.color.partnerType.collaborator.background, color: vars.color.partnerType.collaborator.text },
  supplier: { background: vars.color.partnerType.supplier.background, color: vars.color.partnerType.supplier.text },
  financier: { background: vars.color.partnerType.financier.background, color: vars.color.partnerType.financier.text },
  act: { background: vars.color.partnerType.act.background, color: vars.color.partnerType.act.text },
  // `brand` = azul sólido da marca (mesmo do avatar do topbar). `neutral` = cinza (igual ao "Minha Conta").
  brand: { background: vars.color.brand.normal, color: vars.color.brand.onBrand },
  neutral: { background: vars.color.surface.subtle, color: vars.color.text.secondary },
})

export const label = style({
  minInlineSize: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})
