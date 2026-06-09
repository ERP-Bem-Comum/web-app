import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'
import type { VigenciaView } from '../contract-detail.view-model.ts'
import { amendmentSeqMap, formatAmendmentNumber } from '../amendment-number.ts'
import {
  asideSection,
  asideHero,
  asideLabel,
  asideValueWrap,
  asideValueCurrency,
  asideValueInteger,
  asideValueCents,
  compositionList,
  compositionItem,
  compositionItemPositive,
  compositionItemNegative,
  compositionItemPending,
  compositionTotal,
  vigenciaBar,
  vigenciaBarTrack,
  vigenciaBarFill,
  vigenciaBarLabels,
  vigenciaAlert,
} from '../page/contract-detail.css.ts'

interface Props {
  contract: Contract
  // Vigência derivada na view-model (recebe `now` estável) — a view burra não cria relógio (C1).
  vigencia: VigenciaView
}

function formatCurrencyParts(cents: number): { integer: string; cents: string } {
  const val = cents / 100
  const parts = val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(',')
  return { integer: parts[0] ?? '0', cents: `,${parts[1] ?? '00'}` }
}

function formatCurrency(cents: number): string {
  const val = cents / 100
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ContractAside({ contract, vigencia }: Props): ReactNode {
  const originalCents = contract.originalValue.cents
  const currentCents = contract.currentValue.cents
  const parts = formatCurrencyParts(currentCents)

  // Composição mostra APENAS aditivos do tipo VALOR (item 2): só eles impactam o valor atual do
  // contrato. Prazo/escopo/outro/distrato não entram aqui.
  const seq = amendmentSeqMap(contract.children)
  const valorAmendments = contract.children.filter((a) => a.type === 'valor')
  const homologatedAmendments = valorAmendments.filter((a) => a.status === 'Homologado')
  const pendingAmendments = valorAmendments.filter((a) => a.status === 'Pendente')

  return (
    <>
      {/* Valor Atual */}
      <div className={asideHero}>
        <div className={asideLabel}>Valor Atual</div>
        <div className={asideValueWrap}>
          <span className={asideValueCurrency}>R$</span>
          <span className={asideValueInteger}>{parts.integer}</span>
          <span className={asideValueCents}>{parts.cents}</span>
        </div>
      </div>

      {/* Composição */}
      <div className={asideSection}>
        <div className={asideLabel}>Composição</div>
        <div className={compositionList}>
          <div className={compositionItem}>
            <span>Valor Original</span>
            <span>{formatCurrency(originalCents)}</span>
          </div>

          {homologatedAmendments.map((a) => (
            <div key={a.id} className={`${compositionItem} ${(a.impactValueCents ?? 0) >= 0 ? compositionItemPositive : compositionItemNegative}`}>
              <span>{formatAmendmentNumber(seq.get(a.id), contract.sequentialNumber, a.amendmentNumber)}</span>
              <span>{(a.impactValueCents ?? 0) >= 0 ? '+' : ''}{formatCurrency(a.impactValueCents ?? 0)}</span>
            </div>
          ))}

          {pendingAmendments.map((a) => (
            <div key={a.id} className={`${compositionItem} ${compositionItemPending}`}>
              <span>{formatAmendmentNumber(seq.get(a.id), contract.sequentialNumber, a.amendmentNumber)} · pendente</span>
              <span>não computado</span>
            </div>
          ))}

          <div className={compositionTotal}>
            <span>Valor Atual</span>
            <span>{formatCurrency(currentCents)}</span>
          </div>
        </div>
      </div>

      {/* Vigência */}
      <div className={asideSection}>
        <div className={asideLabel}>Vigência Atual</div>
        <div className={vigenciaBar}>
          <div className={vigenciaBarLabels}>
            <span>Início: {vigencia.startLabel}</span>
            <span>Fim: {vigencia.endLabel}</span>
          </div>
          <div className={vigenciaBarTrack}>
            <div className={vigenciaBarFill} style={{ width: `${String(vigencia.progressPercent)}%` }} />
          </div>
          <div className={vigenciaBarLabels}>
            <span>Hoje: {vigencia.todayLabel}</span>
            <span>{vigencia.daysRemaining > 0 ? `${String(vigencia.daysRemaining)} dias restantes` : 'Vencido'}</span>
          </div>
          {vigencia.nearExpiry && (
            <div className={vigenciaAlert}>⚠ Contrato próximo do vencimento</div>
          )}
        </div>
      </div>
    </>
  )
}
