import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'
import { group, chip, chipActive } from '#shared/ui/brand/brand-filters.css.ts'

// Banner de erro do submit (mantido); o restante do formulário usa o KIT "brand" (`brand-form.css.ts`).
export const errorBanner = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  marginBlockEnd: vars.space.lg,
})

// ── Chave "Pessoa Jurídica | Pessoa Física" (#1022) — o segmentado do kit "brand" (`brand-filters`). ──
export const personTypeField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xs,
  marginBlockEnd: brand.space.gridRow,
})

export const personTypeGroup = style([group, { alignSelf: 'flex-start' }])

// Bloqueada (edição sem `supplier:edit-sensitive`): PRECISA parecer bloqueada — `disabled` no DOM não
// basta. Tinta apagada + `not-allowed`, e o hover não promete clique.
const locked = {
  selectors: {
    '&:disabled': { color: brand.color.ink400, cursor: 'not-allowed', boxShadow: 'none' },
  },
} as const

export const personTypeOption = style([chip, locked])
export const personTypeOptionOn = style([chipActive, locked])
