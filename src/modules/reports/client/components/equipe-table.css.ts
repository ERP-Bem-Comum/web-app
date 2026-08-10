/**
 * Tabela do relatório "Equipe ABC" — lista "brand" enxuta (só-tokens §X). Espelha o cartão dos grids brand
 * (surface + line + radius lg + sombra) e o thead uppercase 11.5px ink500. 8 colunas de exibição; rola na
 * vertical quando a lista for longa (corpo com altura máxima + overflow). px/hex crus NÃO entram aqui.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

// 8 colunas: Nome (flex) | Idade | Área | Função (flex) | Vínculo | Gênero | Raça/cor | Escolaridade.
const GRID_COLUMNS = 'minmax(12rem, 1.8fr) 4.5rem 6rem minmax(11rem, 1.6fr) 5rem 9rem 9rem 11rem'

export const card = style({
  background: brand.color.surface,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  borderRadius: brand.radius.lg,
  boxShadow: brand.shadow.card,
  overflow: 'hidden',
  fontFamily: vars.font.family.heading, // Inter
  color: brand.color.ink700,
  fontSize: brand.text.body,
})

export const cardHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.md,
  paddingBlock: brand.space.gridRow,
  paddingInline: brand.space.gridCol,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
})
export const cardTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.sectionH2,
  fontWeight: brand.weight.bold,
  color: brand.color.ink900,
})
export const cardCount = style({
  marginInlineStart: 'auto',
  fontSize: brand.text.hint,
  color: brand.color.ink400,
  fontVariantNumeric: 'tabular-nums',
})

// Corpo rolável (lista longa) — a linha de cabeçalho fica fixa (sticky) no topo do scroll.
export const scroller = style({ maxBlockSize: '32rem', overflowY: 'auto' })

const gridRow = style({
  display: 'grid',
  gridTemplateColumns: GRID_COLUMNS,
  alignItems: 'center',
  gap: brand.space.sm,
})

export const thead = style([
  gridRow,
  {
    position: 'sticky',
    insetBlockStart: 0,
    zIndex: 1,
    background: brand.color.surfaceAlt,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line}`,
    paddingBlock: brand.size.theadPadBlock,
    paddingInline: brand.size.rowPadInline,
    fontSize: brand.text.thead,
    fontWeight: brand.weight.semibold,
    letterSpacing: '.03em',
    textTransform: 'uppercase',
    color: brand.color.ink500,
    /**
     * Header QUEBRA em 2 linhas; o corpo é que fica em 1 (`cell` tem nowrap + ellipsis).
     *
     * Era `nowrap` SEM `overflow`/`ellipsis` — diferente das células do corpo, que têm os dois. Resultado:
     * todo rótulo maior que a coluna vazava POR CIMA do vizinho. Em produção a P.O. leu "ÁREA DE ATUAÇÃOFUNÇÃO"
     * grudado: "Área de atuação" em maiúsculas + `letterSpacing` não cabe nos 6rem da coluna. "Identidade de
     * gênero" (9rem) tinha o mesmo defeito.
     *
     * Por que quebrar em vez de alargar a coluna ou cortar com "…": alargar rouba espaço das colunas flexíveis
     * (Nome/Função) e só empurra o problema pro próximo rótulo longo; e um CABEÇALHO truncado ("ÁREA DE
     * ATUA…") esconde o nome da coluna — pior que duas linhas. `alignItems: center` do `gridRow` mantém o
     * alinhamento, e o `sticky` segue funcionando.
     */
    lineHeight: 1.2, // igual ao `equipe-charts.css.ts` vizinho (não há token de line-height no kit)
  },
])

export const row = style([
  gridRow,
  {
    paddingBlock: brand.size.rowPadBlock,
    paddingInline: brand.size.rowPadInline,
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
    selectors: {
      '&:last-child': { borderBlockEnd: 'none' },
      '&:hover': { background: brand.color.rowHover },
    },
  },
])

// Linha CLICÁVEL (abre o modal de detalhe). Acessível por teclado (role="button" + tabIndex).
export const rowClickable = style([
  row,
  {
    inlineSize: '100%',
    textAlign: 'start',
    border: 'none',
    borderBlockEnd: `${vars.borderWidth.thin} solid ${brand.color.line2}`,
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: 'inherit',
    transition: `background-color ${brand.ease}`,
    selectors: {
      '&:last-child': { borderBlockEnd: 'none' },
      '&:hover': { background: brand.color.rowHover },
      '&:focus-visible': {
        outline: `${vars.focusRing.width} solid ${brand.color.primary}`,
        outlineOffset: `-${vars.focusRing.width}`,
        background: brand.color.rowHover,
      },
    },
  },
])

export const cellName = style({
  fontWeight: brand.weight.semibold,
  color: brand.color.ink900,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const cell = style({
  color: brand.color.ink700,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
export const cellNum = style([cell, { fontVariantNumeric: 'tabular-nums' }])
// Célula com valor ausente ("N/A") — tinta mais suave.
export const cellMuted = style([cell, { color: brand.color.ink400 }])

export const empty = style({
  paddingBlock: brand.space.xxl,
  textAlign: 'center',
  color: brand.color.ink500,
  fontSize: brand.text.body,
})
