/**
 * Estilos da TABELA EM ÁRVORE de Planejamento (linha-pai + versões-filhas via chevron). Só tokens (§X).
 * Reproduz o mapa §1.1/§4: cabeçalho azul-claro, chevron de expansão, badge + trilha de auditoria na
 * célula de status, linha expandida com fundo azul-clarinho. A cor não vem por dado aqui — é fixa por token.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

// Contorno leve (como no mockup base) — o azul (cyan) fica só no cabeçalho e no rodapé.
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

// Cabeçalho: Nunito (body), sem MAIÚSCULAS, peso forte, tinta índigo, sobre AZUL BEM CLARINHO
// (índigo bem diluído em branco), como no mock base.
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

export const thActions = style([th, { textAlign: 'end', inlineSize: '3rem' }])

// Linha clicável (navega ao detalhe do plano) — cursor + hover discreto (igual DataTable).
export const row = style({
  cursor: 'pointer',
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  transitionProperty: 'background-color',
  transitionDuration: '120ms',
  selectors: {
    '&:hover': { background: vars.color.surface.subtle },
  },
  '@media': {
    '(prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' },
  },
})

/** Linha-filha (versão expandida) — AZUL claro de marca (mais azulado que cinza). O PAI permanece branco;
 * a "linha do grupo" vem do CONECTOR (linha + dots) na coluna do nome, não de um acento na borda. */
export const childRow = style([
  row,
  {
    background: `color-mix(in srgb, ${vars.color.brand.normal} 8%, white)`,
    selectors: {
      '&:hover': { background: `color-mix(in srgb, ${vars.color.brand.normal} 13%, white)` },
    },
  },
])

// Linhas mais altas (mais respiro vertical — menos denso).
export const td = style({
  paddingBlock: vars.space.md,
  paddingInline: vars.space.md,
  verticalAlign: 'middle',
})

export const tdActions = style([td, { textAlign: 'end' }])

/** Célula do nome: chevron (se tem filhos) + nome + rótulo/subtítulo da versão. */
export const nameCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  minInlineSize: 0,
})

export const indent = style({
  display: 'inline-block',
  inlineSize: vars.space.lg,
  flexShrink: 0,
})

// Conector da versão-filha (linha vertical + dot), como no mock. `alignSelf:stretch` faz o wrapper ocupar
// a altura da linha; o `::before` (linha) estende ±md p/ ATRAVESSAR o padding e ligar às linhas vizinhas.
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

// Chip de ícone antes do nome do plano (mockup base): quadrado arredondado cyan-claro + ícone índigo.
export const planIcon = style({
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

export const nameText = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  minInlineSize: 0,
})

// Nome do plano — Nunito (body), em PRETO (tinta primária), como no mockup base.
export const planName = style({
  fontFamily: vars.font.family.body,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

/** Nome clicável do PAI (vai ao detalhe) — índigo (mock base). */
export const planNameLink = style([
  planName,
  {
    background: 'transparent',
    border: 'none',
    padding: 0,
    textAlign: 'start',
    cursor: 'pointer',
    color: vars.color.nav.background,
    fontWeight: vars.font.weight.bold,
    fontSize: vars.font.size.md,
    selectors: {
      '&:hover': { textDecoration: 'underline' },
      '&:focus-visible': {
        outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
        outlineOffset: vars.focusRing.offset,
      },
    },
  },
])

/** Nome da versão-filha — PRETO e um degrau MENOR que o pai (hierarquia, mock base). */
export const planNameLinkChild = style([
  planNameLink,
  { color: vars.color.text.primary, fontSize: vars.font.size.sm },
])

export const versionLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})

/** Célula de status: badge em cima, trilha de auditoria embaixo. */
export const statusCell = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: vars.space.xs,
})

// Coluna "Última alteração" — 2 linhas (mock base): "{usuário} alteração" + "dd/mm/aaaa hh:mm".
export const auditCell = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  fontFamily: vars.font.family.body,
})

export const auditWho = style({
  fontSize: vars.font.size.sm,
  color: vars.color.text.secondary,
})

export const auditWhen = style({
  fontSize: vars.font.size.xs,
  color: vars.color.text.muted,
})

// Seta de ordenação (↕) no cabeçalho do Total — afordância visual (ordenação funcional depois).
export const sortIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  marginInlineStart: vars.space.xs,
  color: vars.color.nav.background,
  verticalAlign: 'middle',
})

// Total (linha-pai) — Nunito, ÍNDIGO, BOLD, tabular, um degrau maior (mock base).
export const totalCell = style({
  fontFamily: vars.font.family.body,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: vars.font.weight.bold,
  fontSize: vars.font.size.md,
  color: vars.color.nav.background,
  whiteSpace: 'nowrap',
})

/** Total da versão-filha (expandida): PRETO, SEM negrito, um degrau menor. */
export const totalCellChild = style([
  totalCell,
  {
    color: vars.color.text.primary,
    fontWeight: vars.font.weight.regular,
    fontSize: vars.font.size.sm,
  },
])

// Badge de status com ícone (inline-flex + gap pequeno).
export const statusBadgeContent = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
})

// Rodapé "TOTAL geral" — AZUL BEM CLARINHO (mesmo tom do cabeçalho) + peso forte.
export const footerRow = style({
  background: `color-mix(in srgb, ${vars.color.nav.background} 6%, white)`,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
})

export const footerLabel = style({
  paddingBlock: vars.space.md,
  paddingInline: vars.space.md,
  fontFamily: vars.font.family.body,
  fontWeight: vars.font.weight.bold,
  color: vars.color.nav.background,
  whiteSpace: 'nowrap',
})

// Conteúdo do rótulo do rodapé: chip (pasta) + "TOTAL", em linha.
export const footerLabelContent = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
})

// Chip branco arredondado com o ícone de PASTA (como no mockup) — sobre a faixa cyan do rodapé.
export const footerIcon = style({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: `calc(${vars.space.lg} + ${vars.space.xs})`,
  blockSize: `calc(${vars.space.lg} + ${vars.space.xs})`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.default,
  color: vars.color.nav.background,
})

export const footerTotal = style({
  paddingBlock: vars.space.md,
  paddingInline: vars.space.md,
  fontFamily: vars.font.family.body,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: vars.font.weight.bold,
  color: vars.color.nav.background,
  whiteSpace: 'nowrap',
})

/** Estado vazio / carregando / erro dentro da tabela. */
export const stateCell = style({
  padding: vars.space.xl,
  textAlign: 'center',
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body,
})
