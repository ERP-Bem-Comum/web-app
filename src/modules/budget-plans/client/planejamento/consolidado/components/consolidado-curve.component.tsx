import type { ReactNode } from 'react'

import type { ConsolidadoCurveRow } from '#modules/budget-plans/client/planejamento/consolidado/consolidado-abc.view-model.ts'

import {
  card,
  head,
  headTitle,
  table,
  th,
  thNum,
  tr,
  cellProgram,
  progTag,
  progName,
  progVersion,
  cellTotal,
  cellShare,
  shareTrack,
  shareBar,
  shareValue,
} from './consolidado-curve.css.ts'

export type ConsolidadoCurveLabels = Readonly<{
  title: string
  colProgram: string
  colTotal: string
  colShare: string
}>

export type ConsolidadoCurveProps = Readonly<{
  rows: readonly ConsolidadoCurveRow[]
  labels: ConsolidadoCurveLabels
}>

/**
 * Tabela da CURVA ABC (view BURRA §XI): um programa por linha, ordenados por contribuição (o ViewModel já
 * ordena). Colunas: Programa (sigla + nome + versão), Total e Participação (barra + %). Só apresenta o que
 * recebe por props — nenhuma derivação aqui.
 */
export function ConsolidadoCurve(props: ConsolidadoCurveProps): ReactNode {
  return (
    <section className={card}>
      <div className={head}>
        <h2 className={headTitle}>{props.labels.title}</h2>
      </div>
      <table className={table}>
        <thead>
          <tr>
            <th className={th} scope="col">
              {props.labels.colProgram}
            </th>
            <th className={thNum} scope="col">
              {props.labels.colTotal}
            </th>
            <th className={thNum} scope="col">
              {props.labels.colShare}
            </th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => (
            <tr key={r.id} className={tr}>
              <td className={cellProgram}>
                <span className={progTag}>{r.program}</span>
                <span className={progName}>{r.name}</span>
                <span className={progVersion}>{r.versionLabel}</span>
              </td>
              <td className={cellTotal}>{r.totalLabel}</td>
              <td className={cellShare}>
                <span className={shareTrack} aria-hidden="true">
                  <span className={shareBar} style={{ inlineSize: `${String(r.sharePct)}%` }} />
                </span>
                <span className={shareValue}>{r.shareLabel}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
