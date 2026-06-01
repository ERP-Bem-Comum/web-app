import type { ReactNode } from 'react'

import { card, type CardElevation } from './card.css.ts'

/**
 * Card (átomo) — BURRO: superfície (fundo + radius + sombra + padding) por token.
 * Polimórfico via `as` ('div' | 'section', default 'div'). `elevation` escolhe a elevação:
 * 'card' (base, default) ou 'elevated' (borda + sombra em camadas p/ fundo de baixo contraste).
 * Não fixa largura — quem limita é o consumidor.
 */
export type CardProps = Readonly<{
  children: ReactNode
  as?: 'div' | 'section'
  elevation?: CardElevation
}>

export function Card(props: CardProps): ReactNode {
  const Tag = props.as ?? 'div'

  return <Tag className={card[props.elevation ?? 'card']}>{props.children}</Tag>
}
