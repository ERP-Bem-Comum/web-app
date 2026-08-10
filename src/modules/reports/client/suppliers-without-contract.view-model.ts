/**
 * ViewModel PURA do relatório "Fornecedores sem Contrato" (ADR-0009, §XI): agregação fornecedor → plano,
 * matemática do limite (% utilizado, restante, estouro) e formatação (BRL, percentual). ZERO React/TanStack
 * (o lint barra `react`/`@tanstack/react-*` em `*.view-model.ts`). Testável em node:test.
 *
 * Dinheiro em CENTAVOS inteiros (§IV). A agregação preserva a ORDEM DE INSERÇÃO dos fornecedores (para casar
 * o print legado — não ordena por valor). O `overLimit` usa comparação ESTRITA (> limite): 100% exato NÃO
 * estoura.
 */
import {
  SUPPLIERS_WITHOUT_CONTRACT_RAW,
  type RawSupplierRow,
} from './data/suppliers-without-contract.placeholder.ts'
import type { SupplierWithoutContract } from './data/model/supplier-without-contract.model.ts'
import { csvContent, csvHeaderLine, csvLine, csvNumber } from './csv.view-model.ts'

// Re-export do shape cru p/ a page tipar sem importar `client-data` direto (boundary ui ↛ data — §XI).
export type { RawSupplierRow } from './data/suppliers-without-contract.placeholder.ts'

/** Total de um plano orçamentário dentro de um fornecedor (linha-filha da árvore). */
export type BudgetPlanRow = Readonly<{
  budgetPlan: string
  totalCents: number
}>

/** Fornecedor agregado (linha-pai da árvore) com a matemática do limite já derivada. */
export type SupplierRow = Readonly<{
  supplier: string
  /** Soma de todos os planos do fornecedor (centavos). */
  valorTotalCents: number
  /** % utilizado do limite (valorTotal / limite * 100). Pode passar de 100. */
  utilizadoPct: number
  /** limite - valorTotal (centavos). Pode ser negativo (estourou). */
  totalRestanteCents: number
  /** valorTotal > limite (estrito) → estourou (linha vermelha/danger). */
  overLimit: boolean
  /** valorTotal == limite (restante EXATAMENTE 0) → "no limite" (linha cinza/neutra). Espelha o legado. */
  atLimit: boolean
  /** Planos orçamentários do fornecedor (ordem de inserção). */
  plans: readonly BudgetPlanRow[]
}>

/** Limite padrão: R$ 10.000,00 = 1.000.000 centavos. */
export const LIMITE_DEFAULT_CENTS = 1_000_000

/**
 * Agrega as linhas cruas por fornecedor (ordem de inserção) e, dentro de cada fornecedor, por plano
 * orçamentário. Aplica a matemática do limite. Retorna as linhas-pai prontas para a árvore.
 */
export function aggregateSuppliers(
  raw: readonly RawSupplierRow[],
  limiteCents: number,
): readonly SupplierRow[] {
  // Mapa preserva ordem de inserção das chaves (fornecedor e plano) — casa o print legado.
  const bySupplier = new Map<string, Map<string, number>>()
  for (const r of raw) {
    const plans = bySupplier.get(r.supplier) ?? new Map<string, number>()
    plans.set(r.budgetPlan, (plans.get(r.budgetPlan) ?? 0) + r.totalCents)
    bySupplier.set(r.supplier, plans)
  }

  const rows: SupplierRow[] = []
  for (const [supplier, plans] of bySupplier) {
    const planRows: BudgetPlanRow[] = []
    let valorTotalCents = 0
    for (const [budgetPlan, totalCents] of plans) {
      planRows.push({ budgetPlan, totalCents })
      valorTotalCents += totalCents
    }
    rows.push({
      supplier,
      valorTotalCents,
      utilizadoPct: limiteCents === 0 ? 0 : (valorTotalCents / limiteCents) * 100,
      totalRestanteCents: limiteCents - valorTotalCents,
      overLimit: valorTotalCents > limiteCents,
      atLimit: limiteCents > 0 && valorTotalCents === limiteCents,
      plans: planRows,
    })
  }
  return rows
}

/**
 * Fonte da tela (front-first): agrega os dados PLACEHOLDER pelo limite dado. É o ponto único pelo qual a
 * View obtém as linhas — mantém a View sem tocar a `data/` (boundary client-ui ↛ client-data). Quando o
 * endpoint do core-api (#114) nascer, esta função passa a receber o DTO real (mesmo shape `RawSupplierRow`).
 */
export function loadSupplierRows(limiteCents: number): readonly SupplierRow[] {
  return aggregateSuppliers(SUPPLIERS_WITHOUT_CONTRACT_RAW, limiteCents)
}

/**
 * ADAPTER (puro) DTO real (`SupplierWithoutContract[]`) → linhas cruas (`RawSupplierRow[]`). O endpoint entrega
 * o total AGREGADO por fornecedor, SEM a quebra por plano orçamentário (D2 do plano) → cada fornecedor vira UMA
 * linha com `budgetPlan: '—'` (a árvore mostra o fornecedor com um único filho "—"); a matemática do limite
 * (por fornecedor) fica intacta. `name` nullable/vazio → cai no `supplierRef` como rótulo. O binding aplica o
 * limite via `aggregateSuppliers(toRawSupplierRows(suppliers), limiteCents)`. Sem `throw` (§II).
 *
 * `partnersMap` (id → nome) resolve o favorecido NÃO-fornecedor (financiador/ato/colaborador) client-side —
 * o read-model do backend só nomeia fornecedor, então o front resolve os demais pelo MESMO mapa do Contas a
 * Pagar. Prioridade: nome do backend → mapa → o `supplierRef` cru como último recurso (nunca vazio).
 */
