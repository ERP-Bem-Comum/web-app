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
import {
  GENDER_IDENTITIES,
  RACES,
  EDUCATION_LEVELS,
  EMPLOYMENT_RELATIONSHIPS,
  OCCUPATION_AREAS,
} from '#modules/partners/public-api/index.ts'
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
export function toTeamRows(
  members: readonly TeamMember[],
  /**
   * `id do colaborador → área de atuação` (PARC/DDI/DCE/EPV), vindo da LISTAGEM de Colaboradores. O
   * `/reports/team` não carrega a área: a projeção do core-api grava `program: null` de propósito
   * ("`program` não existe no modelo Collaborator"). Como todo dado do Equipe ABC sai de Colaboradores,
   * o front cruza pelo `id`. Sem o mapa (ainda carregando / falhou) → sentinela, nunca linha perdida.
   */
  areaById: ReadonlyMap<string, string> = new Map(),
): readonly TeamMemberRow[] {
  return members.map((m) => ({
    nome: m.name,
    // Os 3 campos abaixo vinham cravados em sentinela porque o schema de borda não declarava as chaves —
    // o core-api mandava e o Zod descartava calado. Agora são o CÓDIGO canônico; a View traduz.
    idade: m.age,
    programa: areaById.get(m.id) ?? NA_SENTINEL,
    funcao: m.role,
    vinculo: m.employmentRelationship,
    genero: m.genderIdentity ?? NA_SENTINEL,
    racaCor: m.race ?? NA_SENTINEL,
    escolaridade: m.education ?? NA_SENTINEL,
    anoContrato: parseContractYear(m.startOfContract),
    // `active` e `registrationStatus` SEMPRE vieram no DTO (`reports.io.ts`) — só não chegavam à linha, então
    // os filtros Status e Situação Cadastral ficavam inertes em "Todos" sem ter por quê.
    status: m.active ? 'ATIVO' : 'INATIVO',
    situacaoCadastral: m.registrationStatus,
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

// ── Opções dos filtros (derivadas dos VALORES DISTINTOS dos próprios dados — não há endpoint de opções) ──

/**
 * Opções dos filtros do Equipe ABC. Os valores são sempre **CÓDIGOS**; a View traduz (i18n).
 *
 * Duas naturezas, e a distinção é o ponto desta função:
 *
 * - **Lista fechada do domínio** (`programa`/área, `vinculo`, `escolaridade`, `genero`, `racaCor`): vêm dos
 *   enums canônicos de Colaboradores, via `partners/public-api`. Aparecem SEMPRE, mesmo que ninguém no
 *   recorte atual tenha aquele valor — é como o módulo de Colaboradores se comporta, e é o que evita a
 *   pessoa concluir que "PJ não existe" só porque hoje não há nenhum PJ contratado.
 * - **Derivada do dado** (`funcao`, `anoContrato`): texto livre / número, sem enum no domínio — aqui os
 *   distintos das linhas são a única fonte possível.
 *
 * Reusar os enums (em vez de copiá-los) é deliberado: foi a cópia local desatualizada que fez os gráficos
 * deste mesmo relatório apagarem em silêncio pessoas trans e indígenas.
 */
export type TeamFilterOptions = Readonly<{
  escolaridade: readonly string[]
  vinculo: readonly string[]
  anoContrato: readonly string[]
  programa: readonly string[]
  funcao: readonly string[]
  genero: readonly string[]
  racaCor: readonly string[]
  status: readonly string[]
  situacaoCadastral: readonly string[]
}>

/**
 * Status do vínculo. Lista fechada de DOIS valores — código nosso (o DTO traz `active: boolean`), traduzido
 * na View com as MESMAS chaves de Colaboradores (`partners.collaborators.status.*`).
 */
export const TEAM_STATUSES = ['ATIVO', 'INATIVO'] as const

/**
 * Situação cadastral. Os códigos são os do core-api (`RegistrationStatus`), em PascalCase — por isso não
 * passam pelo helper genérico de rótulo: a chave do catálogo é kebab
 * (`partners.collaborators.registration.complete` / `.pre-registration`).
 */
export const TEAM_REGISTRATION_STATUSES = ['Complete', 'PreRegistration'] as const

/**
 * Faixas etárias — os MESMOS 5 cortes do gráfico "Idade" (`AGE_RANGE_CATEGORIES` do core-api) mais o `NA`
 * de quem não tem nascimento cadastrado. O backend só publica a faixa AGREGADA (contagem por categoria),
 * nunca a faixa de cada pessoa, então o corte por linha tem que ser feito aqui — mas os RÓTULOS continuam
 * vindo da API (a page passa `demographics.ageRange`), para não nascer um segundo dicionário.
 *
 * Se o core-api mudar os cortes, gráfico e filtro divergem — é o que o teste `faixaEtariaIdOf` protege.
 */
export const AGE_RANGE_NA = 'NA'

/**
 * Distribuição de `rows` sobre um TEMPLATE de categorias (id + rótulo já resolvidos pela View).
 *
 * Existe porque os 3 gráficos demográficos (Gênero / Idade / Raça-cor) liam a AGREGAÇÃO do backend, que não
 * conhece os filtros da tela: filtrar "Situação Cadastral = Cadastrado" recortava a tabela e deixava o
 * gráfico intacto — a pessoa em pré-cadastro continuava contada (P.O., 09/08). Pior, a % usava o total
 * FILTRADO como denominador com contagens NÃO filtradas. Agora a contagem sai das mesmas linhas da tabela.
 *
 * O template continua vindo do backend (ordem e vocabulário canônicos). Categoria do dado que não esteja
 * nele é ACRESCENTADA no fim, com o próprio código de rótulo: a soma é sempre igual ao total de linhas —
 * nada de gente evaporando na passagem, que é como este relatório já apagou identidades antes.
 */
export function countByTemplate(
  rows: readonly TeamMemberRow[],
  templateIds: readonly string[],
  keyOf: (row: TeamMemberRow) => string,
): readonly Readonly<{ id: string; count: number }>[] {
  const counts = new Map<string, number>(templateIds.map((id) => [id, 0]))
  const extras: string[] = []
  for (const row of rows) {
    const key = keyOf(row)
    if (!counts.has(key)) extras.push(key)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...templateIds, ...new Set(extras)].map((id) => ({ id, count: counts.get(id) ?? 0 }))
}

/** Esconde categoria zerada — o gráfico desenha quem tem gente (paridade com o legado). */
export function withoutEmptyCategories(cats: readonly CategoryCount[]): readonly CategoryCount[] {
  return cats.filter((c) => c.count > 0)
}

/** Chave de gênero/raça de uma linha: a sentinela honesta de "não informado" vira o `NA` do backend. */
export const categoryKeyOf = (value: string): string => (value === NA_SENTINEL ? 'NA' : value)

/** Faixa etária de uma idade, no vocabulário do gráfico. `null` (sem nascimento) → `NA`. Sem `throw` (§II). */
export function faixaEtariaIdOf(idade: number | null): string {
  if (idade === null) return AGE_RANGE_NA
  if (idade <= 29) return 'ATE_29'
  if (idade <= 39) return 'DE_30_A_39'
  if (idade <= 49) return 'DE_40_A_49'
  if (idade <= 59) return 'DE_50_A_59'
  return 'MAIS_60'
}

/** Pula vazio e as sentinelas honestas dos campos não fornecidos (`—` demografia · `N/A` idade). */
const isMeaningful = (v: string): boolean => v !== '' && v !== NA_SENTINEL && v !== 'N/A'

/** Distintos + alfabético pt-BR, pulando vazio/sentinela. */
const distinctSorted = (values: readonly string[]): readonly string[] =>
  [...new Set(values.filter(isMeaningful))].sort((a, b) => a.localeCompare(b, 'pt-BR'))

/**
 * Deriva as opções dos filtros a partir das linhas carregadas: distintas, ordenadas (ano DESC; os demais
 * alfabético pt-BR), únicas, sem vazio/sentinela. `anoContrato` = anos válidos (>0; o `0` é o não-parseável).
 * PURA (§XI) — testável em node:test; sem `throw`.
 */
export function teamFilterOptions(rows: readonly TeamMemberRow[] = EQUIPE_PLACEHOLDER): TeamFilterOptions {
  const anoContrato = [...new Set(rows.map((r) => r.anoContrato))]
    .filter((y) => Number.isFinite(y) && y > 0)
    .sort((a, b) => b - a)
    .map((y) => String(y))
  return {
    // Fechadas: o domínio manda, não o recorte carregado.
    escolaridade: EDUCATION_LEVELS,
    vinculo: EMPLOYMENT_RELATIONSHIPS,
    programa: OCCUPATION_AREAS,
    genero: GENDER_IDENTITIES,
    racaCor: RACES,
    status: TEAM_STATUSES,
    situacaoCadastral: TEAM_REGISTRATION_STATUSES,
    // Derivadas: sem enum no domínio.
    anoContrato,
    funcao: distinctSorted(rows.map((r) => r.funcao)),
  }
}

// ── Aplicação dos filtros (CLIENT-SIDE — todos os colaboradores já estão no front; sem backend) ──

/**
 * Filtros APLICÁVEIS do Equipe ABC (client-side). Cada campo `''` = "Todos" (sem recorte). `anoContrato` é o
 * ANO como string (o value do select); `search` casa por `nome` (case/acento-insensível). Raça/Idade/Gênero
 * NÃO entram (LGPD-safe → sem dado real; filtrar por eles zeraria tudo).
 */
export type TeamFilters = Readonly<{
  escolaridade: string
  vinculo: string
  anoContrato: string
  programa: string
  funcao: string
  genero: string
  racaCor: string
  status: string
  situacaoCadastral: string
  /** Id da faixa etária do gráfico ('ATE_29', 'MAIS_60', 'NA'); '' = todas. */
  faixaEtaria: string
  search: string
}>

export const EMPTY_TEAM_FILTERS: TeamFilters = {
  escolaridade: '',
  vinculo: '',
  anoContrato: '',
  programa: '',
  funcao: '',
  genero: '',
  racaCor: '',
  status: '',
  situacaoCadastral: '',
  faixaEtaria: '',
  search: '',
}

/** Normaliza p/ busca insensível a caixa e acento (NFD + remove diacríticos + lower + trim). Sem `throw`. */
function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

/**
 * Aplica os filtros às linhas (CLIENT-SIDE) — AND entre os campos setados; campo `''` não recorta. `anoContrato`
 * compara como número; `search` casa por substring do `nome` normalizado. PURA (§XI), testável; sem `throw`.
 */
export function applyTeamFilters(rows: readonly TeamMemberRow[], f: TeamFilters): readonly TeamMemberRow[] {
  const q = normalizeText(f.search)
  return rows.filter(
    (r) =>
      (f.escolaridade === '' || r.escolaridade === f.escolaridade) &&
      (f.vinculo === '' || r.vinculo === f.vinculo) &&
      (f.anoContrato === '' || r.anoContrato === Number(f.anoContrato)) &&
      (f.programa === '' || r.programa === f.programa) &&
      (f.funcao === '' || r.funcao === f.funcao) &&
      (f.genero === '' || r.genero === f.genero) &&
      (f.racaCor === '' || r.racaCor === f.racaCor) &&
      (f.status === '' || r.status === f.status) &&
      (f.situacaoCadastral === '' || r.situacaoCadastral === f.situacaoCadastral) &&
      (f.faixaEtaria === '' || faixaEtariaIdOf(r.idade) === f.faixaEtaria) &&
      (q === '' || normalizeText(r.nome).includes(q)),
  )
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
