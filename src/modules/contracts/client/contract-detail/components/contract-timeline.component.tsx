import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'
import { amendmentSeqMap, formatAmendmentNumber } from '../amendment-number.ts'
import {
  asideSection,
  asideLabel,
  tlWrap,
  tlItem,
  tlItemOk,
  tlItemCurrent,
  tlDate,
  tlText,
} from '../page/contract-detail.css.ts'

interface Props {
  contract: Contract
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

interface TlEvent {
  readonly title: string
  readonly date: string
  readonly variant: 'default' | 'ok' | 'current'
}

export function ContractTimeline({ contract }: Props): ReactNode {
  const events: TlEvent[] = [{ title: 'Contrato criado', date: formatDate(contract.createdAt), variant: 'default' }]

  if (contract.signedAt) {
    events.push({ title: 'Contrato assinado', date: formatDate(contract.signedAt), variant: 'ok' })
  }

  const seq = amendmentSeqMap(contract.children)
  for (const a of contract.children) {
    const homologado = a.status === 'Homologado'
    events.push({
      title: `${formatAmendmentNumber(seq.get(a.id), contract.sequentialNumber, a.amendmentNumber)} ${homologado ? 'homologado' : 'incluído'}`,
      date: formatDate(a.signedAt ?? a.createdAt),
      variant: homologado ? 'ok' : 'current',
    })
  }

  // Mais recente no topo (wireframe)
  const ordered = [...events].reverse()

  return (
    <div className={asideSection}>
      <div className={asideLabel}>Timeline</div>
      <div className={tlWrap}>
        {ordered.map((event, idx) => (
          <div
            key={idx}
            className={`${tlItem} ${event.variant === 'ok' ? tlItemOk : event.variant === 'current' ? tlItemCurrent : ''}`}
          >
            <div className={tlDate}>{event.date}</div>
            <div className={tlText}>{event.title}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
