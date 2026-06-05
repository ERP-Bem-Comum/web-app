import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'
import {
  section,
  sectionTitle,
  timeline,
  timelineItem,
  timelineDot,
  timelineDotGreen,
  timelineDotOrange,
  timelineDotGray,
  timelineContent,
  timelineTitle,
  timelineDate,
} from '../page/contract-detail.css.ts'

interface Props {
  contract: Contract
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

export function ContractTimeline({ contract }: Props): ReactNode {
  const events: {
    title: string
    date: string
    variant: 'blue' | 'green' | 'orange' | 'gray'
  }[] = [
    {
      title: 'Contrato criado',
      date: formatDate(contract.createdAt),
      variant: 'blue',
    },
  ]

  if (contract.signedAt) {
    events.push({
      title: 'Contrato assinado',
      date: formatDate(contract.signedAt),
      variant: 'green',
    })
  }

  contract.children
    .filter((a) => a.status === 'Homologado')
    .forEach((a) => {
      events.push({
        title: `Aditivo ${a.amendmentNumber} homologado`,
        date: formatDate(a.signedAt ?? a.createdAt),
        variant: 'orange',
      })
    })

  return (
    <div className={section}>
      <span className={sectionTitle}>Timeline de Marcos</span>
      <div className={timeline}>
        {events.map((event, idx) => (
          <div key={idx} className={timelineItem}>
            <span
              className={`${timelineDot} ${
                event.variant === 'green'
                  ? timelineDotGreen
                  : event.variant === 'orange'
                  ? timelineDotOrange
                  : event.variant === 'gray'
                  ? timelineDotGray
                  : ''
              }`}
            />
            <div className={timelineContent}>
              <span className={timelineTitle}>{event.title}</span>
              <span className={timelineDate}>{event.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
