/**
 * DashboardPage — BINDING (§XI) do Dashboard "Resumo Mensal". Reúne o server-state (TanStack Query) e ramifica
 * os estados; a apresentação é 100% da view burra `DashboardContent`.
 *  - `useDashboardStatistics()` (052): o DTO composto pelo BFF (4 métricas + gráfico + donut + fornecedores);
 *  - `useRecentPayments()` (042): o widget "Últimos pagamentos" (dados reais);
 *  - anima a entrada das barras de compliance após o mount (SSR-safe).
 * loading/erro tratados AQUI; em `ready` renderiza o `DashboardContent` (idêntico ao legado). i18n PT via `t`.
 */
import { useEffect, useState } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { header, headText, headTitle, headSubtitle } from '#shared/ui/brand/brand-page.css.ts'

import { useDashboardStatistics } from '../dashboard-statistics.binding.ts'
import { useRecentPayments } from '../recent-payments.binding.ts'
import { DashboardContent } from './dashboard-content.component.tsx'
import { page, stateMessage } from './dashboard.css.ts'

const t = createTranslator(ptBR)

export function DashboardPage() {
  const stats = useDashboardStatistics()
  const recent = useRecentPayments()

  // Animação de entrada das barras (largura cresce após o mount). SSR-safe: começa false, vira true no client.
  const [animateBars, setAnimateBars] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setAnimateBars(true)
    })
    return () => {
      cancelAnimationFrame(id)
    }
  }, [])

  return (
    <div className={page}>
      <div className={header}>
        <div className={headText}>
          <h1 className={headTitle}>{t('dashboard.title')}</h1>
          <p className={headSubtitle}>{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {stats.status === 'loading' ? (
        <p className={stateMessage}>{t('dashboard.state.loading')}</p>
      ) : stats.status !== 'ready' || stats.data === null ? (
        <p className={stateMessage}>{t('dashboard.state.error')}</p>
      ) : (
        <DashboardContent data={stats.data} recent={recent} animate={animateBars} />
      )}
    </div>
  )
}
