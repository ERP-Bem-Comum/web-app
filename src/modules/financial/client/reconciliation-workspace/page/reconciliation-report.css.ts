/**
 * Estilos do Relatório da Conciliação em PDF (#144) — só-tokens (§X, vars.*), zero-runtime. O relatório vive
 * num bloco OCULTO no workspace: `printOnly` só aparece no `@media print`; `screenBody` (aplicado ao corpo do
 * workspace) some no print. O chrome do shell (`nav, header`) é ocultado globalmente (padrão de Contratos/
 * Relatórios) — no print o PDF contém só o relatório. O cabeçalho do relatório é um `<div>` (não `<header>`),
 * então NÃO é comido por esse `globalStyle`.
 */
import { style, globalStyle } from '@vanilla-extract/css'

import { brand } from '#shared/ui/brand/grid-brand.values.ts'
import { vars } from '#shared/ui/tokens/index.ts'

// Impressão (PDF via window.print): esconde o cromo do shell (sidebar + topbar) — igual aos Relatórios.
globalStyle('nav, header', { '@media': { print: { display: 'none !important' } } })

// Bloco de impressão: oculto na tela, visível SÓ no print (o artefato do PDF é só o relatório).
export const printOnly = style({
  display: 'none',
  '@media': { print: { display: 'block' } },
})

// Corpo do workspace (envolve TODO o s.screen atual): pass-through na tela, some no print. `display: contents`
// não gera caixa → zero regressão de layout on-screen; no print vira `none` e some com toda a subárvore.
export const screenBody = style({
  display: 'contents',
  '@media': { print: { display: 'none' } },
})

export const screen = style({
  blockSize: '100%',
  overflowY: 'auto',
  padding: vars.space.xl,
  background: vars.color.surface.app,
  fontFamily: vars.font.family.heading,
  color: vars.color.text.primary,
  '@media': {
    print: {
      padding: 0,
      background: vars.color.surface.default,
      overflow: 'visible',
    },
  },
})

// Impressão fiel: sem isto o navegador descarta os fundos (cabeçalho da tabela, cartões, lote).
const printExact = { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as const

// Folha do relatório — vira o corpo do PDF.
export const sheet = style({
  maxInlineSize: '60rem',
  marginInline: 'auto',
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  padding: vars.space.xl,
  '@media': {
    print: { border: 'none', borderRadius: 0, padding: 0, maxInlineSize: 'none' },
  },
})

export const header = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: vars.space.md,
  paddingBlockEnd: vars.space.md,
  marginBlockEnd: vars.space.lg,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})

export const headText = style({ display: 'flex', flexDirection: 'column', gap: vars.space.xs })

// Logo no canto superior direito.
export const logo = style({ flexShrink: 0 })

export const company = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: brand.color.ink900,
})

export const title = style({
  margin: 0,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: brand.color.ink900,
})

export const account = style({
  margin: 0,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: brand.color.ink900,
})

export const accountNumber = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  color: brand.color.ink500,
})

export const period = style({
  margin: 0,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: brand.color.ink900,
})

export const emission = style({
  display: 'flex',
  flexWrap: 'wrap',
  columnGap: vars.space.sm,
  fontSize: vars.font.size.xs,
  color: brand.color.ink700,
})
export const emissionLabel = style({ fontWeight: vars.font.weight.semibold, color: brand.color.ink500 })

// Cartões de saldo: saldo inicial, saldo final, entradas, saídas.
export const totals = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: vars.space.sm,
  marginBlockEnd: vars.space.lg,
})

export const card = style({
  ...printExact,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  padding: vars.space.md,
  borderRadius: vars.radius.md,
  background: brand.color.pageBg,
})

export const cardLabel = style({
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.semibold,
  textTransform: 'uppercase',
  color: brand.color.ink500,
})

export const cardValue = style({
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: brand.color.ink900,
  fontVariantNumeric: 'tabular-nums',
})

