import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'
// formatDate único (do domain): trata YYYY-MM-DD como UTC e não recua 1 dia em BRT (M8).
import { formatDate } from '#modules/contracts/client/domain/format.ts'
import { amendmentSeqMap, formatAmendmentNumber } from '../amendment-number.ts'
import {
  asideSection,
  asideLabel,
  tlWrap,
  tlItem,
  tlItemOk,
  tlNodeTone,
  tlDate,
  tlText,
} from '../page/contract-detail.css.ts'

interface Props {
  contract: Contract
}

type AmendmentTone = 'prazo' | 'valor' | 'escopo' | 'outro' | 'distrato'

interface TlEvent {
  // Key estável (B1): 'created' / 'signed' / id do aditivo — sobrevive à reordenação da lista.
  readonly key: string
  readonly title: string
  readonly date: string
  readonly signed?: boolean
  // Aditivo → cor do nó pela cor do TIPO do aditivo; ausente nos eventos do contrato (criado/assinado).
  readonly amendmentType?: AmendmentTone
}

export function ContractTimeline({ contract }: Props): ReactNode {
  const events: TlEvent[] = [
    { key: 'created', title: 'Contrato criado', date: formatDate(contract.createdAt) },
  ]

  if (contract.signedAt) {
    events.push({ key: 'signed', title: 'Contrato assinado', date: formatDate(contract.signedAt), signed: true })
  }

  const seq = amendmentSeqMap(contract.children)
  for (const a of contract.children) {
    const homologado = a.status === 'Homologado'
    events.push({
      key: a.id,
      title: `${formatAmendmentNumber(seq.get(a.id), contract.sequentialNumber, a.amendmentNumber)} ${homologado ? 'homologado' : 'incluído'}`,
      date: formatDate(a.signedAt ?? a.createdAt),
      amendmentType: a.type,
    })
  }

  // Mais recente no topo (wireframe)
  const ordered = [...events].reverse()

  return (
    <div className={asideSection}>
      <div className={asideLabel}>Timeline</div>
      <div className={tlWrap}>
        {ordered.map((event) => {
          const tone = event.amendmentType ? tlNodeTone[event.amendmentType] : event.signed ? tlItemOk : ''
          return (
            <div key={event.key} className={`${tlItem} ${tone}`}>
              <div className={tlDate}>{event.date}</div>
              <div className={tlText}>{event.title}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
