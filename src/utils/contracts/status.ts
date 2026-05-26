import { Children, ContractRow } from '@/types/contracts'

export type DerivedStatus = {
  label: string
  key: string
}

export const deriveStatus = (data: Children, hasChildren: boolean): DerivedStatus => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = data.contractPeriod?.start
    ? new Date(data.contractPeriod.start)
    : null
  const end = data.contractPeriod?.end
    ? new Date(data.contractPeriod.end)
    : null

  // 0. Rascunho — contrato ainda não finalizado pelo usuário
  if (data.contractStatus === 'Rascunho') {
    return { label: 'RASCUNHO', key: 'rascunho' }
  }

  // 1. Distrato — status explícito, termo de rescisão ou aditivo de distrato homologado
  const isDistratoAditivo =
    (data as any).aditivoType === 'distrato' && (data as any).aditivoStatus === 'Homologado'
  if (data.contractStatus === 'Distrato' || data.withdrawalUrl || isDistratoAditivo) {
    return { label: 'DISTRATO', key: 'distrato' }
  }

  // 2. Pendente — arquivo assinado não foi inserido
  // Aditivos homologados sem URL própria herdam o status de assinado do contrato base
  const isAditivo = !!(data as any).parentId || !!(data as any).aditivoType
  const isHomologado = (data as any).aditivoStatus === 'Homologado'
  if (!data.signedContractUrl && !(isAditivo && isHomologado)) {
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

  // Fallback
  return { label: 'EM ANDAMENTO', key: 'em-andamento' }
}

export const getMostRecentChild = (row: ContractRow): Children => {
  if (row.children && row.children.length > 0) {
    return row.children.sort((a, b) => b.id - a.id)[0]
  }
  return row
}
