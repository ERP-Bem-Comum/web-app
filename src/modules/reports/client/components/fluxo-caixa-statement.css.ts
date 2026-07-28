/**
 * Estilos do "Demonstrativo de fluxo de caixa" (statement por mês) — CSS GRID por LINHA (cada `.srow` é um grid
 * próprio, mesmo template via inline-style no componente, por causa do nº dinâmico de meses). 1ª coluna
 * (Descrição) STICKY; 2 subcolunas (Real | Prev) por mês + coluna Total. Identidade "brand", só-tokens (§X).
 *
 * O fundo do sticky (Descrição) e da coluna Total ACOMPANHA a faixa da linha (seção Entradas/Saídas, Fluxo
 * líquido, Saldo) via CSS custom properties (`rowBg`/`totBg`) — assim o sticky não deixa vazar o conteúdo que
 * rola por baixo. As larguras das colunas vivem no componente (rem cru em inline-style é permitido).
 */
import { createVar, style, styleVariants } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// Card + cabeçalho + scroll — reusa a casca dos demais cartões do relatório.
export { card, cardHeader as cardHeadRow, cardTitle } from '../page/realizado-x-planejado.page.css.ts'
export { scroll } from './realizado-table.css.ts'

// Fundo da linha (sticky Descrição) e da coluna Total — sobrescritos por tipo de linha.
const rowBg = createVar()
const totBg = createVar()

// Dica do cabeçalho do card ("valores em R$ · role para os demais meses ›").
export const hint = style({
  fontSize: brand.text.label,
  color: brand.color.ink400,
})

// ── Filtro de meses (De / Até) no cabeçalho do card ──
export const picker = style({
  marginInlineStart: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
})
export const pickerLabel = style({
  fontSize: brand.text.label,
  fontWeight: brand.weight.medium,
  color: brand.color.ink500,
})
export const pickerSelect = style({
  appearance: 'none',
  fontFamily: 'inherit',
  fontSize: brand.text.label,
  color: brand.color.ink900,
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.xs,
  paddingBlock: brand.space.xs,
  paddingInline: brand.space.sm,
  cursor: 'pointer',
})
// Passador de mês (setas ‹ ›) — desloca a janela De/Até em 1 mês.
export const pickerNav = style({
  display: 'grid',
  placeItems: 'center',
  inlineSize: '1.75rem',
  blockSize: '1.75rem',
  color: brand.color.ink700,
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.xs,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': { background: brand.color.surfaceAlt },
    '&:disabled': { color: brand.color.ink400, cursor: 'not-allowed', opacity: '0.6' },
  },
})

// Container do demonstrativo (largura mínima garante o scroll horizontal quando há muitos meses).
export const stmt = style({ display: 'inline-block', minInlineSize: '100%' })

// Uma linha do demonstrativo (grid; template vem por inline-style). Fundos default (linha comum).
export const srow = style({
  vars: { [rowBg]: brand.color.surface, [totBg]: brand.color.fluxo.stmtTotBg },
  display: 'grid',
  alignItems: 'center',
  background: rowBg,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
})

// Célula de valor: à direita, tabular, sem quebra. Padding inline enxuto p/ caber sem sobrepor.
export const cell = style({
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.sm,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  fontSize: brand.text.body,
})

// Valor REALIZADO (principal) × PREVISTO (secundário, atenuado).
export const valReal = style({ color: brand.color.ink900, fontWeight: brand.weight.medium })
export const valPrev = style({ color: brand.color.ink500 })
// Valor ZERO — atenua para não competir com os presentes.
export const valZero = style({ color: brand.color.ink400 })

// Coluna Descrição — STICKY à esquerda, fundo acompanha a linha (rowBg).
export const desc = style({
  position: 'sticky',
  insetInlineStart: 0,
  zIndex: 1,
  background: rowBg,
  borderInlineEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.md,
  textAlign: 'left',
  whiteSpace: 'nowrap',
  fontSize: brand.text.body,
})

// Célula da coluna Total — fundo próprio (totBg) + divisória à esquerda.
export const totCell = style({
  background: totBg,
  borderInlineStart: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
})

