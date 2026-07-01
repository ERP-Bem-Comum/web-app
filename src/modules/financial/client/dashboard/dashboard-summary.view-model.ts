/**
 * dashboard-summary.view-model — NÚCLEO PURO (ADR-0009, §XI): sem import de react/@tanstack.
 * Constantes/derivação dos dados PLACEHOLDER da tela "Dashboard - Resumo Mensal" (043):
 *  - as 4 métricas (rótulo/valor/tendência/legenda + accent semântico do ícone);
 *  - as 2 séries do gráfico de linha (pontos placeholder: pico Fev-Mar → zero);
 *  - as fatias do donut (vazio por ora).
 * Tipos como uniões/`Readonly` + `as const` (§IV/§VII). A cor concreta (token vanilla-extract)
 * é escolhida na VIEW a partir do `accent`/`series` semântico — o núcleo não conhece `vars`.
 *
 * Pronto para ligar dados reais depois (core-api#112): trocar as constantes por derivação da fn.
 */

// Accent semântico do ícone circular de cada métrica. A View mapeia p/ token de cor (§X).
export type MetricAccent = 'red' | 'green' | 'indigo' | 'orange'

// Ícone semântico de cada métrica. A View mapeia p/ o componente de ícone (#shared/ui/icons).
export type MetricIconName = 'wallet' | 'trending-up' | 'heart-handshake' | 'users'

export type MetricCardData = Readonly<{
  id: string
  /** chave i18n do rótulo pequeno (topo do card) */
  labelKey: string
  /** valor grande, já formatado p/ apresentação (placeholder) */
  value: string
  /** percentual de tendência, já formatado (placeholder) */
  trendPercent: string
  /** chave i18n da legenda da tendência (após o "·") */
  trendLabelKey: string
  accent: MetricAccent
  icon: MetricIconName
}>

// Papel da série no gráfico de linha. A View mapeia p/ token de cor (vars.color.chart.*).
export type ChartSeriesId = 'forecast' | 'realized'

/** Ponto do gráfico: mês (0..11) → valor em reais. Domínio Y placeholder R$0..R$18k. */
export type ChartPoint = Readonly<{ month: number; value: number }>

export type ChartSeries = Readonly<{
  id: ChartSeriesId
  /** chave i18n do nome da série (legenda) */
  labelKey: string
  points: readonly ChartPoint[]
}>

/** Fatia do donut: rótulo (i18n) + valor + accent semântico da cor. */
export type DonutSlice = Readonly<{
  id: string
  labelKey: string
  value: number
  accent: MetricAccent
}>

/** Item da lista "Fornecedores sem Contrato" (nome + valor já formatado). Placeholder p/ ligar depois. */
export type SupplierWithoutContract = Readonly<{ id: string; name: string; value: string }>

// ── Placeholder das 4 métricas (linha 1) ──────────────────────────────────────
export const METRIC_CARDS: readonly MetricCardData[] = [
  {
    id: 'expenses',
    labelKey: 'dashboard.metric.expenses.label',
    value: 'R$ 0,00',
    trendPercent: '0%',
    trendLabelKey: 'dashboard.metric.expenses.trend',
    accent: 'red',
    icon: 'wallet',
  },
  {
    id: 'revenue',
    labelKey: 'dashboard.metric.revenue.label',
    value: 'R$ 0,00',
    trendPercent: '0%',
    trendLabelKey: 'dashboard.metric.revenue.trend',
    accent: 'green',
    icon: 'trending-up',
  },
  {
    id: 'top-financier',
    labelKey: 'dashboard.metric.top-financier.label',
    value: '0%',
    trendPercent: '0%',
    trendLabelKey: 'dashboard.metric.top-financier.trend',
    accent: 'indigo',
    icon: 'heart-handshake',
  },
  {
    id: 'top-cost-center',
    labelKey: 'dashboard.metric.top-cost-center.label',
    value: 'R$ 0,00',
    trendPercent: '0%',
    trendLabelKey: 'dashboard.metric.top-cost-center.trend',
    accent: 'orange',
    icon: 'users',
  },
] as const

// ── Domínio do gráfico de linha (linha 2, esquerda) ───────────────────────────
/** Máximo do eixo Y (R$18M) — usado p/ escalar os pontos e desenhar as gridlines. Escala em REAIS. */
export const CHART_Y_MAX = 18_000_000
/** Gridlines pontilhadas horizontais (R$4.5M/9M/13.5M/18M). */
export const CHART_Y_TICKS: readonly number[] = [4_500_000, 9_000_000, 13_500_000, 18_000_000] as const
/** 12 meses no eixo X (Jan..Dez). Rótulos vêm por i18n na View. */
export const CHART_MONTHS = 12

/**
 * Séries placeholder (valores em REAIS, escala de milhões — fiel ao eixo R$M do legado). Duas linhas:
 * Previsto (onda: pico em Mar ~13.5M e Jun ~16.5M) e Realizado (curva abaixo, ~70-80% do previsto).
 * Pontos por props — ao ligar dados reais, basta substituir `points`.
 */
export const CHART_SERIES: readonly ChartSeries[] = [
  {
    id: 'forecast',
    labelKey: 'dashboard.chart.series.forecast',
    points: [
      { month: 0, value: 6_000_000 },
      { month: 1, value: 9_000_000 },
      { month: 2, value: 13_500_000 },
      { month: 3, value: 9_500_000 },
      { month: 4, value: 8_900_000 },
      { month: 5, value: 16_500_000 },
      { month: 6, value: 7_000_000 },
      { month: 7, value: 9_500_000 },
      { month: 8, value: 8_500_000 },
      { month: 9, value: 7_500_000 },
      { month: 10, value: 9_500_000 },
      { month: 11, value: 7_500_000 },
    ],
  },
  {
    id: 'realized',
    labelKey: 'dashboard.chart.series.realized',
    points: [
      { month: 0, value: 4_200_000 },
      { month: 1, value: 6_800_000 },
      { month: 2, value: 10_900_000 },
      { month: 3, value: 7_600_000 },
      { month: 4, value: 6_900_000 },
      { month: 5, value: 12_800_000 },
      { month: 6, value: 5_400_000 },
      { month: 7, value: 7_700_000 },
      { month: 8, value: 6_600_000 },
      { month: 9, value: 5_900_000 },
      { month: 10, value: 7_500_000 },
      { month: 11, value: 6_000_000 },
    ],
  },
] as const

// ── Donut (linha 2, direita-topo) ─────────────────────────────────────────────
/** Fatias do donut "Pagamentos por Centro de Custo em %". Vazio por ora → estado vazio na View. */
export const DONUT_SLICES: readonly DonutSlice[] = [] as const

// ── Fornecedores sem Contrato (linha 2, direita-baixo) ────────────────────────
/** Lista placeholder (nome + valor formatado), fiel ao legado. Ligar quando houver endpoint. */
export const SUPPLIERS_WITHOUT_CONTRACT: readonly SupplierWithoutContract[] = [
  { id: 'lucas-gabriel', name: 'LUCAS GABRIEL', value: 'R$ 1.100,00' },
  { id: 'samantha-evelyn', name: 'SAMANTHA EVELYN', value: 'R$ 810,00' },
  { id: 'beneficio-social', name: 'Beneficio Social', value: 'R$ 352,00' },
  { id: 'elys-vanny', name: 'ELYS VANNY', value: 'R$ 11,00' },
  { id: 'associacao-bem-comum', name: 'Associação Bem Comum', value: 'R$ 10,80' },
] as const
