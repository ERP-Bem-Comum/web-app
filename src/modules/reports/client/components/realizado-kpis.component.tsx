/**
 * RealizadoKpis — os 4 cartões de KPI do relatório (mock): Total planejado (azul), Total realizado (verde),
 * Total provisionado (âmbar) e Execução (cinza) = realizado÷planejado. View BURRA: recebe os valores já
 * formatados por props (ViewModel pura). A barra de cor à esquerda vem por classe (kpiAccent).
 */
import type { ReactNode } from 'react'

import { kpis, kpi, kpiAccent, kpiLabel, kpiValue, kpiSub } from '../page/realizado-x-planejado.page.css.ts'

export type RealizadoKpisProps = Readonly<{
  plannedValue: string
  realizedValue: string
  provisionedValue: string
  executionValue: string
  labels: Readonly<{
    planned: string
    realized: string
    provisioned: string
    execution: string
    plannedSub: string
    realizedSub: string
    provisionedSub: string
    executionSub: string
  }>
}>

export function RealizadoKpis(props: RealizadoKpisProps): ReactNode {
  const L = props.labels
  return (
    <div className={kpis}>
      <div className={`${kpi} ${kpiAccent.plan}`}>
        <div className={kpiLabel}>{L.planned}</div>
        <div className={kpiValue}>{props.plannedValue}</div>
        <div className={kpiSub}>{L.plannedSub}</div>
      </div>
      <div className={`${kpi} ${kpiAccent.real}`}>
        <div className={kpiLabel}>{L.realized}</div>
        <div className={kpiValue}>{props.realizedValue}</div>
        <div className={kpiSub}>{L.realizedSub}</div>
      </div>
      <div className={`${kpi} ${kpiAccent.prov}`}>
        <div className={kpiLabel}>{L.provisioned}</div>
        <div className={kpiValue}>{props.provisionedValue}</div>
        <div className={kpiSub}>{L.provisionedSub}</div>
      </div>
      <div className={`${kpi} ${kpiAccent.exec}`}>
        <div className={kpiLabel}>{L.execution}</div>
        <div className={kpiValue}>{props.executionValue}</div>
        <div className={kpiSub}>{L.executionSub}</div>
      </div>
    </div>
  )
}
