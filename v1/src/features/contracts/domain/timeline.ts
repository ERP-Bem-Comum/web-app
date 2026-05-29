import type { ContractRow } from './types'

export type TimelineStatus = 'past' | 'current' | 'ok'

export type TimelineItem = {
  id: string
  title: string
  subtitle: string
  date: string
  status: TimelineStatus
  kind: 'base' | 'aditivo'
  badge?: string
  badgeColor?: string
}

function fmtDate(d: string | Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function deriveTimelineStatus(item: ContractRow, index: number, total: number): TimelineStatus {
  // O item mais recente (índice 0) é current
  if (index === 0) return 'current'
  // Itens anteriores são ok (já processados)
  if (index < total - 1) return 'ok'
  // O último (contrato base) é past
  return 'past'
}

export function buildContractTimeline(contract: ContractRow): TimelineItem[] {
  const children = contract.children || []

  // Aditivos ordenados por createdAt descendente (mais recente primeiro)
  const sortedChildren = [...children].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const aditivoItems: TimelineItem[] = sortedChildren.map((child, idx) => {
    const status = deriveTimelineStatus(child, idx, sortedChildren.length + 1)
    const isHomologado = (child as any).aditivoStatus === 'Homologado'
    return {
      id: String(child.id),
      title: `Aditivo de ${(child as any).aditivoType || 'alteração'}`,
      subtitle: child.object || '—',
      date: fmtDate(child.createdAt),
      status,
      kind: 'aditivo',
      badge: isHomologado ? 'Homologado' : (child as any).aditivoStatus || 'Pendente',
      badgeColor: isHomologado
        ? 'text-[#176642] bg-[rgba(31,125,85,0.10)]'
        : 'text-[#9a5402] bg-[rgba(217,119,6,0.08)]',
    }
  })

  // Contrato base sempre por último (primeiro cronologicamente)
  const baseItem: TimelineItem = {
    id: String(contract.id),
    title: 'Contrato Base',
    subtitle: contract.object || '—',
    date: fmtDate(contract.createdAt),
    status: 'past',
    kind: 'base',
    badge: contract.contractStatus || undefined,
    badgeColor: contract.contractStatus === 'Vigente'
      ? 'text-[#176642] bg-[rgba(31,125,85,0.10)]'
      : contract.contractStatus === 'Pendente'
        ? 'text-[#9a5402] bg-[rgba(217,119,6,0.08)]'
        : 'text-[#332e29] bg-[rgb(242,237,229)] border-[0.5px] border-[#e5ded4]',
  }

  return [...aditivoItems, baseItem]
}
