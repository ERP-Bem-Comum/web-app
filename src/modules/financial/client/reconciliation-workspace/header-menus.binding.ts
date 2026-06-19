/**
 * useHeaderMenus — controller dos dropdowns do header/footer (Período e Exportar). UI-state puro de
 * abertura + preset de período selecionado. As datas dos presets são calculadas a partir de `new Date()`
 * (adapter, client-only). Período é display-only (filtro por intervalo é refinamento futuro). A AÇÃO de
 * Exportar vive em `export-conciliacao.binding.ts` (#173); aqui só o abrir/fechar do dropdown. Sem I/O.
 */
import { useState } from 'react'

export type PeriodPreset = 'today' | 'yesterday' | 'last7' | 'month' | 'lastMonth' | 'quarter' | 'custom'

export type PeriodOption = Readonly<{ preset: PeriodPreset; labelTag: string; meta: string }>

const MABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const
const MLONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

const shiftDays = (d: Date, n: number): Date => {
  const r = new Date(d)
  r.setDate(d.getDate() + n)
  return r
}
const dm = (d: Date): string => `${String(d.getDate())} ${MABBR[d.getMonth()] ?? ''}`
const range7 = (now: Date): string => {
  const start = shiftDays(now, -6)
  return start.getMonth() === now.getMonth()
    ? `${String(start.getDate())}–${String(now.getDate())} ${MABBR[now.getMonth()] ?? ''}`
    : `${dm(start)}–${dm(now)}`
}

const buildPeriodOptions = (now: Date): readonly PeriodOption[] => {
  const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const qStart = Math.floor(now.getMonth() / 3) * 3
  const yy = String(now.getFullYear()).slice(-2)
  return [
    { preset: 'today', labelTag: 'financial.recon.period.today', meta: dm(now) },
    { preset: 'yesterday', labelTag: 'financial.recon.period.yesterday', meta: dm(shiftDays(now, -1)) },
    { preset: 'last7', labelTag: 'financial.recon.period.last7', meta: range7(now) },
    {
      preset: 'month',
      labelTag: 'financial.recon.period.month',
      meta: `${MLONG[now.getMonth()] ?? ''}/${String(now.getFullYear())}`,
    },
    {
      preset: 'lastMonth',
      labelTag: 'financial.recon.period.lastMonth',
      meta: `${MLONG[lastM.getMonth()] ?? ''}/${String(lastM.getFullYear())}`,
    },
    {
      preset: 'quarter',
      labelTag: 'financial.recon.period.quarter',
      meta: `${MABBR[qStart] ?? ''}–${MABBR[qStart + 2] ?? ''}/${yy}`,
    },
    // 'custom' não tem meta de data — a view mostra a dica i18n ("data inicial → final").
    { preset: 'custom', labelTag: 'financial.recon.period.custom', meta: '' },
  ]
}

export type HeaderMenusBinding = Readonly<{
  periodOpen: boolean
  exportOpen: boolean
  period: PeriodPreset
  periodOptions: readonly PeriodOption[]
  togglePeriod: () => void
  toggleExport: () => void
  closeAll: () => void
  selectPeriod: (p: PeriodPreset) => void
}>

export function useHeaderMenus(): HeaderMenusBinding {
  const [now] = useState(() => new Date())
  const [periodOpen, setPeriodOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [period, setPeriod] = useState<PeriodPreset>('last7')

  return {
    periodOpen,
    exportOpen,
    period,
    periodOptions: buildPeriodOptions(now),
    togglePeriod: () => {
      setExportOpen(false)
      setPeriodOpen((v) => !v)
    },
    toggleExport: () => {
      setPeriodOpen(false)
      setExportOpen((v) => !v)
    },
    closeAll: () => {
      setPeriodOpen(false)
      setExportOpen(false)
    },
    selectPeriod: (p) => {
      setPeriod(p)
      setPeriodOpen(false)
    },
  }
}
