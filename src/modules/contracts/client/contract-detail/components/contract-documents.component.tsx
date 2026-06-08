import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Contract, Amendment } from '#modules/contracts/public-api/index.ts'
import {
  sectionBlock,
  sectionHeadRow,
  sectionH3,
  sectionHeadAction,
  aditivos,
  aditRow,
  aditRowClickable,
  aditHead,
  aditHeadCell,
  aditHeadCellRight,
  aditRowBase,
  aditNum,
  aditData,
  aditResumo,
  aditImpacto,
  aditImpactoPos,
  aditImpactoBase,
  aditImpactoNeutral,
  docActions,
  docAct,
  docBadge,
  docBadgeBase,
  docBadgePrazo,
  docBadgeValor,
  docBadgeEscopo,
  docBadgeDistrato,
  docBadgeOutro,
  statusBadge,
  statusBadgePending,
  statusBadgeActive,
  statusBadgeFinished,
  statusBadgeTerminated,
} from '../page/contract-detail.css.ts'

interface Props {
  contract: Contract
  onOpenBase: () => void
}

const TIPO_CLASS: Record<string, string> = {
  base: docBadgeBase,
  prazo: docBadgePrazo,
  valor: docBadgeValor,
  escopo: docBadgeEscopo,
  distrato: docBadgeDistrato,
  outro: docBadgeOutro,
}
const TIPO_LABEL: Record<string, string> = {
  base: 'Base', prazo: 'Prazo', valor: 'Valor', escopo: 'Escopo', distrato: 'Distrato', outro: 'Outro',
}

const STATUS_CLASS: Record<string, string> = {
  Pendente: statusBadgePending,
  'Em Andamento': statusBadgeActive,
  Homologado: statusBadgeActive,
  Vigente: statusBadgeActive,
  Finalizado: statusBadgeFinished,
  Distrato: statusBadgeTerminated,
}

function formatCurrency(cents: number | undefined): string {
  if (cents === undefined) return '—'
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date | null | undefined): string {
  return date ? date.toLocaleDateString('pt-BR') : '—'
}

interface DocRow {
  readonly id: string
  readonly num: string
  readonly type: string
  readonly signedAt: Date | null | undefined
  readonly summary: string
  readonly impactKind: 'base' | 'pos' | 'neutral'
  readonly impactText: string
  readonly status: string
  readonly isBase: boolean
}

export function ContractDocuments({ contract, onOpenBase }: Props): ReactNode {
  const navigate = useNavigate()
  const ctPrefix = contract.classification === 'Contract' ? 'CT' : 'OS'

  const rows: readonly DocRow[] = [
    ...contract.children.map((a: Amendment): DocRow => {
      const hasValue = a.impactValueCents !== undefined && a.impactValueCents !== 0
      return {
        id: a.id,
        num: a.amendmentNumber,
        type: a.type,
        signedAt: a.signedAt,
        summary: a.description ?? '—',
        impactKind: hasValue ? 'pos' : 'neutral',
        impactText: hasValue ? `+ ${formatCurrency(a.impactValueCents)}` : 'sem impacto',
        status: a.status,
        isBase: false,
      }
    }),
    {
      id: contract.id,
      num: `${ctPrefix} ${contract.sequentialNumber}`,
      type: 'base',
      signedAt: contract.signedAt,
      summary: contract.objective || '—',
      impactKind: 'base',
      impactText: formatCurrency(contract.originalValue.cents),
      status: contract.status,
      isBase: true,
    },
  ]

  const impactClass = (k: DocRow['impactKind']): string =>
    k === 'pos' ? aditImpactoPos : k === 'base' ? aditImpactoBase : aditImpactoNeutral

  return (
    <section className={sectionBlock}>
      <div className={sectionHeadRow}>
        <h3 className={sectionH3}>Documentos</h3>
        <button
          type="button"
          className={sectionHeadAction}
          onClick={() => { navigate({ to: `/contratos/aditivo/${contract.id}` }).catch(() => { /* noop */ }) }}
        >
          + Novo Aditivo
        </button>
      </div>

      <div className={aditivos}>
        <div className={`${aditRow} ${aditHead}`}>
          <span className={aditHeadCell}>Nº</span>
          <span className={aditHeadCell}>Tipo</span>
          <span className={aditHeadCell}>Assinatura</span>
          <span className={aditHeadCell}>Resumo</span>
          <span className={`${aditHeadCell} ${aditHeadCellRight}`}>Impacto</span>
          <span className={aditHeadCell}>Status</span>
          <span className={`${aditHeadCell} ${aditHeadCellRight}`}>Doc</span>
        </div>

        {rows.map((r) => (
          <div
            key={r.id}
            className={`${aditRow} ${r.isBase ? `${aditRowClickable} ${aditRowBase}` : ''}`}
            {...(r.isBase ? { role: 'button', tabIndex: 0, onClick: onOpenBase } : {})}
          >
            <span className={aditNum}>{r.num}</span>
            <span><span className={`${docBadge} ${TIPO_CLASS[r.type] ?? docBadgeOutro}`}>{TIPO_LABEL[r.type] ?? r.type}</span></span>
            <span className={aditData}>{formatDate(r.signedAt)}</span>
            <span className={aditResumo} title={r.summary}>{r.summary}</span>
            <span className={`${aditImpacto} ${impactClass(r.impactKind)}`}>{r.impactText}</span>
            <span>
              <span className={`${statusBadge} ${STATUS_CLASS[r.status] ?? ''}`}>
                <span style={{ fontSize: '0.5rem', lineHeight: 1 }}>●</span>
                {r.status}
              </span>
            </span>
            <span className={docActions}>
              <button type="button" className={docAct} aria-label="Visualizar documento">👁</button>
              <button type="button" className={docAct} aria-label="Baixar documento" onClick={(e) => { e.stopPropagation() }}>⬇</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
