/**
 * EquipeTable — lista "brand" enxuta do relatório "Equipe ABC" (8 colunas de exibição). View BURRA: recebe as
 * linhas já prontas + os rótulos das colunas (i18n) e apenas apresenta. Os VALORES (nome, programa, função,
 * gênero, raça/cor, escolaridade) são DADO (strings simples do placeholder), não i18n. Idade null vira o
 * rótulo "N/A" (recebido por prop). Rola na vertical quando a lista é longa; thead sticky.
 */
import type { ReactNode } from 'react'

import type { TeamMemberRow } from '../equipe.view-model.ts'

import {
  card,
  cardHeader,
  cardTitle,
  cardCount,
  scroller,
  thead,
  rowClickable,
  cellName,
  cell,
  cellNum,
  cellMuted,
  empty,
} from './equipe-table.css.ts'

export type EquipeTableLabels = Readonly<{
  cardTitle: string
  count: string
  nome: string
  idade: string
  area: string
  funcao: string
  vinculo: string
  genero: string
  racaCor: string
  escolaridade: string
  naLabel: string
  empty: string
  /** aria-label da linha clicável, com `{{nome}}` substituído pelo nome do colaborador. */
  rowAction: string
}>

export type EquipeTableProps = Readonly<{
  /** Linhas JÁ paginadas pela View (a View fatia; a tabela só apresenta). */
  rows: readonly TeamMemberRow[]
  /** Total de colaboradores (para o contador do cabeçalho — não muda ao paginar). */
  totalCount: number
  labels: EquipeTableLabels
  /** Abre o modal de detalhe da linha clicada (a navegação/estado mora na View). */
  onRowClick: (member: TeamMemberRow) => void
}>

export function EquipeTable(props: EquipeTableProps): ReactNode {
  const { labels, onRowClick } = props
  return (
    <div className={card}>
      <div className={cardHeader}>
        <h2 className={cardTitle}>{labels.cardTitle}</h2>
        <span className={cardCount}>{labels.count.replace('{{count}}', String(props.totalCount))}</span>
      </div>

      {props.rows.length === 0 ? (
        <p className={empty}>{labels.empty}</p>
      ) : (
        <div className={scroller}>
          <div className={thead} role="row">
            <span>{labels.nome}</span>
            <span>{labels.idade}</span>
            <span>{labels.area}</span>
            <span>{labels.funcao}</span>
            <span>{labels.vinculo}</span>
            <span>{labels.genero}</span>
            <span>{labels.racaCor}</span>
            <span>{labels.escolaridade}</span>
          </div>

          {props.rows.map((r, i) => (
            <button
              type="button"
              className={rowClickable}
              key={`${r.nome}-${String(i)}`}
              aria-label={labels.rowAction.replace('{{nome}}', r.nome)}
              onClick={() => {
                onRowClick(r)
              }}
            >
              <span className={cellName} title={r.nome}>
                {r.nome}
              </span>
              <span className={r.idade === null ? cellMuted : cellNum}>{r.idade ?? labels.naLabel}</span>
              <span className={cell}>{r.programa}</span>
              <span className={cell} title={r.funcao}>
                {r.funcao}
              </span>
              <span className={cell}>{r.vinculo}</span>
              <span className={cell}>{r.genero}</span>
              <span className={cell}>{r.racaCor}</span>
              <span className={cell}>{r.escolaridade}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