export const sectionTitle = style({
  margin: 0,
  marginBlockEnd: vars.space.sm,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: brand.color.ink900,
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
  fontSize: vars.font.size.xs,
})

// `table-header-group`: o cabeçalho repete a cada página do PDF.
export const thead = style({ display: 'table-header-group' })
export const tfoot = style({ display: 'table-row-group' })

// O fundo fica na linha, e não em cada célula: evita o filete entre colunas no PDF.
export const headRow = style({ ...printExact, background: brand.color.primary })
export const footRow = style({ ...printExact, background: brand.color.primary })

export const th = style({
  textAlign: 'left',
  padding: vars.space.sm,
  border: 'none',
  color: vars.color.brand.onBrand,
  fontWeight: vars.font.weight.semibold,
})
export const thDate = style([th, { inlineSize: '12%' }])
export const thValue = style([th, { inlineSize: '15%', textAlign: 'right' }])
export const thStatus = style([th, { inlineSize: '13%', whiteSpace: 'nowrap' }])

export const row = style({
  ...printExact,
  breakInside: 'avoid',
  selectors: { '&:nth-of-type(odd)': { background: brand.color.surfaceAlt } },
})
// Linha do lote em destaque, como na referência.
export const rowBatch = style({
  ...printExact,
  breakInside: 'avoid',
  background: brand.color.cadBg,
})

export const td = style({
  padding: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  color: brand.color.ink700,
  overflowWrap: 'anywhere',
})
export const tdRight = style([td, { textAlign: 'right', fontVariantNumeric: 'tabular-nums' }])

export const tdEmpty = style({
  padding: vars.space.lg,
  textAlign: 'center',
  color: brand.color.ink500,
})

// Títulos do lote: recuados, com a barra azul à esquerda.
export const batchRow = style({ breakInside: 'avoid' })
export const batchCell = style({
  padding: 0,
  paddingBlock: vars.space.xs,
  paddingInlineStart: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
})
export const batchBar = style({
  paddingInlineStart: vars.space.sm,
  borderInlineStart: `${vars.borderWidth.thin} solid ${brand.color.primary}`,
})
export const batchTable = style({ inlineSize: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' })
export const batchTh = style({
  ...printExact,
  textAlign: 'left',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  whiteSpace: 'nowrap',
  // Azul mais claro que o da linha do lote: separa os detalhes da transação.
  background: vars.color.partnerType.supplier.background,
  fontWeight: vars.font.weight.bold,
  color: brand.color.primary,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.primary}`,
})
export const batchThDoc = style([batchTh, { inlineSize: '19%' }])
export const batchThDue = style([batchTh, { inlineSize: '14%' }])
export const batchThValue = style([batchTh, { inlineSize: '20%', textAlign: 'right' }])
export const batchTitleRow = style({
  ...printExact,
  selectors: { '&:nth-of-type(odd)': { background: brand.color.surfaceAlt } },
})
export const batchTd = style({
  padding: vars.space.sm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  color: brand.color.ink700,
  overflowWrap: 'anywhere',
})
export const batchTdRight = style([batchTd, { textAlign: 'right', fontVariantNumeric: 'tabular-nums' }])

// Faixa de totais, separada da tabela.
export const footTd = style({
  padding: vars.space.sm,
  border: 'none',
  color: vars.color.brand.onBrand,
  fontWeight: vars.font.weight.bold,
})
export const footTdRight = style([footTd, { textAlign: 'right', fontVariantNumeric: 'tabular-nums' }])
export const footLabel = style({ marginInlineEnd: vars.space.lg, textTransform: 'uppercase' })

export const note = style({
  marginBlockStart: vars.space.sm,
  fontSize: vars.font.size['2xs'],
  color: brand.color.ink700,
})

export const empty = style({
  padding: vars.space.xl,
  textAlign: 'center',
  color: brand.color.ink500,
  fontSize: vars.font.size.md,
})
