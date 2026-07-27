/**
 * Estilos da page "Posição de Pagamentos" — MOLDE do relatório "Realizado × Planejado" (identidade "brand",
 * full-bleed 28px, só-tokens §X). A pele do cabeçalho, dos filtros recolhíveis, dos KPIs e dos cartões de
 * gráfico é RE-EXPORTADA de `realizado-x-planejado.page.css.ts` (padrão sibling: mesma identidade, zero
 * duplicação, RxP intacto). Aqui só entram as duas peças específicas da Posição: a BARRA DE ACENTO dos KPIs na
 * paleta das 3 medidas + Total (vermelho/verde/âmbar/azul) e a grade de DOIS gráficos. Nenhum hex/px cru.
 */
import { style, styleVariants } from '@vanilla-extract/css'

import { brand } from '#shared/ui/brand/grid-brand.values.ts'
import { vars } from '#shared/ui/tokens/index.ts'

import { fldSelect } from './realizado-x-planejado.page.css.ts'

// Pele compartilhada do RxP (cabeçalho + filtros + cartões + KPIs) — re-export para a page importar tudo daqui.
export {
  head,
  backButton,
  headTitle,
  tools,
  filterToggle,
  filters,
  filtersInner,
  fld,
  fldLabel,
  fldCtrl,
  fldSelect,
  fldChev,
  applyButton,
  card,
  cardHeader,
  cardTitle,
  chartCard,
  chartPad,
  kpis,
  kpi,
  kpiLabel,
  kpiValue,
  kpiSub,
} from './realizado-x-planejado.page.css.ts'

import { kpi } from './realizado-x-planejado.page.css.ts'

// Barra de cor à esquerda de cada KPI da Posição (paleta das 3 medidas + Total). Aplicada por CLASSE.
export const kpiAccentPosicao = styleVariants({
  atrasado: { selectors: { [`${kpi}&::before`]: { background: brand.color.posicao.emAtraso } } },
  pago: { selectors: { [`${kpi}&::before`]: { background: brand.color.posicao.pago } } },
  aPagar: { selectors: { [`${kpi}&::before`]: { background: brand.color.posicao.aPagar } } },
  total: { selectors: { [`${kpi}&::before`]: { background: brand.color.posicao.total } } },
})

// Grade de DOIS gráficos: "Resumo total" (donut, mais estreito) + "Distribuição por Fornecedor" (barras, mais
// largo p/ os nomes longos). Colapsa em 1 coluna em telas estreitas.
export const charts2 = style({
  display: 'grid',
  gridTemplateColumns: '0.85fr 1.15fr',
  gap: brand.space.gridRow,
  marginBlockEnd: brand.space.gridRow,
  alignItems: 'stretch',
  '@media': { 'screen and (max-width: 75rem)': { gridTemplateColumns: '1fr' } },
})

// ── Empty state HONESTO (relatório vazio: 0 nós, totais 0) — cartão único centralizado, SEM KPIs/gráficos/
// tabela quebrados. Usado pela Posição de Recebimentos enquanto não há recebível registrado (remover o
// placeholder → cai aqui). Só-tokens (§X).
export const emptyPanel = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: brand.space.sm,
  textAlign: 'center',
  paddingBlock: '4rem',
  paddingInline: brand.space.xxl,
})

export const emptyTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.panelTitle,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})

export const emptyHint = style({
  margin: 0,
  fontSize: brand.text.body,
  color: brand.color.ink500,
  maxInlineSize: '32rem',
})

// Título + subtítulo (resumo dos filtros aplicados) empilhados no lugar do `<h1>` solto na barra do cabeçalho.
export const headTitleBlock = style({
  display: 'flex',
  flexDirection: 'column',
  gap: brand.space.xs,
  minInlineSize: 0,
})

// ── Período de vencimento: DOIS inputs de data (De / Até) lado a lado, no lugar de um dropdown (#588). ──
export const periodRow = style({ display: 'flex', gap: brand.space.sm, alignItems: 'flex-end' })

// Input de data com a MESMA pele do select (fldSelect), sem o chevron (é campo de texto, não dropdown).
export const dateInput = style([
  fldSelect,
  { minInlineSize: '8.5rem', paddingInlineEnd: brand.space.md, cursor: 'text' },
])
