/**
 * ContractRow — linha da tabela de contratos (replicação v1).
 * Componente BURRO: recebe dados por props, zero estado/fetch.
 */
import type { MouseEvent, ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Badge } from '#shared/ui/index.ts'
import type { ContractRow } from '#modules/contracts/client/contract-list/contract-list.view-model.ts'
import {
  formatContractNumber,
  formatCurrency,
  formatDate,
  deriveStatus,
  programaShort,
} from '#modules/contracts/client/contract-list/contract-list.view-model.ts'

import {
  rowStyle,
  cell,
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
  periodText,
  additiveBadge,
  additiveEmpty,
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
}

function getContractorFromRow(contractRow: ContractRow) {
  switch (contractRow.contractType) {
    case 'Fornecedor':
      return contractRow.supplier
    case 'Financiador':
      return contractRow.financier
    case 'Colaborador':
      return contractRow.collaborator
    case 'ACT':
      return contractRow.supplier
    default:
      return contractRow.supplier ?? contractRow.financier ?? contractRow.collaborator
  }
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]
  if (first === undefined) return ''
  if (words.length === 1) return first.slice(0, 2).toUpperCase()
  const last = words[words.length - 1] ?? first
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase()
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

function statusToBadgeVariant(key: string): 'pending' | 'active' | 'finished' | 'terminated' {
  const map: Record<string, 'pending' | 'active' | 'finished' | 'terminated'> = {
    'em-andamento': 'active',
    pendente: 'pending',
    finalizado: 'finished',
    distrato: 'terminated',
  }
  return map[key] ?? 'active'
}

function closeDropdown(e: MouseEvent<HTMLButtonElement>) {
  e.stopPropagation()
  const details = e.currentTarget.closest('details')
  if (details) details.open = false
}

export function ContractRow({ row, index }: ContractRowProps): ReactNode {
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
        <span className={numberText}>{formatContractNumber(row.contractCode)}</span>
      </td>
      <td className={cell}>
        <div className={contractorWrap}>
          <span className={`${avatar} ${avatarVariant[row.contractType]}`}>
            {getInitials(contractorNameText)}
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
      <td className={cell}>
        <span className={tipoVariant[row.contractType]}>{row.contractType}</span>
      </td>
      <td className={cell}>
        <span className={programText}>{programaShort(row.program?.name)}</span>
      </td>
      <td className={cell}>
        <span className={currencyText}>{formatCurrency(valorAtual)}</span>
      </td>
      <td className={cell}>
        <span className={currencyText} title="Saldo será exibido quando o módulo Financeiro estiver integrado">
          {'—'}
        </span>
      </td>
      <td className={cell}>
        <span className={periodText}>
          {formatDate(row.contractPeriod.start)} — {formatDate(row.contractPeriod.end)}
        </span>
      </td>
      <td className={cell}>
        {additiveCount > 0 ? (
          <span className={additiveBadge}>+{additiveCount}</span>
        ) : (
          <span className={additiveEmpty}>—</span>
        )}
      </td>
      <td className={cell}>
        <Badge variant={statusToBadgeVariant(derived.key)}>{derived.label}</Badge>
      </td>
      <td className={cell}>
        <details className={detailsWrap} onClick={handleDetailsClick}>
          <summary className={summaryButton} aria-label={t('contracts.table.columns.actions')}>
            ⋮
          </summary>
          <div className={dropdownMenu}>
            {derived.key === 'pendente' ? (
              // Pendente: só permite excluir (ainda sem efetividade).
              <button type="button" className={actionItemDanger} onClick={closeDropdown}>
                {t('contracts.list.actions.delete')}
              </button>
            ) : (
              // Demais status: ações do contrato vigente/encerrado.
              <>
                <button type="button" className={actionItem} onClick={closeDropdown}>
                  {t('contracts.list.actions.paymentHistory')}
                </button>
                <button type="button" className={actionItem} onClick={closeDropdown}>
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
