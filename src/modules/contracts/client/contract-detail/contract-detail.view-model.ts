import type { Contract } from '#modules/contracts/client/data/model/contracts.model.ts'
import { formatDate } from '#modules/contracts/client/domain/format.ts'
import { contractDetailQueryOptions } from './contract-detail.query.ts'

const DAY_MS = 1000 * 60 * 60 * 24

/** Derivação pura da barra de Vigência — recebe `now` (não cria relógio no render; ver C1). */
export type VigenciaView = Readonly<{
  startLabel: string
  endLabel: string
  todayLabel: string
  progressPercent: number
  daysRemaining: number
  nearExpiry: boolean
}>

export const deriveVigencia = (contract: Contract, now: Date): VigenciaView => {
  const startDate = contract.currentPeriod?.start ?? contract.originalPeriod.start
  const endDate = contract.currentPeriod?.end ?? contract.originalPeriod.end
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS))
  const elapsedDays = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / DAY_MS))
  const progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / DAY_MS)
  return {
    startLabel: formatDate(startDate),
    endLabel: formatDate(endDate),
    todayLabel: formatDate(now),
    progressPercent,
    daysRemaining,
    nearExpiry: daysRemaining <= 45 && daysRemaining > 0,
  }
}

export const contractDetailViewModel = {
  query: contractDetailQueryOptions,
  deriveVigencia,
}
