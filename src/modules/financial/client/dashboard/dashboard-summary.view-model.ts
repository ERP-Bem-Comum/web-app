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

// Tom categórico do donut (paleta dedicada `brand.color.dash.donut*`) — NÃO reaproveita o accent semântico
// dos cards (evita o vermelho de erro numa categoria neutra). c1=azul · c2=ciano · c3=verde-azulado · c4=âmbar.
export type DonutTone = 'c1' | 'c2' | 'c3' | 'c4'

/** Fatia do donut: rótulo (i18n) + valor + tom categórico da cor. */
export type DonutSlice = Readonly<{
  id: string
  labelKey: string
  value: number
  tone: DonutTone
}>

/**
 * Fornecedor sem contrato (linha de origem do card do Dashboard). `valorTotalCents` = total pago ao
 * fornecedor SEM contrato (centavos inteiros, §IV). Placeholder p/ ligar depois (core-api#112/#114).
 */
export type SupplierWithoutContract = Readonly<{ id: string; name: string; valorTotalCents: number }>

/** Status de compliance de um fornecedor perante o limite de dispensa (dirige a cor da barra). */
export type SupplierComplianceStatus = 'over' | 'at' | 'within'

/**
 * Barra de compliance JÁ derivada (pura) do fornecedor: nome + total (centavos) + % utilizado BRUTA (pode
 * passar de 100, usada p/ a LARGURA proporcional) + status (cor). A View não calcula nada — só apresenta.
 */
export type SupplierComplianceBar = Readonly<{
  id: string
  name: string
  valorTotalCents: number
  /** % utilizado do limite (valorTotal / limite * 100). Pode passar de 100. */
  utilizadoPct: number
  status: SupplierComplianceStatus
}>

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
/** Fatias do donut "Pagamentos por Centro de Custo em %" (placeholder até core-api#112; `value` em centavos —
 * a View calcula a % pela fração do total). Cores distintas via `tone` (paleta dedicada, sem vermelho). */
export const DONUT_SLICES: readonly DonutSlice[] = [
  { id: 'strategic', labelKey: 'dashboard.cost-center.slice.strategic', value: 4_500_000, tone: 'c1' },
  { id: 'logistics', labelKey: 'dashboard.cost-center.slice.logistics', value: 3_200_000, tone: 'c2' },
  { id: 'admin', labelKey: 'dashboard.cost-center.slice.admin', value: 2_800_000, tone: 'c3' },
  { id: 'events', labelKey: 'dashboard.cost-center.slice.events', value: 1_500_000, tone: 'c4' },
] as const

// ── Fornecedores sem Contrato (linha 2, direita-baixo) ────────────────────────
/**
 * Limite de DISPENSA de contrato: R$ 10.000,00 = 1.000.000 centavos (mesmo teto do relatório
 * "Fornecedores sem Contrato"). Acima dele o fornecedor DEVERIA ter contrato (estouro = danger).
 */
export const LIMITE_CENTS = 1_000_000

/**
 * Placeholder REALISTA (mix) do card de compliance (centavos inteiros). Inclui 2 fornecedores ACIMA do
 * limite (vermelho), 1 EXATAMENTE no limite (cinza) e 3 DENTRO (azul), para o modelo ficar visível. Nomes
 * no espírito do relatório. Ligar quando houver endpoint (core-api#112/#114).
 */
export const SUPPLIERS_WITHOUT_CONTRACT: readonly SupplierWithoutContract[] = [
  { id: 'wee-travel', name: 'WEE TRAVEL', valorTotalCents: 1_298_185 }, // R$ 12.981,85 → 129,82% (over)
  { id: 'a3-turismo', name: 'A3 TURISMO', valorTotalCents: 1_142_000 }, // R$ 11.420,00 → 114,20% (over)
  { id: 'ana-sicilia', name: 'ANA SICILIA', valorTotalCents: 1_000_000 }, // R$ 10.000,00 → 100% (at)
  { id: 'polo-moveis', name: 'POLO MOVEIS', valorTotalCents: 742_000 }, // R$ 7.420,00 → 74,20% (within)
  { id: 'tecnovetti', name: 'TECNOVETTI', valorTotalCents: 435_000 }, // R$ 4.350,00 → 43,50% (within)
  { id: 'associacao-bem-comum', name: 'Associação Bem Comum', valorTotalCents: 128_000 }, // R$ 1.280,00 → 12,80% (within)
] as const

/**
 * Deriva (PURO, §XI) a barra de compliance de cada fornecedor perante `limiteCents`: % utilizado + status
 * (over > limite; at == limite; within < limite — comparação ESTRITA: 100% exato NÃO estoura). Ordena
 * DECRESCENTE por `valorTotalCents` (top ofensores primeiro; sort estável do V8 preserva empates). NÃO muta
 * a entrada (copia antes de ordenar §VII). Fonte ÚNICA de verdade da cor/ordenação das barras.
 */
export function deriveSupplierComplianceBars(
  suppliers: readonly SupplierWithoutContract[],
  limiteCents: number,
): readonly SupplierComplianceBar[] {
  return [...suppliers]
    .sort((a, b) => b.valorTotalCents - a.valorTotalCents)
    .map((s) => {
      const status: SupplierComplianceStatus =
        s.valorTotalCents > limiteCents ? 'over' : s.valorTotalCents === limiteCents ? 'at' : 'within'
      return {
        id: s.id,
        name: s.name,
        valorTotalCents: s.valorTotalCents,
        utilizadoPct: limiteCents === 0 ? 0 : (s.valorTotalCents / limiteCents) * 100,
        status,
      }
    })
}

const brlFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Centavos → "R$ 12.981,85" (valor do fornecedor no card/tooltip). */
export function formatSupplierBRL(cents: number): string {
  return brlFmt.format(cents / 100)
}

/**
 * Percentual utilizado no formato do relatório: 2 dígitos INTEIROS zero-padded + vírgula + 2 decimais + "%".
 * Ex.: 129.82 → "129,82%"; 12.8 → "12,80%". A parte inteira só zero-pada até 2 dígitos; ≥ 100 mantém tudo.
 */
export function formatSupplierPercent(pct: number): string {
  const fixed = pct.toFixed(2)
  const [intPart = '0', decPart = '00'] = fixed.split('.')
  return `${intPart.padStart(2, '0')},${decPart}%`
}
