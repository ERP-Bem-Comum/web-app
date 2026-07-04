import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Banner de erro do topo do formulário (o resto do chrome vem do KIT "brand").
export const errorBanner = style({
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  marginBlockEnd: vars.space.lg,
})

// Zona de "Foto de Perfil" gated (upload é PUT pós-criação) — placeholder desabilitado dentro do card brand.
export const photoZone = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  blockSize: '6rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} dashed ${vars.color.border.default}`,
  background: vars.color.surface.subtle,
  color: vars.color.text.muted,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  cursor: 'not-allowed',
  marginBlockEnd: vars.space.sm,
})

// Linha do checkbox "Aprovador em Massa" (input nativo + label) dentro do card brand.
export const checkboxRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  marginBlockEnd: vars.space.sm,
})
