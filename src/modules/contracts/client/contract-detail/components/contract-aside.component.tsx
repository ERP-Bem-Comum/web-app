import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'
import {
  asideSection,
  asideSectionLast,
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

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

export function ContractAside({ contract }: Props): ReactNode {
  const originalCents = contract.originalValue.cents
  const currentCents = contract.currentValue.cents
  const parts = formatCurrencyParts(currentCents)

  const homologatedAmendments = contract.children.filter((a) => a.status === 'Homologado')
  const pendingAmendments = contract.children.filter((a) => a.status === 'Pendente')

  const today = new Date()
  const startDate = contract.currentPeriod?.start ?? contract.originalPeriod.start
  const endDate = contract.currentPeriod?.end ?? contract.originalPeriod.end
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const elapsedDays = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <>
      {/* Valor Atual */}
      <div className={asideSection}>
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
              <span>Aditivo {a.amendmentNumber} ({a.type})</span>
              <span>{(a.impactValueCents ?? 0) >= 0 ? '+' : ''}{formatCurrency(a.impactValueCents ?? 0)}</span>
            </div>
          ))}

          {pendingAmendments.map((a) => (
            <div key={a.id} className={`${compositionItem} ${compositionItemPending}`}>
              <span>Aditivo {a.amendmentNumber} ({a.type}) — pendente</span>
              <span>{(a.impactValueCents ?? 0) >= 0 ? '+' : ''}{formatCurrency(a.impactValueCents ?? 0)}</span>
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
            <span>Início: {formatDate(startDate)}</span>
            <span>Fim: {formatDate(endDate)}</span>
          </div>
          <div className={vigenciaBarTrack}>
            <div className={vigenciaBarFill} style={{ width: `${String(progressPercent)}%` }} />
          </div>
          <div className={vigenciaBarLabels}>
            <span>Hoje: {formatDate(today)}</span>
            <span>{daysRemaining > 0 ? `${String(daysRemaining)} dias restantes` : 'Vencido'}</span>
          </div>
          {daysRemaining <= 45 && daysRemaining > 0 && (
            <div className={vigenciaAlert}>⚠ Contrato próximo do vencimento</div>
          )}
        </div>
      </div>

      {/* Espaço reservado para mais seções */}
      <div className={asideSectionLast} />
    </>
  )
}
