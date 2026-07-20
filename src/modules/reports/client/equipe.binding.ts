/**
 * Binding do relatório "Equipe ABC" — ADAPTER React (§XI). Lê a equipe REAL do core-api (endpoint LGPD-safe,
 * via `reportsRepository.getTeam`) e entrega as linhas da tabela já adaptadas pelo view-model puro
 * (`toTeamRows`, com sentinelas honestos p/ idade/gênero/raça-cor que a TABELA não fornece). A View consome
 * o `state` (união discriminada §IV: loading | error | ready).
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

/**
 * Esconde categorias com contagem 0 — paridade com o LEGADO, que só desenha fatia/barra de quem tem gente.
 *
 * O backend manda TODAS as categorias (inclusive zeradas) de propósito, para o gráfico não mudar de forma
 * conforme a amostra. Para as barras isso é bom; para a legenda do donut, não: com 9 identidades de gênero
 * e dado real quase sempre concentrado em 2 ou 3, a legenda virava uma lista de 9 linhas com 8 zeros, que
 * empurrava a altura dos 3 cards da linha (a grade é `stretch`) e criava o vazio que a P.O. viu na tela.
 *
 * Se TUDO for zero devolvemos a lista inteira: melhor mostrar as categorias zeradas do que um card vazio
 * sem explicação (o empty-state do componente cobre o caso de lista vazia de verdade).
 */
const withoutEmpty = (cats: readonly CategoryCount[]): readonly CategoryCount[] => {
  const nonEmpty = cats.filter((c) => c.count > 0)
  return nonEmpty.length > 0 ? nonEmpty : cats
}

export function useEquipe(): EquipeBindingState {
  const query = useQuery(teamReportQueryOptions())

  const members = query.data?.data ?? null
  const error: ReportsError | null = query.data?.error ?? null

  return useMemo<EquipeBindingState>(() => {
    if (query.isLoading) return { status: 'loading' }
    if (error !== null) return { status: 'error', error, errorTag: reportsErrorTag(error) }
    if (members !== null) return { status: 'ready', rows: toTeamRows(members) }
    return { status: 'loading' }
  }, [query.isLoading, error, members])
}

/** Demografia agregada dos 3 gráficos. Falha/403 → datasets vazios (a tabela não é afetada). */
export function useEquipeDemographics(): EquipeDemographics {
  const query = useQuery(teamDemographicsQueryOptions())
  const data = query.data?.data ?? null

  return useMemo<EquipeDemographics>(
    () =>
      data === null
        ? NO_DEMOGRAPHICS
        : {
            gender: withoutEmpty(data.gender),
            ageRange: withoutEmpty(data.ageRange),
            race: withoutEmpty(data.race),
          },
    [data],
  )
}
