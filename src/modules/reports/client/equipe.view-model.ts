/**
 * ViewModel PURA do relatório "Equipe ABC" (ADR-0009, §XI): agrega as linhas ENXUTAS de colaboradores nos 5
 * datasets dos gráficos (por gênero / raça-cor / faixa etária / ano de contrato / função), monta o CSV enxuto
 * e formata percentuais. ZERO React/TanStack (o lint barra `react`/`@tanstack/react-*` em `*.view-model.ts`).
 * Testável em node:test. Sem `throw` nas derivações (§II) — idade null cai no bucket "N/A".
 *
 * As agregações partem SEMPRE das mesmas linhas placeholder → os 5 gráficos ficam internamente consistentes
 * (soma das fatias = total de colaboradores). Nada de dinheiro aqui.
 */
import {
  EQUIPE_PLACEHOLDER,
  type TeamMemberRow,
  type Genero,
  type RacaCor,
} from './data/equipe.placeholder.ts'

export type { TeamMemberRow } from './data/equipe.placeholder.ts'

/** Uma categoria agregada: rótulo + contagem (dataset genérico dos gráficos). */
export type CategoryCount = Readonly<{ id: string; label: string; count: number }>

/** Ponto anual (gráfico de linha "por Ano"): ano + contagem. */
export type YearCount = Readonly<{ year: number; count: number }>

/** Ordem canônica das 3 fatias de gênero (donut). */
export const GENERO_ORDER: readonly Genero[] = ['Mulher Cis', 'Homem Cis', 'Prefiro não responder']

/** Ordem canônica das 6 categorias de raça/cor (barras verticais). */
export const RACA_ORDER: readonly RacaCor[] = [
  'N/A',
  'Branco',
  'Preto',
  'Pardo',
  'Amarelo',
  'Prefiro não revelar',
]

/** Faixas etárias (barras horizontais) — rótulos + predicado; "N/A" cobre idade null. */
export const FAIXA_ETARIA_LABELS: readonly string[] = [
  'Até 29',
  '30 a 39',
  '40 a 49',
  '50 a 59',
  '60+',
  'N/A',
]

/** Anos do gráfico de linha (2019..2025). */
export const ANOS: readonly number[] = [2019, 2020, 2021, 2022, 2023, 2024, 2025]

/**
 * Fonte da tela (front-first): as linhas placeholder. Ponto único pelo qual a View obtém os dados — mantém a
 * View sem tocar a `data/` (boundary client-ui ↛ client-data). Quando o endpoint (#114/#112) nascer, esta
 * função passa a receber o DTO real (mesmo shape `TeamMemberRow`).
 */
export function loadTeam(): readonly TeamMemberRow[] {
  return EQUIPE_PLACEHOLDER
}

/** Total de colaboradores (denominador das % dos gráficos). */
export function total(rows: readonly TeamMemberRow[] = EQUIPE_PLACEHOLDER): number {
  return rows.length
}

