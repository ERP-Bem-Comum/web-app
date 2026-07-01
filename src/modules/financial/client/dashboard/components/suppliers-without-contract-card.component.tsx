/**
 * SuppliersWithoutContractCard — view BURRA (§XI): card branco com título, lista (nome + valor) e botão
 * "Ver todas" de largura total, fiel ao legado. `items` são dados placeholder do view-model (ligar quando
 * houver endpoint). `onSeeAll` opcional (navegação futura). i18n via `t` (nada hardcoded).
 */
import type { ReactNode } from 'react'

import type { SupplierWithoutContract } from '../dashboard-summary.view-model.ts'
import {
  card,
  title,
  list,
  row,
  rowName,
  rowValue,
  seeAllButton,
} from './suppliers-without-contract-card.css.ts'

export type SuppliersWithoutContractCardProps = Readonly<{
  title: string
  seeAllLabel: string
  items: readonly SupplierWithoutContract[]
  onSeeAll?: () => void
}>

export function SuppliersWithoutContractCard(props: SuppliersWithoutContractCardProps): ReactNode {
  return (
    <section className={card} aria-label={props.title}>
      <h3 className={title}>{props.title}</h3>
      <ul className={list}>
        {props.items.map((s) => (
          <li key={s.id} className={row}>
            <span className={rowName}>{s.name}</span>
            <span className={rowValue}>{s.value}</span>
          </li>
        ))}
      </ul>
      <button type="button" className={seeAllButton} onClick={props.onSeeAll}>
        {props.seeAllLabel}
      </button>
    </section>
  )
}
