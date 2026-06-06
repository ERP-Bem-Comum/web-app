import type { ContractRow } from './types'

export interface DerivedStatus {
  readonly label: string
  readonly key: string
}

export function deriveStatus(
  data: Partial<ContractRow>,
  hasChildren: boolean,
): DerivedStatus {
  void hasChildren

  if (data.contractStatus === 'Em Andamento') {
    return { label: 'EM ANDAMENTO', key: 'em-andamento' }
  }
  if (data.contractStatus === 'Pendente') {
    return { label: 'PENDENTE', key: 'pendente' }
  }
  if (data.contractStatus === 'Finalizado') {
    return { label: 'FINALIZADO', key: 'finalizado' }
  }
  if (data.contractStatus === 'Distrato') {
    return { label: 'DISTRATO', key: 'distrato' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = data.contractPeriod?.start
    ? new Date(data.contractPeriod.start)
    : null
  const end = data.contractPeriod?.end
    ? new Date(data.contractPeriod.end)
    : null

  const hasDistratoChild = (data.children ?? []).some(
    (c) =>
      (c as unknown as Record<string, string>).aditivoType === 'distrato' &&
      (c as unknown as Record<string, string>).aditivoStatus === 'Homologado',
  )
  const isDistratoAditivo =
    (data as unknown as Record<string, string>).aditivoType === 'distrato' &&
    (data as unknown as Record<string, string>).aditivoStatus === 'Homologado'
  const withdrawalUrl = (data as unknown as Record<string, string>).withdrawalUrl
  if (
    Boolean(withdrawalUrl) ||
    isDistratoAditivo ||
    hasDistratoChild
  ) {
    return { label: 'DISTRATO', key: 'distrato' }
  }

  const isAditivo =
    !!(data as unknown as Record<string, string>).parentId ||
    !!(data as unknown as Record<string, string>).aditivoType
  const isHomologado =
    (data as unknown as Record<string, string>).aditivoStatus === 'Homologado'
  if (
    !(data as unknown as Record<string, string>).signedContractUrl &&
    !(isAditivo && isHomologado)
  ) {
    return { label: 'PENDENTE', key: 'pendente' }
  }

  if (start) {
    const hasValidEnd = end && today <= end
    if (hasValidEnd && today >= start) {
      return { label: 'EM ANDAMENTO', key: 'em-andamento' }
    }
  }

  if (end && today > end) {
    return { label: 'FINALIZADO', key: 'finalizado' }
  }

  return { label: 'EM ANDAMENTO', key: 'em-andamento' }
}

export function getMostRecentChild(row: ContractRow): ContractRow {
  if (row.children && row.children.length > 0) {
    const sorted = [...row.children].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    return sorted[0]
  }
  return row
}

export const STATUS_OPTIONS: readonly {
  readonly key: string
  readonly label: string
}[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'em-andamento', label: 'Em Andamento' },
  { key: 'pendente', label: 'Pendente' },
  { key: 'finalizado', label: 'Finalizado' },
  { key: 'distrato', label: 'Distrato' },
  { key: 'vencendo', label: 'Vencendo' },
] as const

export const statusBadgeClass = (key: string): string => {
  const map: Record<string, string> = {
    'em-andamento': 'text-[#176642] bg-[rgba(31,125,85,0.10)]',
    pendente: 'text-[#9a5402] bg-[rgba(217,119,6,0.08)]',
    finalizado:
      'text-[#332e29] bg-[rgb(242,237,229)] border-[0.5px] border-[#e5ded4]',
    distrato: 'text-[rgb(168,47,36)] bg-[rgba(229,77,64,0.08)]',
    cancelado: 'text-[rgb(168,47,36)] bg-[rgba(229,77,64,0.08)]',
  }
  return map[key] || map['em-andamento']
}

export const tipoBadgeClass = (contractType: string): string => {
  const map: Record<string, string> = {
    Fornecedor:
      'text-[rgb(28,121,67)] bg-[rgba(51,178,102,0.10)] border-[0.5px] border-[rgba(51,178,102,0.20)]',
    Colaborador:
      'text-[rgb(26,112,140)] bg-[rgb(232,245,250)] border-[0.5px] border-[rgb(140,199,222)]',
    Financiador:
      'text-[rgb(217,153,26)] bg-[rgb(255,247,224)] border-[0.5px] border-[rgba(217,153,26,0.25)]',
    ACT:
      'text-[rgb(154,84,2)] bg-[rgba(217,119,6,0.08)] border-[0.5px] border-[rgba(217,119,6,0.20)]',
  }
  return (
    map[contractType] ||
    'text-[rgb(115,107,97)] bg-[rgb(250,247,242)] border-[0.5px] border-[rgb(199,191,178)]'
  )
}

export const avatarBadgeClass = (contractType: string): string => {
  const map: Record<string, string> = {
    Fornecedor: 'bg-[rgba(51,178,102,0.15)] text-[rgb(28,121,67)]',
    Colaborador: 'bg-[rgb(199,229,242)] text-[rgb(26,112,140)]',
    Financiador: 'bg-[rgb(255,247,224)] text-[rgb(217,153,26)]',
    ACT: 'bg-[rgba(217,119,6,0.10)] text-[rgb(154,84,2)]',
  }
  return map[contractType] || 'bg-[rgb(232,245,250)] text-[rgb(26,112,140)]'
}

export function programaShort(name: string | undefined): string {
  if (!name) return '—'
  const parts = name.split(' — ')
  if (parts.length > 1) return parts[0] ?? name
  const words = name.split(' ')
  if (words.length === 1) return name.slice(0, 4).toUpperCase()
  const sigla = words
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 5)
  return sigla || name.slice(0, 4).toUpperCase()
}
