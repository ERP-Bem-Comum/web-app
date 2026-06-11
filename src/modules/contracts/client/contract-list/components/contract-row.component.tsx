/**
 * ContractRow — linha da tabela de contratos (replicação v1).
 * Componente BURRO: recebe dados por props, zero estado/fetch.
 */
import type { MouseEvent, ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { ContractRow } from '#modules/contracts/client/contract-list/contract-list.view-model.ts'
import {
  formatContractNumber,
  formatCurrency,
  formatDate,
  deriveStatus,
  contractorInitials,
  getContractorFromRow,
} from '#modules/contracts/client/contract-list/contract-list.view-model.ts'

import {
  rowStyle,
  cell,
  cellCenter,
  cellRight,
  numberText,
  contractorWrap,
  avatar,
  avatarVariant,
  contractorInfo,
  contractorName,
  contractorDoc,
  objectText,
  tipoVariant,
  programText,
  currencyText,
  balanceText,
  periodText,
  additiveBadge,
  additiveEmpty,
  statusVariant,
  detailsWrap,
  summaryButton,
  dropdownMenu,
  actionItem,
  actionItemDanger,
} from './contract-row.css.ts'

const t = createTranslator(ptBR)

export interface ContractRowProps {
  readonly row: ContractRow
  readonly index: number
  readonly onRequestDelete: (row: ContractRow) => void
  readonly onGenerateDoc: (row: ContractRow, kind: 'quitacao' | 'historico') => void
}

function maskDocument(doc: string | null | undefined): string {
  if (!doc) return ''
  const digits = doc.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return doc
}

function statusToBadgeVariant(key: string): 'pending' | 'active' | 'finished' | 'terminated' | 'cancelled' {
  const map: Record<string, 'pending' | 'active' | 'finished' | 'terminated' | 'cancelled'> = {
    'em-andamento': 'active',
    pendente: 'pending',
    finalizado: 'finished',
    distrato: 'terminated',
    cancelado: 'cancelled',
  }
  return map[key] ?? 'active'
}

function closeDropdown(e: MouseEvent<HTMLButtonElement>) {
  e.stopPropagation()
  const details = e.currentTarget.closest('details')
  if (details) details.open = false
}

export function ContractRow({ row, index, onRequestDelete, onGenerateDoc }: ContractRowProps): ReactNode {
  const navigate = useNavigate()
  // Status REAL do contrato (inclui Distrato/Finalizado). Antes derivava do aditivo mais recente,
  // o que mascarava o status do contrato quando havia aditivos homologados.
  const derived = deriveStatus(row, !!(row.children?.length ?? 0))
  const valorAtual = row.currentValue ?? Number(row.totalValue)

  const contractor = getContractorFromRow(row)
  const contractorNameText = contractor?.name ?? contractor?.corporateName ?? contractor?.fantasyName ?? '—'
  const contractorDocText = maskDocument(contractor?.cnpj ?? contractor?.cpf)

  const handleRowClick = () => {
    void navigate({ to: '/contratos/$id', params: { id: row.id } })
  }

  const handleDetailsClick = (e: MouseEvent<HTMLDetailsElement>) => {
    e.stopPropagation()
  }

  const additiveCount = row.children?.length ?? 0

  return (
    <tr
      className={rowStyle}
      onClick={handleRowClick}
      data-index={index}
      aria-rowindex={index + 1}
    >
      <td className={cell}>
        <span className={numberText}>{formatContractNumber(row.contractCode, row.classification)}</span>
      </td>
      <td className={cell}>
        <div className={contractorWrap}>
          <span className={`${avatar} ${avatarVariant[row.contractType]}`}>
            {contractorInitials(contractorNameText)}
          </span>
          <div className={contractorInfo}>
            <span className={contractorName}>{contractorNameText}</span>
            {contractorDocText && (
              <span className={contractorDoc}>{contractorDocText}</span>
            )}
          </div>
        </div>
      </td>
      <td className={cell}>
        <span className={objectText}>{row.object}</span>
      </td>
      <td className={`${cell} ${cellCenter}`}>
        <span className={tipoVariant[row.contractType]}>{row.contractType}</span>
      </td>
      <td className={`${cell} ${cellCenter}`}>
        <span className={programText}>{row.program?.sigla ?? '—'}</span>
      </td>
      <td className={`${cell} ${cellRight}`}>
        <span className={currencyText}>{formatCurrency(valorAtual)}</span>
      </td>
      <td className={`${cell} ${cellCenter}`}>
        <span className={balanceText} title="Saldo será exibido quando o módulo Financeiro estiver integrado">
          {'—'}
        </span>
      </td>
      <td className={`${cell} ${cellCenter}`}>
        <span className={periodText}>
          {formatDate(row.contractPeriod.start)} — {formatDate(row.contractPeriod.end)}
        </span>
      </td>
      <td className={`${cell} ${cellCenter}`}>
        {additiveCount > 0 ? (
          <span className={additiveBadge}>+{additiveCount}</span>
        ) : (
          <span className={additiveEmpty}>—</span>
        )}
      </td>
      <td className={`${cell} ${cellCenter}`}>
        <span className={statusVariant[statusToBadgeVariant(derived.key)]}>{derived.label}</span>
      </td>
      <td className={`${cell} ${cellRight}`}>
        <details className={detailsWrap} name="contract-row-actions" onClick={handleDetailsClick}>
          <summary className={summaryButton} aria-label={t('contracts.table.columns.actions')}>
            ⋮
          </summary>
          <div className={dropdownMenu}>
            {derived.key === 'pendente' ? (
              // Pendente: abre o modal de CANCELAMENTO (§1.7, soft-delete → Cancelado). Só Pendente
              // oferece a ação (canCancelContract); não-Pendente cai no ramo de geração de documento.
              <button
                type="button"
                className={actionItemDanger}
                onClick={(e) => { closeDropdown(e); onRequestDelete(row) }}
              >
                {t('contracts.list.actions.cancel')}
              </button>
            ) : (
              // Demais status: gera documento padronizado em PDF (window.print → "Salvar como PDF").
              <>
                <button
                  type="button"
                  className={actionItem}
                  title={t('contracts.list.actions.financeiroSoon')}
                  onClick={(e) => { closeDropdown(e); onGenerateDoc(row, 'historico') }}
                >
                  {t('contracts.list.actions.paymentHistory')}
                </button>
                <button
                  type="button"
                  className={actionItem}
                  onClick={(e) => { closeDropdown(e); onGenerateDoc(row, 'quitacao') }}
                >
                  {t('contracts.list.actions.quitacao')}
                </button>
              </>
            )}
          </div>
        </details>
      </td>
    </tr>
  )
}
