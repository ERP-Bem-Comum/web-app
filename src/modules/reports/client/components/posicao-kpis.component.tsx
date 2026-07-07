/**
 * PosicaoKpis — os 4 cartões de KPI do relatório "Posição de Pagamentos": Atrasado (vermelho), Pago (verde),
 * A pagar (âmbar) e Total (azul). Sibling do `RealizadoKpis`: REUSA a mesma pele (kpi/kpiLabel/kpiValue/kpiSub
 * do RxP), trocando só a barra de acento pela paleta da Posição (`kpiAccentPosicao`). View BURRA: recebe os
 * valores já formatados em BRL por props (ViewModel pura).
 */
import type { ReactNode } from 'react'

import { kpis, kpi, kpiLabel, kpiValue, kpiSub } from '../page/posicao-pagamentos.page.css.ts'
import { kpiAccentPosicao } from '../page/posicao-pagamentos.page.css.ts'

export type PosicaoKpisProps = Readonly<{
  atrasadoValue: string
  pagoValue: string
  aPagarValue: string
  totalValue: string
  labels: Readonly<{
    atrasado: string
    pago: string
    aPagar: string
    total: string
    atrasadoSub: string
    pagoSub: string
    aPagarSub: string
    totalSub: string
  }>
}>

export function PosicaoKpis(props: PosicaoKpisProps): ReactNode {
  const L = props.labels
  return (
    <div className={kpis}>
      <div className={`${kpi} ${kpiAccentPosicao.atrasado}`}>
        <div className={kpiLabel}>{L.atrasado}</div>
        <div className={kpiValue}>{props.atrasadoValue}</div>
        <div className={kpiSub}>{L.atrasadoSub}</div>
      </div>
      <div className={`${kpi} ${kpiAccentPosicao.pago}`}>
        <div className={kpiLabel}>{L.pago}</div>
        <div className={kpiValue}>{props.pagoValue}</div>
        <div className={kpiSub}>{L.pagoSub}</div>
      </div>
      <div className={`${kpi} ${kpiAccentPosicao.aPagar}`}>
        <div className={kpiLabel}>{L.aPagar}</div>
        <div className={kpiValue}>{props.aPagarValue}</div>
        <div className={kpiSub}>{L.aPagarSub}</div>
      </div>
      <div className={`${kpi} ${kpiAccentPosicao.total}`}>
        <div className={kpiLabel}>{L.total}</div>
        <div className={kpiValue}>{props.totalValue}</div>
        <div className={kpiSub}>{L.totalSub}</div>
      </div>
    </div>
  )
}
