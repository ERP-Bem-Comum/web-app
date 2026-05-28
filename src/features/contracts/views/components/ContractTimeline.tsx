import { FileText, Check, Clock } from 'lucide-react'
import { buildContractTimeline } from '../../domain/timeline'
import type { ContractRow } from '../../domain/types'

interface Props {
  contract: ContractRow
}

const STATUS_DOT: Record<string, string> = {
  current: 'bg-[#396496] ring-4 ring-[#e8eef5]',
  ok: 'bg-[#1f7d55] ring-4 ring-[#e8f5ee]',
  past: 'bg-[#c7bfb2] ring-4 ring-[#f0ede8]',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  current: <Clock size={12} className="text-white" />,
  ok: <Check size={12} className="text-white" />,
  past: <FileText size={12} className="text-white" />,
}

export function ContractTimeline({ contract }: Props) {
  const items = buildContractTimeline(contract)

  if (items.length === 0) {
    return (
      <div className="p-5 text-center text-[13px] text-[#999187]">
        Nenhum evento na timeline.
      </div>
    )
  }

  return (
    <div className="relative pl-6 py-2">
      {/* Linha vertical */}
      <div className="absolute left-[11px] top-3 bottom-3 w-px bg-[#e5ded4]" />

      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={item.id} className="relative flex items-start gap-3">
            {/* Dot */}
            <div
              className={`absolute -left-6 top-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center z-10 ${STATUS_DOT[item.status]}`}
            >
              {STATUS_ICON[item.status]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12.5px] font-semibold text-[#1f1c1a]">{item.title}</span>
                {item.badge && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#736b61] mt-0.5 truncate" title={item.subtitle}>
                {item.subtitle}
              </p>
              <span className="text-[11px] font-mono text-[#999187]">{item.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
