/**
 * Estilo específico do grid de Fornecedores (o restante — screen/header/tabela/paginação — vem da kit
 * "brand" compartilhada). Só a célula de CPF/CNPJ (não quebra no '-' / '/') e a etiqueta PF/PJ.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

export const cnpjCell = style({ whiteSpace: 'nowrap' })

// Etiqueta PF/PJ antes do documento (#1022): discreta, tinta do texto secundário.
export const personTag = style({
  display: 'inline-block',
  marginInlineEnd: brand.space.xs,
  paddingInline: brand.space.xs,
  borderRadius: brand.radius.xs,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  background: brand.color.surfaceAlt,
  color: brand.color.ink500,
  fontSize: brand.text.hint,
  fontWeight: brand.weight.semibold,
})
