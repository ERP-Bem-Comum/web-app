/**
 * Estilos do modal "Conferir Remessa" (VAN, core-api#728). Só-tokens, zero-runtime (§X, ADR-0007/0008):
 * nenhum hex ou px cru.
 *
 * A tabela REPLICA o grid de Contas a Pagar de propósito — mesmo layout em CSS Grid, mesmo cabeçalho
 * denso (caixa-alta, 10px, ink-5, fundo paperWarm), mesma altura de linha, mono nos números. É a mesma
 * leitura que o operador acabou de fazer no grid; mudar a estética aqui o faria reconferir do zero.
 */
import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

/** Checkbox · Tipo de pagamento · Documento · Fornecedor · Vencimento · Líquido. */
const GRID_COLS = '2rem 9rem 11rem minmax(12rem, 1fr) 7.5rem 9rem'

export const previewDialog = style({
  inlineSize: '62rem',
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

// ── Resumo do lote ──────────────────────────────────────────────────────────────
// Fica FIXO acima da tabela: é o que decide se o lote está pronto. A tabela abaixo é que rola.

export const summary = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.lg,
  marginBlock: vars.space.md,
  padding: vars.space.md,
  background: vars.color.institutional.paperWarm,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
})

export const summaryItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  minInlineSize: '8rem',
})

export const summaryLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: `calc(${vars.font.size['2xs']} + 0.0625rem)`,
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.institutional.ink5,
})

export const summaryValue = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
})

/** O valor que de fato deixa a conta — destacado como o número mais importante do modal. */
export const summaryValueStrong = style([
  summaryValue,
  {
    fontFamily: vars.font.family.heading,
    fontSize: vars.font.size.md,
    fontWeight: vars.font.weight.bold,
    color: vars.color.institutional.blueDeep,
  },
])

/** Vencimentos diferentes = o backend recusa gerar. A conferência avisa antes de o operador tentar. */
export const summaryValueWarn = style([
  summaryValue,
  { color: vars.color.status.terminatedText, fontWeight: vars.font.weight.bold },
])

// ── Tabela (espelha o grid de Contas a Pagar) ───────────────────────────────────

export const gridBox = style({
  flex: 1,
  overflow: 'auto',
  border: `${vars.borderWidth.thin} solid color-mix(in srgb, ${vars.color.institutional.paperRule} 55%, ${vars.color.institutional.paperWarm})`,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  boxShadow: brand.shadow.cardDepth,
})

export const head = style({
  display: 'grid',
  gridTemplateColumns: GRID_COLS,
  gap: vars.space.md,
  alignItems: 'center',
  minBlockSize: '2.25rem',
  paddingInline: vars.space.md,
  background: vars.color.institutional.paperWarm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  position: 'sticky',
  insetBlockStart: 0,
  zIndex: 1,
})

export const headCell = style({
  fontFamily: vars.font.family.heading,
  fontSize: `calc(${vars.font.size['2xs']} + 0.0625rem)`,
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.institutional.ink5,
})

export const headCellRight = style([headCell, { textAlign: 'right' }])

export const row = style({
  display: 'grid',
  gridTemplateColumns: GRID_COLS,
  gap: vars.space.md,
  alignItems: 'center',
  minBlockSize: '3rem',
  paddingInline: vars.space.md,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  fontFamily: vars.font.family.heading,
  fontSize: `calc(${vars.font.size.xs} + 0.0625rem)`,
  color: vars.color.institutional.ink2,
  transition: 'background 120ms ease',
  ':hover': { background: vars.color.institutional.paperWarm },
  ':last-child': { borderBlockEnd: 'none' },
})

/**
 * Linha com pendência: NÃO entra no arquivo. O vermelho é o único sinal — não há coluna de situação, e
 * a barra à esquerda garante que o estado sobreviva a quem enxerga cor de forma diferente da média.
 */
export const rowPending = style([
  row,
  {
    background: vars.color.status.terminatedBg,
    color: vars.color.status.terminatedText,
    boxShadow: `inset 0.1875rem 0 0 0 ${vars.color.status.terminatedText}`,
    ':hover': { background: vars.color.status.terminatedBg },
  },
])

export const cell = style({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })

export const cellDoc = style([
  cell,
  { fontFamily: vars.font.family.mono, color: vars.color.institutional.ink2 },
])

export const cellNet = style([cell, { textAlign: 'right', fontFamily: vars.font.family.mono }])

export const checkbox = style({ inlineSize: '0.9375rem', blockSize: '0.9375rem', cursor: 'pointer' })

/** Checkbox de linha impedida: presente (a coluna não "buraca"), mas inoperável — não há o que marcar. */
export const checkboxDisabled = style([checkbox, { cursor: 'not-allowed', opacity: 0.45 }])

