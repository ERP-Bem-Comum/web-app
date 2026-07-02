/**
 * Estilos da matriz consolidada (Detalhe do plano E Consolidado ABC — componente compartilhado). Só tokens
 * (§X). ESPELHA o grid de Planejamento já aprovado (`plan-tree-table.css.ts`): fonte Nunito (body) em toda a
 * matriz; cabeçalho e rodapé AZUL bem clarinho com tinta índigo (sem MAIÚSCULAS forçadas); linha-pai branca
 * com nome/total em índigo bold (um degrau maior); linha-filha azul-clarinho de marca com texto preto (um
 * degrau menor). Conector (linha vertical + dot) + indent por nível na coluna do nome; chip de ícone por
 * PROFUNDIDADE do nó. A cor não vem por dado aqui — é fixa por token.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
})

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.space.md,
  flexWrap: 'wrap',
})

// Título da seção com chip de ícone à esquerda (mini-cabeçalho: "Consolidado por Mês" etc.).
export const sectionTitleGroup = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

// Chip menor (proporcional aos mini-cabeçalhos internos) — quadrado arredondado azul-claro + ícone índigo.
export const sectionTitleIcon = style({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: `calc(${vars.space.lg} + ${vars.space.sm})`,
  blockSize: `calc(${vars.space.lg} + ${vars.space.sm})`,
  borderRadius: vars.radius.md,
  background: `color-mix(in srgb, ${vars.color.brand.normal} 10%, white)`,
  color: vars.color.nav.background,
})

// Título da seção — Nunito (body), índigo, peso forte (bate com o chrome do grid de Planejamento).
export const sectionTitle = style({
  margin: 0,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.nav.background,
})

export const controls = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

export const toggleGroup = style({
  display: 'inline-flex',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  overflow: 'hidden',
})

export const toggle = style({
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  border: 'none',
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: `calc(-1 * ${vars.focusRing.width})`,
    },
  },
})

// Toggle ativo = azul de marca (mock).
export const toggleActive = style({
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  selectors: { '&:hover': { background: vars.color.brand.hover } },
})

export const navButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  background: vars.color.surface.default,
  color: vars.color.text.primary,
  fontSize: vars.font.size.lg,
  lineHeight: 1,
  cursor: 'pointer',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

export const navDisabled = style({
  opacity: 0.4,
  cursor: 'not-allowed',
  selectors: { '&:hover': { background: vars.color.surface.default } },
})

// Contorno leve (como no grid de Planejamento) — o azul fica só no cabeçalho e no rodapé.
export const container = style({
  inlineSize: '100%',
  overflowX: 'auto',
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  background: vars.color.surface.default,
})

export const table = style({
  inlineSize: '100%',
  borderCollapse: 'collapse',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  color: vars.color.text.primary,
})

// Cabeçalho: Nunito (body), SEM MAIÚSCULAS, peso forte, tinta índigo, sobre AZUL BEM CLARINHO.
export const th = style({
  textAlign: 'start',
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.nav.background,
  background: `color-mix(in srgb, ${vars.color.nav.background} 6%, white)`,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  whiteSpace: 'nowrap',
})

// Colunas de valor alinhadas à ESQUERDA (mock): os totais mensais ficam encostados na borda inicial da coluna.
export const thMonth = style([th, { textAlign: 'start' }])

// Linha-pai (centro de custo) — permanece BRANCA; a "linha do grupo" vem do CONECTOR na coluna do nome.
export const row = style({
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  transitionProperty: 'background-color',
  transitionDuration: '120ms',
  selectors: { '&:hover': { background: vars.color.surface.subtle } },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' },
  },
})

// Linha-filha (categoria/subcategoria expandida) — AZUL claro de marca, texto preto (mock).
export const childRow = style([
  row,
  {
    background: `color-mix(in srgb, ${vars.color.brand.normal} 8%, white)`,
    selectors: {
      '&:hover': { background: `color-mix(in srgb, ${vars.color.brand.normal} 13%, white)` },
    },
  },
])

export const nameCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: `${vars.space.md} ${vars.space.md}`,
  minInlineSize: '16rem',
})

export const indent = style({
  display: 'inline-block',
  inlineSize: vars.space.lg,
  flexShrink: 0,
})

// Conector da linha-filha (linha vertical + dot), como no grid de Planejamento. `alignSelf:stretch` faz o
// wrapper ocupar a altura da linha; o `::before` estende ±md p/ ATRAVESSAR o padding e ligar às vizinhas.
export const connector = style({
  position: 'relative',
  flexShrink: 0,
  alignSelf: 'stretch',
  inlineSize: vars.space.lg,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      insetBlock: `calc(-1 * ${vars.space.md})`,
      insetInlineStart: '50%',
      inlineSize: vars.borderWidth.thick,
      transform: 'translateX(-50%)',
      background: vars.color.brand.normal,
    },
  },
})

export const connectorDot = style({
  position: 'relative',
  zIndex: 1,
  inlineSize: vars.space.sm,
  blockSize: vars.space.sm,
  borderRadius: '50%',
  background: vars.color.brand.normal,
})

export const chevronButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.5rem',
  blockSize: '1.5rem',
  flexShrink: 0,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: vars.color.text.secondary,
  cursor: 'pointer',
  borderRadius: vars.radius.sm,
  selectors: {
    '&:hover': { background: vars.color.surface.subtle, color: vars.color.text.primary },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

// Chip de ícone antes do nome da linha (quadrado arredondado azul-claro + ícone índigo, igual ao planIcon).
export const rowIcon = style({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: `calc(${vars.space.lg} + ${vars.space.xs})`,
  blockSize: `calc(${vars.space.lg} + ${vars.space.xs})`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.canvas,
  color: vars.color.nav.background,
})

export const nameText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  minInlineSize: 0,
})

// Nome da linha-pai — Nunito, ÍNDIGO, BOLD, um degrau maior (hierarquia, mock).
export const rowName = style({
  fontFamily: vars.font.family.body,
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.md,
  color: vars.color.nav.background,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

// Nome da linha-filha — PRETO e um degrau MENOR que o pai.
export const rowNameChild = style([
  rowName,
  {
    color: vars.color.text.primary,
    fontWeight: vars.font.weight.semibold,
    fontSize: vars.font.size.sm,
  },
])

// Subtotal do nó (abaixo do nome) — Nunito, tabular, secundário.
export const ccSubtotal = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
  fontVariantNumeric: 'tabular-nums',
})

export const monthCell = style({
  padding: `${vars.space.md} ${vars.space.md}`,
  // Alinhado à ESQUERDA (mock): valores mensais encostam na borda inicial da coluna, não à direita.
  textAlign: 'start',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
})

// Rodapé "TOTAL" — AZUL BEM CLARINHO (mesmo tom do cabeçalho) + tinta índigo bold.
export const totalRow = style({
  background: `color-mix(in srgb, ${vars.color.nav.background} 6%, white)`,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const totalLabelCell = style({
  padding: `${vars.space.md} ${vars.space.md}`,
  fontFamily: vars.font.family.body,
  fontWeight: vars.font.weight.bold,
  color: vars.color.nav.background,
  whiteSpace: 'nowrap',
})

// "TOTAL: R$ …" com a balança à esquerda (mock).
export const totalLabelGroup = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

// Chip da balança no rodapé — quadrado arredondado azul-claro + ícone índigo (igual ao chip das linhas).
export const totalLabelIcon = style({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: `calc(${vars.space.lg} + ${vars.space.xs})`,
  blockSize: `calc(${vars.space.lg} + ${vars.space.xs})`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.canvas,
  color: vars.color.nav.background,
})

// Totais por mês/coluna no rodapé — ÍNDIGO bold, tabular (mock: totais mensais no rodapé).
export const totalMonthCell = style([
  monthCell,
  {
    fontFamily: vars.font.family.body,
    fontWeight: vars.font.weight.bold,
    color: vars.color.nav.background,
  },
])
