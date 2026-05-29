import type { ContractRow } from './types'

export type DerivedStatus = {
  label: string
  key: string
}

export function deriveStatus(data: Partial<ContractRow>, hasChildren: boolean): DerivedStatus {
  // Prioridade 0: respeitar o contractStatus persistido pelo backend quando explícito
  if (data.contractStatus === 'Vigente') {
    return { label: 'EM ANDAMENTO', key: 'em-andamento' }
  }
  if (data.contractStatus === 'Pendente') {
    return { label: 'PENDENTE', key: 'pendente' }
  }
  if (data.contractStatus === 'Encerrado') {
    return { label: 'FINALIZADO', key: 'finalizado' }
  }
  if (data.contractStatus === 'Distrato') {
    return { label: 'DISTRATO', key: 'distrato' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = data.contractPeriod?.start ? new Date(data.contractPeriod.start) : null
  const end = data.contractPeriod?.end ? new Date(data.contractPeriod.end) : null

  // 1. Distrato — verifica status persistido OU aditivo de distrato homologado nos children
  const hasDistratoChild = (data.children || []).some(
    (c: any) => c.aditivoType === 'distrato' && c.aditivoStatus === 'Homologado',
  )
  const isDistratoAditivo =
    (data as any).aditivoType === 'distrato' && (data as any).aditivoStatus === 'Homologado'
  if ((data as any).withdrawalUrl || isDistratoAditivo || hasDistratoChild) {
    return { label: 'DISTRATO', key: 'distrato' }
  }

  // 2. Pendente — arquivo assinado não foi inserido
  const isAditivo = !!(data as any).parentId || !!(data as any).aditivoType
  const isHomologado = (data as any).aditivoStatus === 'Homologado'
  if (!(data as any).signedContractUrl && !(isAditivo && isHomologado)) {
    return { label: 'PENDENTE', key: 'pendente' }
  }

  // 3. Em Andamento — dentro do período de vigência
  if (start) {
    const hasValidEnd = end && today <= end
    if (hasValidEnd && today >= start) {
      return { label: 'EM ANDAMENTO', key: 'em-andamento' }
    }
  }

  // 4. Finalizado — vigência encerrou
  if (end && today > end) {
    return { label: 'FINALIZADO', key: 'finalizado' }
  }

  return { label: 'EM ANDAMENTO', key: 'em-andamento' }
}

export function getMostRecentChild(row: ContractRow): ContractRow {
  if (row.children && row.children.length > 0) {
    const sorted = [...row.children].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return sorted[0]
  }
  return row
}

export const STATUS_OPTIONS: { key: string; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'em-andamento', label: 'Em Andamento' },
  { key: 'pendente', label: 'Pendente' },
  { key: 'finalizado', label: 'Finalizado' },
  { key: 'distrato', label: 'Distrato' },
  { key: 'vencendo', label: 'Vencendo' },
]

export const statusBadgeClass = (key: string): string => {
  const map: Record<string, string> = {
    'em-andamento': 'text-[#176642] bg-[rgba(31,125,85,0.10)]',
    pendente: 'text-[#9a5402] bg-[rgba(217,119,6,0.08)]',
    finalizado: 'text-[#332e29] bg-[rgb(242,237,229)] border-[0.5px] border-[#e5ded4]',
    distrato: 'text-[rgb(168,47,36)] bg-[rgba(229,77,64,0.08)]',
    cancelado: 'text-[rgb(168,47,36)] bg-[rgba(229,77,64,0.08)]',
  }
  return map[key] || map['em-andamento']
}

export const tipoBadgeClass = (contractType: string): string => {
  const map: Record<string, string> = {
    // green — padrão modal "valor"
    Fornecedor:
      'text-[rgb(28,121,67)] bg-[rgba(51,178,102,0.10)] border-[0.5px] border-[rgba(51,178,102,0.20)]',
    // teal — padrão modal "prazo" / mockup "parc"
    Colaborador:
      'text-[rgb(26,112,140)] bg-[rgb(232,245,250)] border-[0.5px] border-[rgb(140,199,222)]',
    // amber — padrão mockup "cons"
    Financiador:
      'text-[rgb(217,153,26)] bg-[rgb(255,247,224)] border-[0.5px] border-[rgba(217,153,26,0.25)]',
    // orange — padrão modal "escopo" / mockup "loc"
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
    // green — padrão modal "valor"
    Fornecedor: 'bg-[rgba(51,178,102,0.15)] text-[rgb(28,121,67)]',
    // teal — padrão modal "prazo"
    Colaborador: 'bg-[rgb(199,229,242)] text-[rgb(26,112,140)]',
    // amber — padrão mockup "cons"
    Financiador: 'bg-[rgb(255,247,224)] text-[rgb(217,153,26)]',
    // orange — padrão modal "escopo"
    ACT: 'bg-[rgba(217,119,6,0.10)] text-[rgb(154,84,2)]',
  }
  return map[contractType] || 'bg-[rgb(232,245,250)] text-[rgb(26,112,140)]'
}

export function programaShort(name: string | undefined): string {
  if (!name) return '—'
  const parts = name.split(' — ')
  if (parts.length > 1) return parts[0]
  const words = name.split(' ')
  if (words.length === 1) return name.slice(0, 4).toUpperCase()
  const sigla = words
    .filter((w) => w[0] === w[0]?.toUpperCase())
    .map((w) => w[0])
    .join('')
    .slice(0, 5)
  return sigla || name.slice(0, 4).toUpperCase()
}
