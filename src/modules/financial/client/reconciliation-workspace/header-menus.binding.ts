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

/** ISO `YYYY-MM-DD` → `DD/MM/YYYY` (sem `Date` — evita recuo de fuso). Vazio → ''. PURA. */
const fmtBR = (iso: string): string => {
  const p = iso.split('-')
  return p.length === 3 ? `${p[2] ?? ''}/${p[1] ?? ''}/${p[0] ?? ''}` : ''
}

/** Rótulo do intervalo personalizado (Personalizado): "DD/MM/AAAA – DD/MM/AAAA". `null` se ambos vazios. */
export const formatCustomRange = (start: string, end: string): string | null => {
  if (start === '' && end === '') return null
  return `${fmtBR(start) || '…'} – ${fmtBR(end) || '…'}`
}

/** Data local → ISO `YYYY-MM-DD` (sem UTC, evita recuo de fuso). PURA. */
const isoLocal = (d: Date): string =>
  `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * Resolve o preset (+ datas do personalizado) em um intervalo `from`/`to` (ISO date-only) p/ o extrato por
 * período (#205). `custom` sem ambas as datas → null (não busca). `now` injetado → PURA/testável.
 */
export const resolvePeriodRange = (
  preset: PeriodPreset,
  customStart: string,
  customEnd: string,
  now: Date,
): Readonly<{ from: string; to: string }> | null => {
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (preset) {
    case 'today':
      return { from: isoLocal(now), to: isoLocal(now) }
    case 'yesterday': {
      const d = shiftDays(now, -1)
      return { from: isoLocal(d), to: isoLocal(d) }
    }
    case 'last7':
      return { from: isoLocal(shiftDays(now, -6)), to: isoLocal(now) }
    case 'month':
      return { from: isoLocal(new Date(y, m, 1)), to: isoLocal(new Date(y, m + 1, 0)) }
    case 'lastMonth':
      return { from: isoLocal(new Date(y, m - 1, 1)), to: isoLocal(new Date(y, m, 0)) }
    case 'quarter': {
      const q = Math.floor(m / 3) * 3
      return { from: isoLocal(new Date(y, q, 1)), to: isoLocal(new Date(y, q + 3, 0)) }
    }
    case 'custom':
      return customStart !== '' && customEnd !== '' ? { from: customStart, to: customEnd } : null
    default: {
      const _exhaustive: never = preset
      return _exhaustive
    }
  }
}

export type HeaderMenusBinding = Readonly<{
  periodOpen: boolean
  exportOpen: boolean
  /** Dropdown de ações de período no footer (Fechar/Abrir período). */
  periodActionsOpen: boolean
  period: PeriodPreset
  periodOptions: readonly PeriodOption[]
  // Intervalo personalizado (preset 'custom') — datas ISO YYYY-MM-DD; `customLabel` = rótulo exibível.
  customStart: string
  customEnd: string
  customLabel: string | null
  togglePeriod: () => void
  toggleExport: () => void
  togglePeriodActions: () => void
  closeAll: () => void
  selectPeriod: (p: PeriodPreset) => void
  setCustomStart: (v: string) => void
  setCustomEnd: (v: string) => void
}>

export function useHeaderMenus(): HeaderMenusBinding {
  const [now] = useState(() => new Date())
  const [periodOpen, setPeriodOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [periodActionsOpen, setPeriodActionsOpen] = useState(false)
  const [period, setPeriod] = useState<PeriodPreset>('last7')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  return {
    periodOpen,
    exportOpen,
    periodActionsOpen,
    period,
    periodOptions: buildPeriodOptions(now),
    customStart,
    customEnd,
    customLabel: formatCustomRange(customStart, customEnd),
    togglePeriod: () => {
      setExportOpen(false)
      setPeriodActionsOpen(false)
      setPeriodOpen((v) => !v)
    },
    toggleExport: () => {
      setPeriodOpen(false)
      setPeriodActionsOpen(false)
      setExportOpen((v) => !v)
    },
    togglePeriodActions: () => {
      setPeriodOpen(false)
      setExportOpen(false)
      setPeriodActionsOpen((v) => !v)
    },
    closeAll: () => {
      setPeriodOpen(false)
      setExportOpen(false)
      setPeriodActionsOpen(false)
    },
    selectPeriod: (p) => {
      setPeriod(p)
      // 'Personalizado' mantém o menu aberto p/ o usuário escolher as datas no calendário; os demais fecham.
      if (p !== 'custom') setPeriodOpen(false)
    },
    setCustomStart: (v) => {
      setCustomStart(v)
      setPeriod('custom')
    },
    setCustomEnd: (v) => {
      setCustomEnd(v)
      setPeriod('custom')
    },
  }
}
