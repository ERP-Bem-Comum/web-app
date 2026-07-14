/**
 * ViewModel PURO da contrapartida esperada (US2 do #269) — formatação de apresentação (BRL/data/score) e
 * ordenação. Sem React nem I/O (§XI, ADR-0009): a binding chama estas funções e a view burra só apresenta.
 * `band` deriva do score (o contrato de contrapartida não traz banda, diferente das sugestões de título).
 */
import { centsToBRL } from '#modules/financial/client/data/money.ts'
import type { CounterpartSuggestion } from '#modules/financial/client/data/model/reconciliation.model.ts'

// Confiança apresentada: alta (≥ 80) vs média. Só p/ o estilo/rótulo — a decisão de casar é do usuário.
export type CounterpartBand = 'alta' | 'media'
const HIGH_CONFIDENCE_SCORE = 80
export const counterpartBand = (score: number): CounterpartBand =>
  score >= HIGH_CONFIDENCE_SCORE ? 'alta' : 'media'

// Linha pronta p/ a view: valor em BRL, data esperada em DD/MM/AAAA, score em "%", banda derivada.
export type CounterpartRow = Readonly<{
  counterpartId: string
  originAccountRef: string
  valueBRL: string
  expectedDateBR: string
  scorePct: string
  band: CounterpartBand
}>

// ISO (datetime ou date-only) → DD/MM/AAAA sem `new Date` (evita fuso). Fallback: repassa o cru.
const isoToBR = (iso: string): string => {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y !== undefined && m !== undefined && d !== undefined ? `${d}/${m}/${y}` : iso
}

export const toCounterpartRow = (s: CounterpartSuggestion): CounterpartRow => ({
  counterpartId: s.counterpartId,
  originAccountRef: s.originAccountRef,
  valueBRL: centsToBRL(s.valueCents),
  expectedDateBR: isoToBR(s.expectedDate),
  scorePct: `${String(s.score)}%`,
  band: counterpartBand(s.score),
})

// Ordenação determinística espelhando o backend: maior score primeiro; empate → contrapartida mais antiga
// (expectedDate asc). Não muta a entrada.
export const sortCounterparts = (items: readonly CounterpartSuggestion[]): readonly CounterpartSuggestion[] =>
  items
    .slice()
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.expectedDate.localeCompare(b.expectedDate)))

export const toCounterpartRows = (items: readonly CounterpartSuggestion[]): readonly CounterpartRow[] =>
  sortCounterparts(items).map(toCounterpartRow)
