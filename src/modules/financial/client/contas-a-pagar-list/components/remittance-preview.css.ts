/**
 * Estilos do modal de PRÉ-VOO da remessa (VAN, core-api#728). Só-tokens, zero-runtime (§X, ADR-0007/0008):
 * nenhum hex ou px cru — tudo vem de `vars`. O overlay/diálogo base é reaproveitado da página
 * (`contas-a-pagar.css.ts`); aqui ficam o cabeçalho de contadores e a tabela de linhas.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

/** O diálogo do pré-voo é mais largo que o de confirmação: mostra uma TABELA, não uma frase. */
export const previewDialog = style({
  inlineSize: '52rem',
  maxInlineSize: '100%',
  maxBlockSize: '85vh',
  display: 'flex',
  flexDirection: 'column',
  padding: vars.space.lg,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.card,
})

/** Faixa de contadores: é o resumo que decide se vale seguir. Fica fixa; a lista abaixo é que rola. */
export const summary = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.md,
  marginBlock: vars.space.md,
  paddingBlockEnd: vars.space.md,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const summaryItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minInlineSize: '9rem',
})

export const summaryLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink3,
})

export const summaryValue = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const scrollArea = style({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'auto',
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

export const th = style({
  position: 'sticky',
  insetBlockStart: 0,
  zIndex: 1,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.sm,
  textAlign: 'left',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink3,
  background: vars.color.surface.default,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const td = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.sm,
  color: vars.color.institutional.ink2,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  verticalAlign: 'top',
})

export const tdRight = style([td, { textAlign: 'right', whiteSpace: 'nowrap' }])

const pillBase = {
  display: 'inline-block',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.bold,
  whiteSpace: 'nowrap',
} as const

/**
 * A cor separa AÇÃO, não gravidade: verde sai; vermelho o operador conserta; neutro nenhum cadastro
 * resolve (câmbio/cartão não passam pela VAN); âmbar é o id que sumiu entre selecionar e conferir.
 */
export const statusPill = styleVariants({
  ready: [pillBase, { background: vars.color.status.activeBg, color: vars.color.status.activeText }],
  blocked: [
    pillBase,
    { background: vars.color.status.terminatedBg, color: vars.color.status.terminatedText },
  ],
  'out-of-van': [
    pillBase,
    { background: vars.color.status.cancelledBg, color: vars.color.status.cancelledText },
  ],
  'not-found': [pillBase, { background: vars.color.status.pendingBg, color: vars.color.status.pendingText }],
})

/** Lacunas: uma por linha, campo + motivo. Nunca vira frase — a tela aponta o campo. */
export const gapList = style({
  margin: 0,
  paddingInlineStart: vars.space.md,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink3,
})

export const gapField = style({
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})

export const routeLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink3,
})

/** Aviso dos títulos não-Aprovados (barrados no front, não chegam ao core-api). */
export const notice = style({
  marginBlockStart: vars.space.sm,
  padding: vars.space.sm,
  borderRadius: vars.radius.sm,
  background: vars.color.status.pendingBg,
  color: vars.color.status.pendingText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  lineHeight: 1.5,
})

export const errorBox = style({
  marginBlockStart: vars.space.sm,
  padding: vars.space.sm,
  borderRadius: vars.radius.sm,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
})

export const emptyState = style({
  padding: vars.space.lg,
  textAlign: 'center',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink3,
})
