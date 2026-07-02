/**
 * CalculandoGastos — view do modal full-screen (US2.4b). Navega Centro (abas) → Categoria → Subcategoria
 * e edita os 12 meses (Despesas). Estado de EDIÇÃO do input é UI-state local (efêmero, como o accordion
 * da matriz); o resto chega pronto pelo binding. O total é derivado; "Calcular" aplica a edição pendente.
 */
import { useState, type ReactNode } from 'react'

import { EditIcon, TrashIcon, CalculatorIcon } from '#shared/ui/index.ts'

import type { CalcGastosBinding } from './calc-gastos.binding.ts'
import {
  overlay,
  panel,
  header,
  headerTitle,
  closeButton,
  tabsBar,
  tabsScroll,
  tab,
  tabActive,
  navButton,
  columns,
  column,
  columnTitle,
  list,
  item,
  itemActive,
  chevron,
  despesaRow,
  despesaName,
  despesaEnd,
  despesaValue,
  despesaInput,
  iconButton,
  calcularButton,
  empty,
} from './calculando-gastos.css.ts'

export type CalculandoGastosLabels = Readonly<{
  titlePrefix: string
  close: string
  prevCentro: string
  nextCentro: string
  categoria: string
  subcategoria: string
  despesas: string
  calcular: string
  editValue: string
  clearValue: string
  empty: string
}>

export type CalculandoGastosProps = Readonly<{
  title: string
  binding: CalcGastosBinding
  labels: CalculandoGastosLabels
  onClose: () => void
}>

/** "34.336,73" / "34336.73" → centavos (front-first, tolerante). */
const parseCentsBR = (s: string): number => {
  const cleaned = s.replace(/[^\d,-]/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0
}

export function CalculandoGastos(props: CalculandoGastosProps): ReactNode {
  const { binding: b, labels } = props
  const [editing, setEditing] = useState<{ index: number; text: string } | null>(null)

  const commit = (): void => {
    if (editing !== null) {
      b.setMonthValue(editing.index, parseCentsBR(editing.text))
      setEditing(null)
    }
  }

  return (
    <div
      className={overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${labels.titlePrefix} ${props.title}`}
    >
      <div className={panel}>
        <div className={header}>
          <h2 className={headerTitle}>
            {labels.titlePrefix} {props.title}
          </h2>
          <button type="button" className={closeButton} aria-label={labels.close} onClick={props.onClose}>
            {'×'}
          </button>
        </div>

        <div className={tabsBar}>
          <button type="button" className={navButton} aria-label={labels.prevCentro} onClick={b.prevCentro}>
            {'‹'}
          </button>
          <div className={tabsScroll}>
            {b.centros.map((c) => (
              <button
                key={c.id}
                type="button"
                className={c.active ? `${tab} ${tabActive}` : tab}
                aria-pressed={c.active}
                onClick={() => {
                  b.setCentro(c.id)
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <button type="button" className={navButton} aria-label={labels.nextCentro} onClick={b.nextCentro}>
            {'›'}
          </button>
        </div>

        <div className={columns}>
          <div className={column}>
            <h3 className={columnTitle}>{labels.categoria}</h3>
            <div className={list}>
              {b.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={c.active ? `${item} ${itemActive}` : item}
                  onClick={() => {
                    b.setCategoria(c.id)
                  }}
                >
                  <span>{c.name}</span>
                  <span className={chevron} aria-hidden="true">
                    {'›'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={column}>
            <h3 className={columnTitle}>{labels.subcategoria}</h3>
            <div className={list}>
              {b.subCategories.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={s.active ? `${item} ${itemActive}` : item}
                  onClick={() => {
                    b.setSub(s.id)
                  }}
                >
                  <span>{s.name}</span>
                  <span className={chevron} aria-hidden="true">
                    {'›'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={column}>
            <h3 className={columnTitle}>{labels.despesas}</h3>
            {b.hasData ? (
              <>
                <div className={list}>
                  {b.despesas.map((d) => (
                    <div key={d.monthIndex} className={despesaRow}>
                      <span className={despesaName}>{d.name}</span>
                      <span className={despesaEnd}>
                        {editing !== null && editing.index === d.monthIndex ? (
                          <input
                            className={despesaInput}
                            inputMode="decimal"
                            value={editing.text}
                            onChange={(e) => {
                              setEditing({ index: d.monthIndex, text: e.target.value })
                            }}
                            onBlur={commit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commit()
                              if (e.key === 'Escape') setEditing(null)
                            }}
                          />
                        ) : (
                          <span className={despesaValue}>{d.label}</span>
                        )}
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={labels.editValue}
                          onClick={() => {
                            setEditing({ index: d.monthIndex, text: String(d.cents / 100) })
                          }}
                        >
                          <EditIcon size={14} />
                        </button>
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={labels.clearValue}
                          onClick={() => {
                            b.clearMonth(d.monthIndex)
                          }}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
                <button type="button" className={calcularButton} onClick={commit}>
                  <CalculatorIcon size={16} />
                  {labels.calcular}
                </button>
              </>
            ) : (
              <p className={empty}>{labels.empty}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