export function toRawSupplierRows(
  suppliers: readonly SupplierWithoutContract[],
  partnersMap: ReadonlyMap<string, string> = new Map(),
): readonly RawSupplierRow[] {
  return suppliers.map((s) => {
    const backendName = s.name !== null && s.name.trim() !== '' ? s.name : null
    return {
      supplier: backendName ?? partnersMap.get(s.supplierRef) ?? s.supplierRef,
      budgetPlan: '—',
      totalCents: s.totalCents,
    }
  })
}

/**
 * Top-N fornecedores por `valorTotalCents` em ordem DECRESCENTE (gráfico de barras horizontais
 * "Utilização do limite por fornecedor"). NÃO muta `rows` (copia antes de ordenar §VII). Empates
 * preservam a ordem de inserção (sort estável do V8). `n` default 8.
 */
export function topSuppliersByValor(rows: readonly SupplierRow[], n = 8): readonly SupplierRow[] {
  return [...rows].sort((a, b) => b.valorTotalCents - a.valorTotalCents).slice(0, Math.max(0, n))
}

/** Contagem de compliance para o resumo do card do gráfico. */
export type ComplianceCounts = Readonly<{
  /** Fornecedores que ESTOURARAM o limite (> limite estrito). */
  overLimit: number
  /** Fornecedores EXATAMENTE no limite (restante = 0). */
  atLimit: number
  /** Fornecedores DENTRO do limite (nem estouro nem exato). */
  within: number
  /** Total de fornecedores. */
  total: number
}>

/**
 * Conta os fornecedores por status de compliance (estouro / no-limite / dentro), reusando os flags
 * `overLimit`/`atLimit` já derivados como ÚNICA fonte de verdade. `within` = total - over - at.
 */
export function complianceCounts(rows: readonly SupplierRow[]): ComplianceCounts {
  let overLimit = 0
  let atLimit = 0
  for (const r of rows) {
    if (r.overLimit) overLimit += 1
    else if (r.atLimit) atLimit += 1
  }
  return { overLimit, atLimit, within: rows.length - overLimit - atLimit, total: rows.length }
}

// ── Formatação ──

const brlFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Centavos → "R$ 1.234,56" (ou "-R$ 2.981,85" para negativos). */
export function formatBRL(cents: number): string {
  return brlFmt.format(cents / 100)
}

/**
 * Percentual no formato do print legado: 2 dígitos INTEIROS zero-padded + vírgula + 2 decimais + "%".
 * Ex.: 129.82 → "129,82%"; 3.52 → "03,52%"; 0.11 → "00,11%". A parte inteira só zero-pada até 2 dígitos;
 * valores ≥ 100 mantêm todos os dígitos ("129,82%").
 */
export function formatPercent(pct: number): string {
  const fixed = pct.toFixed(2) // "129.82", "3.52", "0.11"
  const [intPart = '0', decPart = '00'] = fixed.split('.')
  const paddedInt = intPart.padStart(2, '0')
  return `${paddedInt},${decPart}%`
}

// ── Limite (input currency ↔ cents) — helpers puros p/ a page ligar o único campo ativo ──

/** Centavos → texto BRL sem o "R$" para exibir no input: 1_000_000 → "10.000,00". */
export function formatLimiteInput(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Texto do input (aceita "10.000,00", "10000,00", "10000.00", "R$ 10.000,00") → centavos inteiros. Entrada
 * inválida/vazia cai no limite padrão (nunca quebra a matemática da tela). Regra: remove tudo exceto dígitos,
 * vírgula e ponto; se houver vírgula, ela é o separador decimal (pt-BR) e pontos são milhar; senão o ponto
 * é decimal.
 */
export function parseLimiteToCents(text: string): number {
  const cleaned = text.replace(/[^\d.,]/g, '')
  if (cleaned === '') return LIMITE_DEFAULT_CENTS
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.') // pt-BR: ponto = milhar, vírgula = decimal
    : cleaned // sem vírgula: o ponto (se houver) é decimal
  const reais = Number(normalized)
  if (!Number.isFinite(reais)) return LIMITE_DEFAULT_CENTS
  return Math.round(reais * 100)
}

// ── Export CSV (client-side; delimitado por ';', fiel ao CSV legado) ──

/**
 * Header pt-BR. `BudgetPlan` era identificador EN vazando num arquivo que o usuário abre — o resto do módulo
 * chama de "Plano Orçamentário" (idioma: código EN, texto ao humano PT).
 */
const CSV_HEADER = csvHeaderLine(['Fornecedor', 'Plano Orçamentário', 'Total (R$)'])

/** Total (centavos) → número BRL legível para o CSV: "7137,13". */

/**
 * Monta o CSV: uma linha por par fornecedor → plano orçamentário com o total agregado. Escape e formato de
 * número vêm do `csv.view-model.ts` (regra única do módulo).
 */
export function buildCsv(rows: readonly SupplierRow[]): string {
  const lines: string[] = []
  for (const r of rows) {
    for (const p of r.plans) {
      lines.push(csvLine([r.supplier, p.budgetPlan, csvNumber(p.totalCents)]))
    }
  }
  return csvContent(CSV_HEADER, lines)
}
