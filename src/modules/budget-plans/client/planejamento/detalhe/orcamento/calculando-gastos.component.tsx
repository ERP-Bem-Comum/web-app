/**
 * CalculandoGastos — view do modal full-screen (US2.4b). Navega Centro (abas) → Categoria → Subcategoria
 * e edita os 12 meses (Despesas). Estado de EDIÇÃO do input é UI-state local (efêmero, como o accordion
 * da matriz); o resto chega pronto pelo binding. O total é derivado; "Calcular" aplica a edição pendente.
 */
import { useState, type ReactNode } from 'react'

import { EditIcon, TrashIcon, CalculatorIcon, InfoIcon } from '#shared/ui/index.ts'

import type { CalcGastosBinding } from './calc-gastos.binding.ts'
import { formatCentsBRL } from './calc-gastos.view-model.ts'
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
  columnHead,
  infoButton,
  list,
  item,
  itemActive,
  chevron,
  despesaRow,
  despesaName,
  despesaEnd,
  despesaValue,
  iconButton,
  calcularButton,
  empty,
  configForm,
  configSection,
  configSectionTitle,
  switchRow,
  field,
  fieldLabel,
  fieldInput,
  custoTotalBox,
  checkRow,
  formActions,
  cancelButton,
  applyButton,
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
  info: string
  config: string
  usePreviousYear: string
  totalReajustado: string
  justificativa: string
  ipca: string
  custoTotal: string
  aplicarMeses: string
  todos: string
  aplicar: string
  cancelar: string
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

type FormState = Readonly<{
  months: ReadonlySet<number>
  total: string
  justificativa: string
  ipca: string
  usePrev: boolean
}>

export function CalculandoGastos(props: CalculandoGastosProps): ReactNode {
  const { binding: b, labels } = props
  // Form "Configuração" (tipo geral/Rede) que abre ao clicar no lápis — UI-state local.
  const [form, setForm] = useState<FormState | null>(null)

  const openForm = (monthIndex: number, cents: number): void => {
    setForm({
      months: new Set([monthIndex]),
      total: String(cents / 100),
      justificativa: '',
      ipca: '0',
      usePrev: false,
    })
  }

  const custoTotalCents =
    form === null
      ? 0
      : Math.round(parseCentsBR(form.total) * (1 + (Number(form.ipca.replace(',', '.')) || 0) / 100))

  const toggleMonth = (i: number): void => {
    setForm((f) => {
      if (f === null) return f
      const next = new Set(f.months)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return { ...f, months: next }
    })
  }

  const toggleAllMonths = (): void => {
    setForm((f) => {
      if (f === null) return f
      const all = f.months.size === b.despesas.length
      return { ...f, months: all ? new Set() : new Set(b.despesas.map((d) => d.monthIndex)) }
    })
  }

  const applyForm = (): void => {
    if (form === null) return
    b.applyToMonths([...form.months], custoTotalCents)
    setForm(null)
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
            <div className={columnHead}>
              <h3 className={columnTitle}>{labels.despesas}</h3>
              {b.hasData ? (
                <button type="button" className={infoButton} aria-label={labels.info}>
                  <InfoIcon size={16} />
                </button>
              ) : null}
            </div>

            {!b.hasData ? (
              <p className={empty}>{labels.empty}</p>
            ) : form !== null ? (
              <div className={configForm}>
                <div className={configSection}>
                  <span className={configSectionTitle}>{labels.config}</span>
                  <label className={switchRow}>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={form.usePrev}
                      onChange={() => {
                        setForm({ ...form, usePrev: !form.usePrev })
                      }}
                    />
                    {labels.usePreviousYear}
                  </label>
                  <label className={field}>
                    <span className={fieldLabel}>{labels.totalReajustado}</span>
                    <input
                      className={fieldInput}
                      inputMode="decimal"
                      value={form.total}
                      onChange={(e) => {
                        setForm({ ...form, total: e.target.value })
                      }}
                    />
                  </label>
                  <label className={field}>
                    <span className={fieldLabel}>{labels.justificativa}</span>
                    <input
                      className={fieldInput}
                      value={form.justificativa}
                      onChange={(e) => {
                        setForm({ ...form, justificativa: e.target.value })
                      }}
                    />
                  </label>
                  <label className={field}>
                    <span className={fieldLabel}>{labels.ipca}</span>
                    <input
                      className={fieldInput}
                      inputMode="decimal"
                      value={form.ipca}
                      onChange={(e) => {
                        setForm({ ...form, ipca: e.target.value })
                      }}
                    />
                  </label>
                  <div className={custoTotalBox}>{formatCentsBRL(custoTotalCents)}</div>
                </div>

                <div className={configSection}>
                  <span className={configSectionTitle}>{labels.aplicarMeses}</span>
                  <label className={checkRow}>
                    <input
                      type="checkbox"
                      checked={form.months.size === b.despesas.length}
                      onChange={toggleAllMonths}
                    />
                    {labels.todos}
                  </label>
                  {b.despesas.map((d) => (
                    <label key={d.monthIndex} className={checkRow}>
                      <input
                        type="checkbox"
                        checked={form.months.has(d.monthIndex)}
                        onChange={() => {
                          toggleMonth(d.monthIndex)
                        }}
                      />
                      {d.name}
                    </label>
                  ))}
                </div>

                <div className={formActions}>
                  <button
                    type="button"
                    className={cancelButton}
                    onClick={() => {
                      setForm(null)
                    }}
                  >
                    {labels.cancelar}
                  </button>
                  <button type="button" className={applyButton} onClick={applyForm}>
                    {labels.aplicar}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={list}>
                  {b.despesas.map((d) => (
                    <div key={d.monthIndex} className={despesaRow}>
                      <span className={despesaName}>{d.name}</span>
                      <span className={despesaEnd}>
                        <span className={despesaValue}>{d.label}</span>
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
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={labels.editValue}
                          onClick={() => {
                            openForm(d.monthIndex, d.cents)
                          }}
                        >
                          <EditIcon size={14} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
                <button type="button" className={calcularButton} onClick={applyForm} disabled>
                  <CalculatorIcon size={16} />
                  {labels.calcular}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
