import type { ReactNode } from 'react'

import { card } from './card.css.ts'

/**
 * Card (átomo) — BURRO: superfície (fundo + radius + sombra + padding) por token.
 * Polimórfico via `as` ('div' | 'section', default 'div'). Não fixa largura — quem
 * limita é o consumidor (layout do login, próxima spec).
 */
export type CardProps = Readonly<{
  children: ReactNode
  as?: 'div' | 'section'
}>

export function Card(props: CardProps): ReactNode {
  const Tag = props.as ?? 'div'

  return <Tag className={card}>{props.children}</Tag>
}
