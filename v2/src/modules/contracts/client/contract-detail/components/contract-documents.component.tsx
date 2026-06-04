import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Contract, Amendment } from '#modules/contracts/public-api/index.ts'
import {
  section,
  sectionTitle,
  tableWrap,
  table,
  tableHeader,
  tableHeaderCell,
  tableRow,
  tableCell,
  tableCellRight,
  tableAction,
  tableActionBtn,
  docBadge,
  docBadgeBase,
  docBadgePrazo,
  docBadgeValor,
  docBadgeEscopo,
  docBadgeDistrato,
  docBadgeOutro,
  buttonPrimary,
} from '../page/contract-detail.css.ts'

interface Props {
  contract: Contract
}

function AmendmentBadge({ type }: { type: string }): ReactNode {
  const styleMap: Record<string, string> = {
    base: docBadgeBase,
    prazo: docBadgePrazo,
    valor: docBadgeValor,
    escopo: docBadgeEscopo,
    distrato: docBadgeDistrato,
    outro: docBadgeOutro,
  }
  const labelMap: Record<string, string> = {
    base: 'Base',
    prazo: 'Prazo',
    valor: 'Valor',
    escopo: 'Escopo',
    distrato: 'Distrato',
    outro: 'Outro',
  }
  return (
    <span className={`${docBadge} ${styleMap[type] ?? docBadgeOutro}`}>
      {labelMap[type] ?? type}
    </span>
  )
}

function formatCurrency(cents: number | undefined): string {
  if (cents === undefined) return '—'
  const val = cents / 100
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—'
  return date.toLocaleDateString('pt-BR')
}

export function ContractDocuments({ contract }: Props): ReactNode {
  const navigate = useNavigate()

  const allDocs: {
    id: string
    name: string
    type: string
    signedAt: Date | null | undefined
    summary: string
    impact: number | undefined
    status: string
  }[] = [
    {
      id: contract.id,
      name: 'Contrato Base',
      type: 'base',
      signedAt: contract.signedAt,
      summary: contract.objective,
      impact: undefined,
      status: contract.status,
    },
    ...contract.children.map((a: Amendment) => ({
      id: a.id,
      name: `Aditivo ${a.amendmentNumber}`,
      type: a.type,
      signedAt: a.signedAt,
      summary: a.description ?? '—',
      impact: a.impactValueCents,
      status: a.status,
    })),
  ]

  return (
    <div className={section}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className={sectionTitle}>Documentos</span>
        <button
          type="button"
          className={buttonPrimary}
          onClick={() => { navigate({ to: `/contratos/aditivo/${contract.id}` }).catch(() => { /* noop */ }) }}
        >
          + Novo Aditivo
        </button>
      </div>
      <div className={tableWrap}>
        <table className={table}>
          <thead className={tableHeader}>
            <tr>
              <th className={tableHeaderCell}>Nº</th>
              <th className={tableHeaderCell}>Tipo</th>
              <th className={tableHeaderCell}>Assinatura</th>
              <th className={tableHeaderCell}>Resumo</th>
              <th className={tableHeaderCell} style={{ textAlign: 'right' }}>Impacto</th>
              <th className={tableHeaderCell}>Status</th>
              <th className={tableHeaderCell} style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {allDocs.map((doc) => (
              <tr key={doc.id} className={tableRow}>
                <td className={tableCell}>{doc.name}</td>
                <td className={tableCell}>
                  <AmendmentBadge type={doc.type} />
                </td>
                <td className={tableCell}>{formatDate(doc.signedAt)}</td>
                <td className={tableCell}>{doc.summary}</td>
                <td className={tableCellRight}>
                  {doc.impact !== undefined ? formatCurrency(doc.impact) : '—'}
                </td>
                <td className={tableCell}>{doc.status}</td>
                <td className={tableCellRight}>
                  <div className={tableAction}>
                    <button type="button" className={tableActionBtn} aria-label="Visualizar">
                      👁
                    </button>
                    <button type="button" className={tableActionBtn} aria-label="Download">
                      ⬇
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
