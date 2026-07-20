/**
 * ViewModel PURA do relatório "Equipe ABC" (ADR-0009, §XI): agrega as linhas ENXUTAS de colaboradores nos
 * datasets dos gráficos NÃO-demográficos (ano de contrato / função), monta o CSV enxuto e formata percentuais.
 *
 * ── Gênero / raça-cor / faixa etária saíram daqui (core-api#477) ──
 * As 3 distribuições vêm AGREGADAS do backend (`/reports/team/demographics`), com `id` canônico + `label`
 * PT-BR prontos. As funções locais (`byGenero`/`byRacaCor`/`byFaixaEtaria`) e as listas canônicas
 * (`GENERO_ORDER`/`RACA_ORDER`/`FAIXA_ETARIA_LABELS`) foram REMOVIDAS — e não por elegância: o
 * `countByOrder` ignorava toda chave fora da lista, e as listas estavam erradas (gênero tinha 3 das 8
 * identidades; raça não tinha `INDIGENA`). Na prática o gráfico apagava justamente quem é minoria, sem
 * avisar — a soma das fatias não batia com o total e ninguém percebia. Agora o backend garante a
 * invariante (soma == totalActive, com teste) e valor desconhecido cai no balde `OUTROS`.
 *
 * ZERO React/TanStack (o lint barra `react`/`@tanstack/react-*` em `*.view-model.ts`). Testável em
 * node:test. Sem `throw` nas derivações (§II). Nada de dinheiro aqui.
 */
import { EQUIPE_PLACEHOLDER, type TeamMemberRow } from './data/equipe.placeholder.ts'
import type { TeamMember } from './data/model/team-report.model.ts'

export type { TeamMemberRow } from './data/equipe.placeholder.ts'

/** Uma categoria agregada: rótulo + contagem (dataset genérico dos gráficos). */
export type CategoryCount = Readonly<{ id: string; label: string; count: number }>

/** Ponto anual (gráfico de linha "por Ano"): ano + contagem. */
export type YearCount = Readonly<{ year: number; count: number }>

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

/** Sentinela honesta para os campos que o endpoint LGPD-safe NÃO fornece (gênero/raça-cor). */
const NA_SENTINEL = '—'

/**
 * ADAPTER (puro) DTO real (`TeamMember`) → linha da tabela existente (`TeamMemberRow`). O endpoint
 * `/reports/team` é LGPD-safe: NÃO traz idade, gênero nem raça-cor → sentinelas honestas (`idade=null` → "N/A"
 * na tabela; `genero`/`racaCor` = "—"). `programa` (área), `funcao` (role), `vinculo`
 * (employmentRelationship) e `escolaridade` (education) vêm como STRING real, SEM forçar enum. `anoContrato` =
 * ano de `startOfContract` (dirige o gráfico por Ano; anos fora de 2019..2025 são ignorados NO gráfico, mas o
 * valor real aparece no detalhe). Os 3 gráficos demográficos NÃO derivam daqui — a page passa dataset vazio
 * (empty-state honesto). Sem `throw` (§II).
 */
export function toTeamRows(members: readonly TeamMember[]): readonly TeamMemberRow[] {
  return members.map((m) => ({
    nome: m.name,
    idade: null,
    programa: m.program ?? NA_SENTINEL,
    funcao: m.role,
    vinculo: m.employmentRelationship,
    genero: NA_SENTINEL,
    racaCor: NA_SENTINEL,
    escolaridade: m.education ?? NA_SENTINEL,
    anoContrato: parseContractYear(m.startOfContract),
  }))
}

/** Ano de `startOfContract` (ISO "YYYY-…"); não-parseável → 0 (fora do range dos gráficos). Sem `throw` (§II). */
function parseContractYear(startOfContract: string): number {
  const year = Number.parseInt(startOfContract.slice(0, 4), 10)
  return Number.isFinite(year) ? year : 0
}

/** Total de colaboradores (denominador das % dos gráficos). */
export function total(rows: readonly TeamMemberRow[] = EQUIPE_PLACEHOLDER): number {
  return rows.length
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
