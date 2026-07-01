/**
 * DashboardPage "Resumo Mensal" (043) — estilos (vanilla-extract, §X: só-tokens, zero hex/px cru).
 * Layout em 2 linhas (flex column), fiel ao legado:
 *  - linha 1 (`metricsRow`): grid de 4 cards de métrica (auto-fit, colapsa no mobile);
 *  - linha 2 (`contentRow`): 2 colunas 2fr/1fr → colapsa em 1 col no mobile:
 *      · ESQUERDA (`leftColumn`): card "Visão geral" (gráfico) + "Últimos pagamentos" empilhados;
 *      · DIREITA (`rightColumn`): donut + "Fornecedores sem Contrato" empilhados.
 * Fundo = canvas AZUL-CLARO de marca (surface.canvas) que preenche TODA a área de conteúdo (a rota é
 * full-bleed no shell → sem a margem branca do `main`); os cards brancos contrastam com o azul. `fontFamily`
 * do body evita a serifa do body default (Times). Espaçamentos em `md` (não `lg`) p/ densidade de dashboard.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const page = style({
  fontFamily: vars.font.family.body,
  background: vars.color.surface.canvas,
  color: vars.color.text.secondary,
  // O shell (DynamicContainer) é altura-fixa + overflow:hidden. `blockSize:100%` dá altura LIMITADA
  // (= a área de conteúdo) para o próprio `page` ser o container de rolagem: com `overflowY:auto`, o
  // conteúdo mais alto que a viewport rola AQUI (senão estoura o shell overflow:hidden e some a barra).
  blockSize: '100%',
  overflowY: 'auto',
  paddingInline: vars.space.lg,
  paddingBlock: vars.space.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  // Scrollbar alinhada ao canvas: trilha/canto TRANSPARENTES (deixam o azul-claro aparecer, sem faixa
  // branca) e polegar discreto. Firefox via scrollbar-color; Chromium via pseudo-elementos.
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.color.border.subtle} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.625rem' },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-corner': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': {
      background: vars.color.border.subtle,
      borderRadius: vars.radius.lg,
    },
  },
})

// Título da página — mesmo estilo dos demais módulos (PageHeader do shell): Nunito, xl, bold, tinta do chrome.
// Renderizado NA página (não no shell) porque a rota é full-bleed: assim o título respeita o padding do
// canvas em vez de encostar na borda.
export const pageTitle = style({
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xl,
  fontWeight: vars.font.weight.bold,
  color: vars.color.nav.ink,
  margin: 0,
})

// Linha 1 — 4 cards de métrica. auto-fit com largura mínima: 4 colunas no desktop, colapsa no mobile.
export const metricsRow = style({
  display: 'grid',
  gap: vars.space.md,
  gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
})

// Linha 2 — 2fr (esquerda) / 1fr (direita). Colapsa em 1 coluna abaixo de 60rem.
export const contentRow = style({
  display: 'grid',
  gap: vars.space.md,
  gridTemplateColumns: '2fr 1fr',
  alignItems: 'start',
  '@media': {
    'screen and (max-width: 60rem)': {
      gridTemplateColumns: '1fr',
    },
  },
})

// Coluna esquerda da linha 2: gráfico "Visão geral" (topo) + "Últimos pagamentos" (baixo), empilhados.
// `minInlineSize:0` deixa o SVG/tabela encolherem dentro da coluna do grid (senão estouram a largura).
export const leftColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  minInlineSize: 0,
})

// Coluna direita da linha 2: donut (topo) + fornecedores (baixo), empilhados.
export const rightColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
})

const cardBase = style({
  fontFamily: vars.font.family.body,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.border.subtle}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.card,
  padding: vars.space.md,
})

export const overviewCard = style([
  cardBase,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: vars.space.md,
  },
])

export const overviewHeader = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: vars.space.md,
})

export const overviewTitles = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
})

export const overviewTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})

// Legenda do gráfico NO TOPO (única — o gráfico não repete a legenda embaixo). "Previsto" ciano ×
// "Realizado" verde, casando com as cores das séries (papéis de gráfico da marca).
export const overviewLegend = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.xs,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
})

export const legendForecast = style({ color: vars.color.chart.forecast })
export const legendRealized = style({ color: vars.color.chart.realized })
export const legendSep = style({ color: vars.color.text.muted, fontWeight: vars.font.weight.regular })

// "Ver tudo" = botão de AÇÃO preenchido (cor de marca) — leva ao módulo de Relatórios (quando existir).
export const seeAllLink = style({
  border: 'none',
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  cursor: 'pointer',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.md,
  selectors: {
    '&:hover': { background: vars.color.brand.hover },
  },
})

export const costCenterCard = style([
  cardBase,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: vars.space.md,
  },
])

export const costCenterTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.text.primary,
})