/**
 * Motivo do impedimento, embaixo do número do documento. Fica NA LINHA (não só no tooltip) porque é o
 * que o operador precisa ler para decidir — a guia de retenção, por exemplo, sequer tem linha digitável.
 */
export const pendencyLabel = style({
  display: 'block',
  marginBlockStart: '0.0625rem',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

/** Célula Documento: número + motivo empilhados (o grid de Contas a Pagar faz o mesmo com a série). */
export const cellDocStack = style({ minInlineSize: 0, overflow: 'hidden' })

// A linha vermelha herda a cor no hover e no mono; o seletor global evita repetir a variante por célula.
globalStyle(`${rowPending} > *`, { color: 'inherit' })

// ── Avisos e estados ────────────────────────────────────────────────────────────

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

// Banners de bloqueio do rodapé — largura TOTAL (linha própria no flex do `launchBar`), pra não ficarem
// espremidos ao lado da conta/botão (o que fazia a mensagem passar despercebida). `launchAlert` = âmbar
// (validação a corrigir: vencimentos diferentes); `launchError` = vermelho (recusa do core-api).
export const launchAlert = style([notice, { inlineSize: '100%', marginBlockStart: 0 }])
export const launchError = style([errorBox, { inlineSize: '100%', marginBlockStart: 0 }])

// ── Geração (S3) — ⚠️ move dinheiro ─────────────────────────────────────────────

/** Barra de disparo: conta que paga + o botão. Separada do rodapé de "Fechar" por peso visual. */
export const launchBar = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space.sm,
  marginBlockStart: vars.space.md,
  paddingBlockStart: vars.space.md,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})

export const launchLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: `calc(${vars.font.size['2xs']} + 0.0625rem)`,
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.institutional.ink5,
})

export const accountSelect = style({
  minInlineSize: '18rem',
  blockSize: '2.25rem',
  paddingInline: vars.space.sm,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.default,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.institutional.ink2,
})

/**
 * O botão que MOVE DINHEIRO. Verde de confirmação — deliberadamente distinto do azul das ações neutras
 * do módulo: o operador não deve confundi-lo com "salvar" nem com "exportar".
 */
export const launchBtn = style({
  blockSize: '2.5rem',
  paddingInline: vars.space.lg,
  border: 'none',
  borderRadius: vars.radius.md,
  background: vars.color.status.activeText,
  color: vars.color.surface.default,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  cursor: 'pointer',
  ':hover': { filter: 'brightness(0.95)' },
  ':disabled': { opacity: 0.5, cursor: 'not-allowed' },
})

/** Segundo passo: o texto muda de "gerar" para "confirmar", e o vermelho marca a irreversibilidade. */
export const confirmLaunchBtn = style([launchBtn, { background: vars.color.status.terminatedText }])

/** Aviso do armado: diz o que vai acontecer, em dinheiro, antes do clique que não volta. */
export const launchWarn = style({
  inlineSize: '100%',
  padding: vars.space.sm,
  borderRadius: vars.radius.sm,
  background: vars.color.status.terminatedBg,
  color: vars.color.status.terminatedText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  lineHeight: 1.5,
})

/** Comprovante: substitui a conferência depois de gerada. É o único registro que o operador tem. */
export const receipt = style({
  padding: vars.space.lg,
  borderRadius: vars.radius.md,
  background: vars.color.status.activeBg,
  border: `${vars.borderWidth.thin} solid ${vars.color.status.activeText}`,
})

export const receiptTitle = style({
  margin: 0,
  marginBlockEnd: vars.space.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.status.activeText,
})

export const receiptGrid = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.lg,
})

// ── Download do arquivo (specs/103) — cópia de conferência, homologação apenas ──────────────────────
//
// Ação SECUNDÁRIA de propósito: o comprovante existe para informar que o pagamento saiu, e baixar o
// arquivo é conferência de layout com o banco — não pode competir visualmente com o que já aconteceu.
// Por isso contorno em vez de preenchimento, ao contrário do `launchBtn`, que dispara pagamento.
export const receiptActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space.md,
  marginBlockStart: vars.space.lg,
})

export const downloadBtn = style({
  padding: `${vars.space.sm} ${vars.space.lg}`,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.status.activeText}`,
  background: 'transparent',
  color: vars.color.status.activeText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  cursor: 'pointer',
  selectors: {
    '&:disabled': { cursor: 'not-allowed', opacity: 0.55 },
  },
})

/** Aviso de `falhas/`: o arquivo baixou, mas o envio ao banco NÃO completou. Âmbar, largura total. */
export const downloadWarn = style([notice, { inlineSize: '100%', marginBlockStart: vars.space.md }])

/** Recusa do download. Vermelho e de largura total — hash divergente não é detalhe de rodapé. */
export const downloadError = style([errorBox, { inlineSize: '100%', marginBlockStart: vars.space.md }])
