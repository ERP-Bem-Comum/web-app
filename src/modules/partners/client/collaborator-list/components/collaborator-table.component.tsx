/**
 * CollaboratorTable — tabela dedicada de Colaboradores (view BURRA) fiel ao mock "colaboradores-brand".
 * Grid de 7 colunas (avatar+nome, e-mail, área, contratos, função, status, situação) com chips e hover.
 * Substitui o `DataTable` compartilhado só nesta tela (nova identidade isolada). Estado por união (loading|
 * error|ready); `ready` com 0 linhas = vazio.
 */
import type { KeyboardEvent, ReactNode } from 'react'

import type { CollaboratorRow } from '../collaborator-list.view-model.ts'
import {
  card,
  thead,
  row,
  rowClickable,
  cell,
  email as emailCell,
  muted,
  numZero,
  person,
  avatar,
  name as nameText,
  stateRow,
  errorRow,
  chip,
  dot,
  chipTone,
  dotTone,
} from './collaborator-table.css.ts'

export type CollaboratorTableStatus =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; message: string }>
  | Readonly<{ status: 'ready'; rows: readonly CollaboratorRow[] }>

export type CollaboratorTableLabels = Readonly<{
  caption: string
  name: string
  email: string
  area: string
  contracts: string
  role: string
  status: string
  situacao: string
  statusActive: string
  statusInactive: string
  situacaoComplete: string
  situacaoPreRegistration: string
  empty: string
  loading: string
}>

export type CollaboratorTableProps = Readonly<{
  state: CollaboratorTableStatus
  labels: CollaboratorTableLabels
  areaLabel: (area: string) => string
  initials: (name: string) => string
  onRowClick: (row: CollaboratorRow) => void
}>

type Tone = 'ok' | 'danger' | 'cad' | 'warn'

function Chip(props: Readonly<{ tone: Tone; label: string }>): ReactNode {
  return (
    <span className={`${chip} ${chipTone[props.tone]}`}>
      <span className={`${dot} ${dotTone[props.tone]}`} aria-hidden="true" />
      {props.label}
    </span>
  )
}

export function CollaboratorTable(props: CollaboratorTableProps): ReactNode {
  const { labels: L } = props

  return (
    <div className={card} role="table" aria-label={L.caption}>
      <div className={thead} role="row">
        <div role="columnheader">{L.name}</div>
        <div role="columnheader">{L.email}</div>
        <div role="columnheader">{L.area}</div>
        <div role="columnheader">{L.contracts}</div>
        <div role="columnheader">{L.role}</div>
        <div role="columnheader">{L.status}</div>
        <div role="columnheader">{L.situacao}</div>
      </div>

      <div role="rowgroup">
        {props.state.status === 'loading' ? (
          <div className={stateRow} role="status">
            {L.loading}
          </div>
        ) : props.state.status === 'error' ? (
          <div className={errorRow} role="alert">
            {props.state.message}
          </div>
        ) : props.state.rows.length === 0 ? (
          <div className={stateRow}>{L.empty}</div>
        ) : (
          props.state.rows.map((r) => {
            const onActivate = (): void => {
              props.onRowClick(r)
            }
            return (
              <div
                key={r.id}
                className={`${row} ${rowClickable}`}
                role="row"
                tabIndex={0}
                onClick={onActivate}
                onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onActivate()
                  }
                }}
              >
                <div className={person} role="cell">
                  <span className={avatar} aria-hidden="true">
                    {props.initials(r.name)}
                  </span>
                  <span className={nameText}>{r.name}</span>
                </div>
                <div className={emailCell} role="cell">
                  {r.email}
                </div>
                <div className={muted} role="cell">
                  {props.areaLabel(r.occupationArea)}
                </div>
                <div className={r.contractCount === 0 ? numZero : cell} role="cell">
                  {String(r.contractCount)}
                </div>
                <div className={cell} role="cell">
                  {r.role}
                </div>
                <div role="cell">
                  {r.activation === 'active' ? (
                    <Chip tone="ok" label={L.statusActive} />
                  ) : (
                    <Chip tone="danger" label={L.statusInactive} />
                  )}
                </div>
                <div role="cell">
                  {r.registration === 'pre-registration' ? (
                    <Chip tone="warn" label={L.situacaoPreRegistration} />
                  ) : (
                    <Chip tone="cad" label={L.situacaoComplete} />
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
