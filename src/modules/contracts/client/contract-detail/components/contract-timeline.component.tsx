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
  tlItemBase,
  tlItemFinished,
  tlNodeTone,
  tlDate,
  tlText,
} from '../page/contract-detail.css.ts'

interface Props {
  contract: Contract
}

type AmendmentTone = 'prazo' | 'valor' | 'escopo' | 'outro' | 'distrato'

interface TlEvent {
  // Key estável (B1): 'created' / 'signed' / 'finalized' / id do aditivo — sobrevive à reordenação.
  readonly key: string
  readonly title: string
  readonly date: string
  // Contrato base homologado (assinado/efetivado) → nó PRETO (cor do tipo BASE).
  readonly signed?: boolean
  // Contrato finalizado → nó na cor da badge "Finalizado".
  readonly finalized?: boolean
  // Aditivo → cor do nó pela cor do TIPO do aditivo; ausente nos eventos do contrato base.
  readonly amendmentType?: AmendmentTone
}

export function ContractTimeline({ contract }: Props): ReactNode {
  const events: TlEvent[] = [
    { key: 'created', title: 'Contrato criado', date: formatDate(contract.createdAt) },
  ]

  // Base homologado: o documento base vira "Homologado" ao ser efetivado (signedAt definido).
  if (contract.signedAt) {
    events.push({ key: 'signed', title: 'Contrato homologado', date: formatDate(contract.signedAt), signed: true })
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

  // Evento terminal: contrato finalizado (vigência encerrada) → nó na cor da badge "Finalizado".
  if (contract.status === 'Finalizado') {
    const period = contract.currentPeriod ?? contract.originalPeriod
    events.push({ key: 'finalized', title: 'Contrato finalizado', date: formatDate(period.end), finalized: true })
  }

  // Mais recente no topo (wireframe)
  const ordered = [...events].reverse()

  return (
    <div className={asideSection}>
      <div className={asideLabel}>Timeline</div>
      <div className={tlWrap}>
        {ordered.map((event) => {
          const tone = event.amendmentType
            ? tlNodeTone[event.amendmentType]
            : event.finalized
              ? tlItemFinished
              : event.signed
                ? tlItemBase
                : ''
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
