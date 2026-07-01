/**
 * MetricCard — view BURRA (§XI): recebe tudo por props e só apresenta. Card branco com rótulo pequeno
 * em cima, valor grande, linha de tendência ("↑ 0% · legenda") e ícone dentro de um círculo colorido à
 * direita. Reusável pelos 4 cards da linha 1. A cor de acento é uma CLASSE de token (styleVariants) —
 * a view NÃO importa `vars` (§boundaries: client-ui ↛ ds-tokens). O ícone herda a cor via currentColor.
 * i18n via `t` (nada hardcoded).
 */
import type { ReactNode } from 'react'

import {
  ArrowUpIcon,
  WalletIcon,
  TrendingUpIcon,
  HeartHandshakeIcon,
  UsersIcon,
  type IconComponent,
} from '#shared/ui/icons/index.ts'

import type { MetricAccent, MetricIconName } from '../dashboard-summary.view-model.ts'
import {
  iconAccent,
  card,
  body,
  label,
  value,
  trendRow,
  trendArrow,
  trendPercent as trendPercentClass,
  trendLabel,
  iconCircle,
} from './metric-card.css.ts'

// Ícone semântico → componente de ícone (#shared/ui/icons é `shared-ui`, permitido p/ client-ui).
const ICON: Readonly<Record<MetricIconName, IconComponent>> = {
  wallet: WalletIcon,
  'trending-up': TrendingUpIcon,
  'heart-handshake': HeartHandshakeIcon,
  users: UsersIcon,
}

export type MetricCardProps = Readonly<{
  label: string
  value: string
  trendPercent: string
  trendLabel: string
  accent: MetricAccent
  icon: MetricIconName
}>

export function MetricCard(props: MetricCardProps): ReactNode {
  const Icon = ICON[props.icon]
  return (
    <section className={card} aria-label={props.label}>
      <div className={body}>
        <p className={label}>{props.label}</p>
        <p className={value}>{props.value}</p>
        <p className={trendRow}>
          <span className={trendArrow} aria-hidden>
            <ArrowUpIcon size={14} />
          </span>
          <span className={trendPercentClass}>{props.trendPercent}</span>
          <span className={trendLabel}>{props.trendLabel}</span>
        </p>
      </div>
      <span className={`${iconCircle} ${iconAccent[props.accent]}`} aria-hidden>
        <Icon size={26} />
      </span>
    </section>
  )
}
