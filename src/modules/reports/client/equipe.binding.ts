/**
 * Binding do relatório "Equipe ABC" — ADAPTER React (§XI). Lê a equipe REAL do core-api (via
 * `reportsRepository.getTeam`) e entrega as linhas já adaptadas pelo view-model puro (`toTeamRows`). A View
 * consome o `state` (união discriminada §IV: loading | error | ready).
 *
 * Idade, identidade de gênero e raça/cor SÃO fornecidas por pessoa (`collaborator-projection.ts`) — vinham
 * como sentinela porque o schema de borda do BFF não declarava as chaves e o Zod as descartava em silêncio.
 * A área de atuação continua fora do `/reports/team` e é cruzada aqui, por id, com a listagem de
 * Colaboradores (ver `fetchTeamAreas`).
 *
 * Os 3 gráficos demográficos vêm de uma query SEPARADA (`/reports/team/demographics`, core-api#477): já
 * AGREGADOS pelo backend, com `id` canônico + `label` PT-BR prontos. Antes eram derivados aqui de listas
 * canônicas locais que descartavam em silêncio `INDIGENA` e 5 das 8 identidades de gênero.
 *
 * ── Por que a demografia é um estado À PARTE, e não parte do `state` ──
 * São endpoints distintos, e o sensível pode falhar sozinho (RBAC próprio). Se a demografia der erro ou
 * 403, a TABELA continua carregando normalmente — os gráficos caem no empty-state. Amarrar os dois faria
 * um 403 de dado sensível derrubar o relatório inteiro.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { listCollaboratorsFn } from '#modules/partners/public-api/index.ts'
import { teamReportQueryOptions, teamDemographicsQueryOptions } from './equipe.query.ts'

import { toTeamRows, type TeamMemberRow } from './equipe.view-model.ts'
import { reportsErrorTag } from './data/helpers/reports-error-tag.ts'
import type { ReportsError } from './data/repository/reports-error.ts'
import type { CategoryCount } from './data/model/team-report.model.ts'

export type EquipeBindingState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; error: ReportsError; errorTag: string }>
  | Readonly<{ status: 'ready'; rows: readonly TeamMemberRow[] }>

/**
 * Datasets dos 3 gráficos. Vazio = carregando, indisponível ou sem permissão — os componentes já tratam
 * (barra zerada / empty-state do donut). Não distinguimos os casos de propósito: o gráfico não é o lugar
 * de explicar erro de permissão, e a tabela ao lado segue funcionando.
 */
export type EquipeDemographics = Readonly<{
  gender: readonly CategoryCount[]
  ageRange: readonly CategoryCount[]
  race: readonly CategoryCount[]
}>

const NO_DEMOGRAPHICS: EquipeDemographics = { gender: [], ageRange: [], race: [] }

/** Identidade estável p/ o `useMemo` não reagir a um Map novo a cada render enquanto a query não resolve. */
const EMPTY_AREAS: ReadonlyMap<string, string> = new Map()

/**
 * `id do colaborador → área de atuação` (PARC/DDI/DCE/EPV).
 *
 * ── Por que buscar isto separado ──
 * O `/reports/team` NÃO carrega a área: a projeção do core-api grava `program: null` de propósito
 * (`collaborator-projection.ts` — "`program` não existe no modelo Collaborator"). Como todo dado do
 * Equipe ABC sai de Colaboradores, o front cruza pelo `id` em vez de esperar um campo novo no backend.
 *
 * ── Por que mora AQUI e não num `*.query.ts` ──
 * Chamada cross-módulo passa pela `public-api` (boundary §I), e o lint só libera esse import a partir de
 * binding/view-model/ui — `client-data-options` (`*.query.ts`) só enxerga `shared` e a própria feature.
 *
 * ── O custo, explicitado ──
 * A listagem tem teto de 25 por página, então buscar todos custa `ceil(total/25)` chamadas. Com dezenas de
 * colaboradores é irrelevante; com milhares, não — daí o teto duro de páginas: melhor a área faltar em
 * algumas linhas (vira "—", e o filtro segue valendo nas demais) do que a tela travar num laço longo. Se
 * esse teto passar a ser atingido de verdade, o conserto é o `/reports/team` trazer a área, não subir o
 * número aqui.
 */
const AREAS_PAGE_SIZE = 25
const AREAS_MAX_PAGES = 40 // 1000 colaboradores

const fetchTeamAreas = async (): Promise<ReadonlyMap<string, string>> => {
  const areaById = new Map<string, string>()
  for (let page = 1; page <= AREAS_MAX_PAGES; page += 1) {
    // Erro em qualquer página → devolve o parcial. A área é enriquecimento: não derruba o relatório (§II).
    const res = await listCollaboratorsFn({ data: { page, limit: AREAS_PAGE_SIZE } })
    if (!res.ok) return areaById
    for (const c of res.data.items) {
      if (c.occupationArea !== '') areaById.set(c.id, c.occupationArea)
    }
    if (page * AREAS_PAGE_SIZE >= res.data.meta.total) return areaById
  }
  return areaById
}

const teamAreasQueryOptions = () => ({
  queryKey: ['reports', 'team', 'areas'] as const,
  queryFn: fetchTeamAreas,
  // Área muda com cadastro, não com uso: cache longo evita repetir o fan-out a cada visita à tela.
  staleTime: 5 * 60_000,
  retry: 1,
})

export function useEquipe(): EquipeBindingState {
  const query = useQuery(teamReportQueryOptions())
  // Área de atuação: query SEPARADA, sobre a listagem de Colaboradores (o `/reports/team` não a traz).
  // Independente de propósito — se ela falhar ou ainda estiver carregando, a tabela aparece do mesmo jeito
  // e a coluna Área fica "—". Enriquecimento nunca bloqueia o relatório.
  const areasQuery = useQuery(teamAreasQueryOptions())

  const members = query.data?.data ?? null
  const error: ReportsError | null = query.data?.error ?? null
  const areaById = areasQuery.data ?? EMPTY_AREAS

  return useMemo<EquipeBindingState>(() => {
    if (query.isLoading) return { status: 'loading' }
    if (error !== null) return { status: 'error', error, errorTag: reportsErrorTag(error) }
    if (members !== null) return { status: 'ready', rows: toTeamRows(members, areaById) }
    return { status: 'loading' }
  }, [query.isLoading, error, members, areaById])
}

/**
 * CATÁLOGO de categorias demográficas (`/reports/team/demographics`), NÃO os números dos gráficos.
 *
 * As contagens que a tela desenha saem das linhas FILTRADAS (`countByTemplate` na page): a agregação do
 * backend não conhece os filtros, então o gráfico ficava parado enquanto a tabela recortava. O que ainda
 * vem daqui é o que só o backend sabe: quais categorias existem, em que ordem e com que rótulo — inclusive
 * as que ninguém preencheu, que o filtro precisa listar e o front não pode inventar.
 *
 * Falha/403 → catálogo vazio: os 3 gráficos caem no empty-state e a tabela segue intacta.
 */
export function useEquipeDemographics(): EquipeDemographics {
  const query = useQuery(teamDemographicsQueryOptions())
  const data = query.data?.data ?? null

  return useMemo<EquipeDemographics>(
    () =>
      data === null ? NO_DEMOGRAPHICS : { gender: data.gender, ageRange: data.ageRange, race: data.race },
    [data],
  )
}
