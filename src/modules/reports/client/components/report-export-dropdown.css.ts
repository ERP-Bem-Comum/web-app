/**
 * Estilos do dropdown Exportar (CSV/PDF) do relatório — identidade "brand" (só-tokens §X). Trigger no padrão
 * do botão de exportar dos filtros brand; menu flutuante com itens. Espelha o export-dropdown de Contratos,
 * mas com tokens da marca (brand-filters já expõe `exportTrigger`; aqui só o menu).
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

export const wrapper = style({ position: 'relative', display: 'inline-flex' })

export const menu = style({
  position: 'absolute',
  insetBlockStart: 'calc(100% + 0.25rem)',
  insetInlineEnd: 0,
  zIndex: 50,
  background: brand.color.surface,
  borderRadius: brand.radius.md,
  boxShadow: brand.shadow.cardDepth,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  minInlineSize: '9rem',
  overflow: 'hidden',
})

export const menuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
  inlineSize: '100%',
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.md,
  border: 'none',
  background: 'transparent',
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.medium,
  cursor: 'pointer',
  textAlign: 'start',
  selectors: { '&:hover': { background: brand.color.surfaceAlt } },
})

export const menuItemBorder = style({
  borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
})
