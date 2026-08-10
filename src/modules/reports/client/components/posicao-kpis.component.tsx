/**
 * PosicaoKpis — os 4 cartões de KPI do relatório "Posição de Pagamentos": Atrasado (vermelho), Pago (verde),
 * A pagar (neutro) e Total (azul). Sibling do `RealizadoKpis`: REUSA a mesma pele (kpi/kpiLabel/kpiValue/kpiSub
 * do RxP). BOLINHA colorida no rótulo (`kpiAccentPosicao` no `kpiDot`); VALOR colorido por semântica (Pago verde,
 * Atrasado vermelho); card "Total" TINTADO (destaque suave). View BURRA: valores já formatados em BRL por props.
 */
import type { ReactNode } from 'react'

import {
  kpis,
  kpi,
  kpiDot,
  kpiLabel,
  kpiValue,
  kpiSub,
  kpiAccentPosicao,
  kpiValueTonePosicao,
  kpiTintTotal,
} from '../page/posicao-pagamentos.page.css.ts'

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
      {/* Ordem: A pagar/receber · Pago/Recebido · Atrasado (3ª — afasta o vermelho do menu azul) · Total. */}
      <div className={kpi}>
        <div className={kpiLabel}>
          <span className={`${kpiDot} ${kpiAccentPosicao.aPagar}`} aria-hidden="true" />
          {L.aPagar}
        </div>
        <div className={kpiValue}>{props.aPagarValue}</div>
        <div className={kpiSub}>{L.aPagarSub}</div>
      </div>
      <div className={kpi}>
        <div className={kpiLabel}>
          <span className={`${kpiDot} ${kpiAccentPosicao.pago}`} aria-hidden="true" />
          {L.pago}
        </div>
        <div className={`${kpiValue} ${kpiValueTonePosicao.pago}`}>{props.pagoValue}</div>
        <div className={kpiSub}>{L.pagoSub}</div>
      </div>
      <div className={kpi}>
        <div className={kpiLabel}>
          <span className={`${kpiDot} ${kpiAccentPosicao.atrasado}`} aria-hidden="true" />
          {L.atrasado}
        </div>
        <div className={`${kpiValue} ${kpiValueTonePosicao.atrasado}`}>{props.atrasadoValue}</div>
        <div className={kpiSub}>{L.atrasadoSub}</div>
      </div>
      <div className={`${kpi} ${kpiTintTotal}`}>
        <div className={kpiLabel}>
          <span className={`${kpiDot} ${kpiAccentPosicao.total}`} aria-hidden="true" />
          {L.total}
        </div>
        <div className={kpiValue}>{props.totalValue}</div>
        <div className={kpiSub}>{L.totalSub}</div>
      </div>
    </div>
  )
}