// ── Cabeçalho (2 faixas: nomes de mês + subcolunas Real/Prev) ──
export const sheadMonths = style({
  display: 'grid',
  background: brand.color.surfaceAlt,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})
export const sheadMeas = style({
  display: 'grid',
  background: brand.color.surfaceAlt,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})
export const headCell = style({
  paddingBlock: brand.space.xs,
  paddingInline: brand.space.md,
  fontSize: brand.text.thead,
  fontWeight: brand.weight.semibold,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  color: brand.color.ink500,
  textAlign: 'right',
  whiteSpace: 'nowrap',
})
export const headMonth = style([headCell, { textAlign: 'center' }])
export const headDesc = style([
  headCell,
  {
    position: 'sticky',
    insetInlineStart: 0,
    zIndex: 1,
    background: brand.color.surfaceAlt,
    textAlign: 'left',
    borderInlineEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
  },
])
export const headTot = style([headCell, { color: brand.color.fluxo.previsto, textAlign: 'center' }])

// ── Tipos de linha (sobrescrevem rowBg/totBg — o sticky/Total acompanham a faixa) ──
export const rowKind = styleVariants({
  saldo: {
    vars: { [rowBg]: brand.color.fluxo.stmtSaldoBg, [totBg]: brand.color.fluxo.stmtSaldoBg },
    fontWeight: brand.weight.semibold,
  },
  sectionIn: {
    vars: { [rowBg]: brand.color.fluxo.stmtInBand, [totBg]: brand.color.fluxo.stmtInBand },
  },
  sectionOut: {
    vars: { [rowBg]: brand.color.fluxo.stmtOutBand, [totBg]: brand.color.fluxo.stmtOutBand },
  },
  subtotal: {
    borderBlockStart: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    fontWeight: brand.weight.bold,
  },
  netNeg: {
    vars: { [rowBg]: brand.color.fluxo.stmtNetNegBg, [totBg]: brand.color.fluxo.stmtNetNegBg },
    borderBlock: `${vars.borderWidth.thick} solid ${brand.color.fluxo.stmtOutBand}`,
    fontWeight: brand.weight.bold,
  },
  netPos: {
    vars: { [rowBg]: brand.color.fluxo.stmtNetPosBg, [totBg]: brand.color.fluxo.stmtNetPosBg },
    borderBlock: `${vars.borderWidth.thick} solid ${brand.color.fluxo.stmtInBand}`,
    fontWeight: brand.weight.bold,
  },
  item: {
    selectors: { '&:hover': { vars: { [rowBg]: brand.color.surfaceAlt } } },
  },
})

// Descrição da FAIXA de seção (Entradas verde / Saídas rosa) — texto colorido + caixa alta.
export const sectionDescBase = style({
  fontWeight: brand.weight.bold,
  fontSize: brand.text.thead,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
})
export const sectionDescIn = style([sectionDescBase, { color: brand.color.fluxo.stmtInInk }])
export const sectionDescOut = style([sectionDescBase, { color: brand.color.fluxo.stmtOutInk }])

// Sinal (+/−) antes do rótulo da seção.
export const sign = style({
  display: 'inline-block',
  inlineSize: '1rem',
  color: brand.color.ink400,
  fontWeight: brand.weight.bold,
})

// Descrição de ITEM (categoria) — recuada.
export const descItem = style({ paddingInlineStart: brand.space.xxl, color: brand.color.ink700 })
// Descrição de SUBTOTAL/net/saldo — tinta forte.
export const descStrong = style({ color: brand.color.ink900, fontWeight: brand.weight.bold })

// Valor do Fluxo líquido colorido por sinal (verde positivo / vermelho suave negativo).
export const netValuePos = style({ color: brand.color.fluxo.stmtInInk })
export const netValueNeg = style({ color: brand.color.fluxo.stmtOutInk })

// Nota de seção vazia (Entradas sem receivables) — linha única discreta.
export const emptyNote = style({
  gridColumn: '1 / -1',
  paddingBlock: brand.space.md,
  paddingInline: brand.space.xxl,
  color: brand.color.ink400,
  fontStyle: 'italic',
  fontSize: brand.text.body,
})
