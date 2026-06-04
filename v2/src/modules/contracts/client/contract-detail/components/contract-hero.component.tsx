import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'
import {
  heroCard,
  heroHeader,
  heroTitle,
  heroSubtitle,
  heroGrid,
  heroField,
  heroLabel,
  heroValue,
  statusBadge,
  statusBadgePending,
  statusBadgeActive,
  statusBadgeFinished,
  statusBadgeTerminated,
} from '../page/contract-detail.css.ts'

interface Props {
  contract: Contract
}

function StatusBadge({ status }: { status: string }): ReactNode {
  const styleMap: Record<string, string> = {
    Pendente: statusBadgePending,
    'Em Andamento': statusBadgeActive,
    Finalizado: statusBadgeFinished,
    Distrato: statusBadgeTerminated,
  }
  return (
    <span className={`${statusBadge} ${styleMap[status] ?? ''}`}>
      <span style={{ fontSize: '0.5rem', lineHeight: 1 }}>●</span>
      {status}
    </span>
  )
}

function formatCurrency(money: { cents: number }): string {
  const val = money.cents / 100
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

export function ContractHero({ contract }: Props): ReactNode {
  const partnerName = contract.supplier?.name
    ?? contract.financier?.name
    ?? contract.collaborator?.name
    ?? '—'

  const partnerDoc = contract.supplier?.document
    ?? contract.financier?.document
    ?? contract.collaborator?.document
    ?? '—'

  const partnerType = contract.contractType === 'Supplier' ? 'Fornecedor'
    : contract.contractType === 'Financier' ? 'Financiador'
    : contract.contractType === 'Collaborator' ? 'Colaborador'
    : 'ACT'

  return (
    <div className={heroCard}>
      <div className={heroHeader}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={heroTitle}>{contract.title || '—'}</span>
            <StatusBadge status={contract.status} />
          </div>
          <span className={heroSubtitle}>{contract.objective || '—'}</span>
        </div>
      </div>

      <div className={heroGrid}>
        <div className={heroField}>
          <span className={heroLabel}>Contratado</span>
          <span className={heroValue}>{partnerName}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Documento</span>
          <span className={heroValue}>{partnerDoc}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Tipo</span>
          <span className={heroValue}>{partnerType}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Origem</span>
          <span className={heroValue}>{contract.origin ?? 'Manual'}</span>
        </div>

        <div className={heroField}>
          <span className={heroLabel}>Classificação</span>
          <span className={heroValue}>{contract.classification === 'Contract' ? 'Contrato' : 'Ordem de Serviço'}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Modelo</span>
          <span className={heroValue}>{contract.contractModel === 'Service' ? 'Serviço' : 'Doação'}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Categorização</span>
          <span className={heroValue}>{contract.categorizacao ?? '—'}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Centro de Custo</span>
          <span className={heroValue}>{contract.centroDeCusto ?? '—'}</span>
        </div>

        <div className={heroField}>
          <span className={heroLabel}>Valor Original</span>
          <span className={heroValue}>{formatCurrency(contract.originalValue)}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Início Original</span>
          <span className={heroValue}>{formatDate(contract.originalPeriod.start)}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Fim Original</span>
          <span className={heroValue}>{formatDate(contract.originalPeriod.end)}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Status Base</span>
          <span className={heroValue}>{contract.status}</span>
        </div>

        <div className={heroField}>
          <span className={heroLabel}>Programa</span>
          <span className={heroValue}>{contract.program?.name ?? '—'}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Plano Orçamentário</span>
          <span className={heroValue}>{contract.budgetPlan?.scenarioName ?? '—'}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Email</span>
          <span className={heroValue}>{contract.email ?? '—'}</span>
        </div>
        <div className={heroField}>
          <span className={heroLabel}>Telefone</span>
          <span className={heroValue}>{contract.telephone ?? '—'}</span>
        </div>
      </div>
    </div>
  )
}