/** Conta ocorrências mantendo a ORDEM canônica pedida (categorias com 0 continuam aparecendo). */
function countByOrder<T extends string>(
  rows: readonly TeamMemberRow[],
  order: readonly T[],
  pick: (r: TeamMemberRow) => T,
): readonly CategoryCount[] {
  const counts = new Map<T, number>(order.map((k) => [k, 0]))
  for (const r of rows) {
    const key = pick(r)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return order.map((k) => ({ id: k, label: k, count: counts.get(k) ?? 0 }))
}

/** Distribuição por Gênero (donut) — 3 fatias na ordem canônica. */
export function byGenero(rows: readonly TeamMemberRow[] = EQUIPE_PLACEHOLDER): readonly CategoryCount[] {
  return countByOrder(rows, GENERO_ORDER, (r) => r.genero)
}

/** Distribuição por Raça/Cor (barras verticais) — 6 categorias na ordem canônica. */
export function byRacaCor(rows: readonly TeamMemberRow[] = EQUIPE_PLACEHOLDER): readonly CategoryCount[] {
  return countByOrder(rows, RACA_ORDER, (r) => r.racaCor)
}

/** Índice da faixa etária (0..4) para uma idade não-nula; 5 (="N/A") para idade null. */
function faixaIndex(idade: number | null): number {
  if (idade === null) return 5
  if (idade <= 29) return 0
  if (idade <= 39) return 1
  if (idade <= 49) return 2
  if (idade <= 59) return 3
  return 4
}

/** Distribuição por Idade (barras horizontais) — 6 buckets ("Até 29"…"60+", "N/A"). */
export function byFaixaEtaria(rows: readonly TeamMemberRow[] = EQUIPE_PLACEHOLDER): readonly CategoryCount[] {
  const counts = new Array<number>(FAIXA_ETARIA_LABELS.length).fill(0)
  for (const r of rows) {
    const i = faixaIndex(r.idade)
    counts[i] = (counts[i] ?? 0) + 1
  }
  return FAIXA_ETARIA_LABELS.map((label, i) => ({ id: label, label, count: counts[i] ?? 0 }))
}

/** Quantitativo por Ano de Contrato (linha) — 2019..2025 (anos sem contrato ficam com 0). */
export function byAnoContrato(rows: readonly TeamMemberRow[] = EQUIPE_PLACEHOLDER): readonly YearCount[] {
  const counts = new Map<number, number>(ANOS.map((y) => [y, 0]))
  for (const r of rows) {
    if (counts.has(r.anoContrato)) counts.set(r.anoContrato, (counts.get(r.anoContrato) ?? 0) + 1)
  }
  return ANOS.map((year) => ({ year, count: counts.get(year) ?? 0 }))
}

/**
 * Distribuição por Função (barras horizontais) — uma barra por função DISTINTA, em ordem DECRESCENTE de
 * contagem (empate preserva a 1ª aparição). Descoberto do dado (funções não são enum fixo).
 */
export function byFuncao(rows: readonly TeamMemberRow[] = EQUIPE_PLACEHOLDER): readonly CategoryCount[] {
  const order: string[] = []
  const counts = new Map<string, number>()
  for (const r of rows) {
    if (!counts.has(r.funcao)) order.push(r.funcao)
    counts.set(r.funcao, (counts.get(r.funcao) ?? 0) + 1)
  }
  return order
    .map((funcao) => ({ id: funcao, label: funcao, count: counts.get(funcao) ?? 0 }))
    .sort((a, b) => b.count - a.count)
}

// ── Paginação (derivação PURA — o UI-state page/perPage mora na View, §XI) ──

/** Opções de "itens por página" (espelha o BrandPaginator). */
export const PER_PAGE_DEFAULT = 10

/** Total de páginas: `ceil(total / perPage)`, no mínimo 1 (lista vazia = 1 página vazia). */
export function totalPages(totalItems: number, perPage: number): number {
  if (perPage <= 0) return 1
  return Math.max(1, Math.ceil(totalItems / perPage))
}

/**
 * Fatia da página corrente (1-based). Clampa a página ao intervalo válido para nunca estourar os limites
 * do array (defensivo — a View já reseta a página ao trocar perPage). Sem `throw` (§II).
 */
export function pageSlice(
  rows: readonly TeamMemberRow[],
  page: number,
  perPage: number,
): readonly TeamMemberRow[] {
  if (perPage <= 0) return rows
  const pages = totalPages(rows.length, perPage)
  const clamped = Math.min(Math.max(1, page), pages)
  const start = (clamped - 1) * perPage
  return rows.slice(start, start + perPage)
}

// ── Formatação ──

/**
 * Percentual de uma fatia sobre o total, formato pt-BR: inteiro sem casas, fracionário com 1 casa; guard ÷0
 * → "0%". Ex.: 25 → "25%"; 8/36 → "22,2%".
 */
export function formatSharePercent(count: number, totalCount: number): string {
  if (totalCount === 0) return '0%'
  const pct = (count / totalCount) * 100
  const rounded = Math.round(pct * 10) / 10
  if (Number.isInteger(rounded)) return `${String(rounded)}%`
  return `${rounded.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

// ── Export CSV (client-side; colunas ENXUTAS de exibição — SEM PII sensível) ──

/** Cabeçalho pt-BR das 8 colunas enxutas (delimitado por ';'). */
export const CSV_HEADER =
  'Nome;Idade;Área de atuação;Função;Vínculo;Identidade de gênero;Raça/cor;Escolaridade'

/** Idade para o CSV: número ou "N/A" (idade null). */
function csvIdade(idade: number | null): string {
  return idade === null ? 'N/A' : String(idade)
}

/**
 * Monta o CSV: uma linha por colaborador, só as 8 colunas de exibição (LGPD — sem cpf/email/telefone/
 * endereço/remuneração/alergias/biografia). Delimitado por ';', campos entre aspas. `\r\n` como no legado.
 */
export function buildCsv(rows: readonly TeamMemberRow[] = EQUIPE_PLACEHOLDER): string {
  const lines: string[] = [CSV_HEADER]
  for (const r of rows) {
    lines.push(
      [
        `"${r.nome}"`,
        `"${csvIdade(r.idade)}"`,
        `"${r.programa}"`,
        `"${r.funcao}"`,
        `"${r.vinculo}"`,
        `"${r.genero}"`,
        `"${r.racaCor}"`,
        `"${r.escolaridade}"`,
      ].join(';'),
    )
  }
  return lines.join('\r\n')
}
