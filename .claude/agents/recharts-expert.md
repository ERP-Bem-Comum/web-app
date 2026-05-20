---
name: recharts-expert
description: >
  Especialista em gráficos no `erp-financeiro-frontend`. **Recharts é canônico**
  (`highcharts`/`chart.js` saíram). Cobre BarChart/LineChart/PieChart/AreaChart,
  `Cell` para cor por item, `ReferenceLine`, `Brush` (para pan/scroll), tooltip
  customizado, `ResponsiveContainer`, e o wrapper shadcn em
  `src/components/ui/chart.tsx` (`ChartContainer`/`ChartTooltip`/
  `ChartTooltipContent`). Padrões já em uso em `src/components/layout/charts/`
  e `src/components/reports/components/*/`. Use sempre que tarefa for sobre
  gráfico novo, refactor de chart, tooltip, legend, eixo, ou cor por item.
---

# recharts-expert

Especialista em **recharts** no `erp-financeiro-frontend`. Roteador: [`frontend-orchestrator`](./frontend-orchestrator.md).

---

## Versões fixadas

| Pacote | Versão | Papel |
| --- | --- | --- |
| `recharts` | `3.8.1` | Única lib de charts do projeto |

> `highcharts`, `highcharts-react-official`, `chart.js` foram removidos. Não reintroduzir.

---

## Padrões já em uso

```
src/components/ui/chart.tsx           # wrapper shadcn (ChartContainer + ChartTooltip + ChartTooltipContent)
src/components/layout/charts/
├── BarChart.tsx                      # GenericBarChart (vertical, horizontal, multiple, multipleVertical)
├── PieChart.tsx
├── PieChartDonut.tsx
└── MultipleLineChart.tsx
src/components/reports/components/
├── analysis/AnalysisCharts.tsx
├── cashFlow/FlowChart.tsx            # LineChart com Brush
├── cashFlow/FlowCostCentersBarChart.tsx
├── accountsPosition/AccountsCharts.tsx
└── realized/RealizedCharts.tsx
src/components/budgetPlan/budgetPlanDetail/GraphInsight.tsx  # BarChart sparkline + ReferenceLine
src/components/dashboard/components/charts/
├── CostCentersBarChart.tsx
└── RealizedExpectedLineChart.tsx
```

**Antes de criar um chart novo, abra um vizinho do mesmo tipo** (bar/line/pie) e siga o padrão.

---

## Wrapper shadcn (`src/components/ui/chart.tsx`)

Para charts "de produto" com tooltip padronizado:

```tsx
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const chartConfig: ChartConfig = {
  expected: { label: 'Esperado', color: 'hsl(var(--chart-1))' },
  realized: { label: 'Realizado', color: 'hsl(var(--chart-2))' },
}

<ChartContainer config={chartConfig} className="h-[300px] w-full">
  <BarChart data={data}>
    <XAxis dataKey="month" />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="expected" fill="var(--color-expected)" />
    <Bar dataKey="realized" fill="var(--color-realized)" />
  </BarChart>
</ChartContainer>
```

CSS vars `--color-<key>` vêm automaticamente do `chartConfig` (Tailwind expõe via `<style>`).

---

## Recharts puro (quando não cabe wrapper shadcn)

Para casos mais "raw" (ex.: tooltip muito custom, layout específico):

```tsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Brush,
} from 'recharts'

<ResponsiveContainer width="100%" height={360}>
  <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 24, left: 8 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#E0E4E4" />
    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#666' }} />
    <YAxis tickFormatter={(v) => maskMonetaryValue(Number(v))} width={90} />
    <Tooltip content={<CustomTooltip />} />
    <Legend />
    <Line type="monotone" dataKey="EXPECTED" name="Esperado" stroke={COLOR_EXPECTED} strokeWidth={2} dot={false} />
    {chartData.length > 10 && (
      <Brush dataKey="label" height={20} stroke="#32C6F4" startIndex={0} endIndex={9} />
    )}
  </LineChart>
</ResponsiveContainer>
```

---

## Cores

| Onde | Padrão |
| --- | --- |
| Esperado vs Realizado | `COLOR_EXPECTED` / `COLOR_REALIZED` em `src/configurations/colors.ts` |
| Por item (categoria) | `<Cell key={index} fill={index === selected ? '#32C6F4' : '#AFB2B2'} />` |
| Token shadcn | `hsl(var(--chart-1))` ... `hsl(var(--chart-5))` (declarados em `globals.css` `:root`) |

**Não hardcode hex** quando o token equivalente existe.

---

## Patterns recorrentes

### Sparkline com clique seletivo (ver `GraphInsight.tsx`)

```tsx
<BarChart width={180} height={100} data={chartData}>
  <Bar dataKey="value" onClick={(_, i) => handleClick(i)} cursor="pointer">
    {chartData.map((_, i) => (
      <Cell key={i} fill={i === selected ? '#32C6F4' : '#AFB2B2'} />
    ))}
  </Bar>
  <ReferenceLine y={averageValue} stroke="#000" strokeDasharray="4 4" strokeWidth={1} />
</BarChart>
```

### Tooltip custom com formatação monetária

```tsx
import { type TooltipProps } from 'recharts'

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium text-slate-600">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey as string} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-semibold">{maskMonetaryValue(Number(entry.value ?? 0))}</span>
        </div>
      ))}
    </div>
  )
}
```

### Eixo X com label customizada (multi-linha)

Ver `CustomTick` em `BarChart.tsx`. Pattern:

```tsx
const CustomTick = ({ x, y, payload }: any) => {
  const lines = payload.value.split(' ')
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text key={i} x={0} y={i * 12} textAnchor="middle" fill="#666" fontSize={12}>
          {line}
        </text>
      ))}
    </g>
  )
}

<XAxis dataKey="name" tick={<CustomTick />} interval={0} />
```

---

## Heurísticas

- **Chart não aparece** → falta `<ResponsiveContainer>` com `width`/`height` explícitos. Recharts não renderiza com pai `height: auto`.
- **`Brush` parado** → `dataKey` do `Brush` precisa bater com o `dataKey` do `XAxis`. `startIndex`/`endIndex` se passados precisam ser válidos.
- **Tooltip em posição estranha** → `cursor={false}` desliga linha guia; `offset={x}` ajusta posição.
- **`<Bar>` ignora `<Cell>`** → `Cell` precisa ser **filho direto** do `Bar` (não embrulhado).
- **Pie sem label** → `<Pie label />` ou `<LabelList />`.
- **`onClick` em barra dispara para o gráfico inteiro** → use `onClick` no `<Bar>` (passa data + index do item clicado).

---

## Anti-padrões

1. **Reintroduzir `highcharts`/`chart.js`** — saíram da poda.
2. **Hardcode cores** quando há token shadcn (`hsl(var(--chart-N))`).
3. **`<Bar>` sem `<Cell>` por item** quando precisa cor por item.
4. **`ResponsiveContainer` aninhado em outro `ResponsiveContainer`** — não funciona.
5. **`Tooltip` sem `content` custom** quando o default mostra `[object Object]`.
6. **Reimplementar wrapper shadcn** — use `ChartContainer`/`ChartTooltip` quando der.

---

## Saída esperada

1. Resumo de 2-3 frases.
2. Chart novo segue padrão de vizinho em `src/components/layout/charts/` ou `src/components/reports/`.
3. `pnpm build` verde.

---

## Changelog

- **2026-05-20:** Criação. Recharts canônico pós-poda dos charts antigos.
