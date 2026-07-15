/**
 * CalculandoGastos — view do modal "Calculando Gastos" (US2.4b) no padrão visual "brand". Overlay escuro + card
 * branco (largura cheia), abas por Tipo de lançamento, e 3 colunas (Categoria → Subcategoria → Despesas). A
 * edição de um mês (lápis) abre um DRAWER lateral direito com o form roteado pelo Tipo de lançamento; salvar/
 * descartar volta ao grid. Estado de EDIÇÃO é UI-state local (efêmero); o resto chega pronto pelo binding.
 */
import { useState, type ReactNode } from 'react'

import { EditIcon, TrashIcon, CalculatorIcon, InfoIcon } from '#shared/ui/index.ts'

import type { CalcGastosBinding } from './calc-gastos.binding.ts'
import { formatCentsBRL } from './calc-gastos.view-model.ts'
import { PessoalForm, type PessoalFormLabels } from './pessoal-form.component.tsx'
import { CaedForm, type CaedFormLabels } from './caed-form.component.tsx'
import { LogisticaForm, type LogisticaFormLabels } from './logistica-form.component.tsx'
import {
  configToPayload,
  caedToPayload,
  pessoalToPayload,
  logisticaToPayload,
} from './budget-result-command.view-model.ts'
import {
  overlay,
  panel,
  header,
  headerTitle,
  headerCrumb,
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
  itemName,
  chevron,
  despesaRow,
  despesaName,
  despesaEnd,
  despesaValue,
  despesaValueZero,
  iconButton,
  iconButtonEdit,
  iconButtonDel,
  empty,
  modalFoot,
  applyButton,
  cancelButton,
  drawerOverlay,
  drawer,
  drawerHead,
  drawerHeadInfo,
  drawerHeadTitle,
  drawerClose,
  drawerBody,
  drawerFoot,
  configForm,
  configSection,
  configSectionTitle,
  field,
  fieldLabel,
  fieldControl,
  fieldInput,
  totalBox,
  checkRow,
  checkbox,
  confirmOverlay,
  confirmDialog,
  confirmTitle,
  confirmBody,
  confirmFooter,
  confirmKeep,
  confirmDiscard as confirmDiscardButton,
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
  pessoal: PessoalFormLabels
  caed: CaedFormLabels
  logistica: LogisticaFormLabels
  discardTitle: string
  discardBody: string
  discardKeep: string
  discardConfirm: string
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
  // Forms específicos por Tipo de lançamento (US2.4c/d) — também abrem pelo lápis, agora num DRAWER lateral.
  // Só um fica aberto por vez.
  const [pessoalOpen, setPessoalOpen] = useState(false)
  const [caedOpen, setCaedOpen] = useState(false)
  const [logisticaOpen, setLogisticaOpen] = useState(false)
  // "Descartar" nos forms específicos remonta o form (limpa os campos) via key.
  const [pessoalResetKey, setPessoalResetKey] = useState(0)
  // Modal de confirmação de descarte (Cancelar/Descartar com edição não salva).
  const [confirmOpen, setConfirmOpen] = useState(false)

  const drawerOpen = form !== null || pessoalOpen || caedOpen || logisticaOpen

  // Trocar de centro/categoria/subcategoria fecha qualquer form aberto (evita form "órfão").
  const closeForms = (): void => {
    setForm(null)
    setPessoalOpen(false)
    setCaedOpen(false)
    setLogisticaOpen(false)
    setConfirmOpen(false)
  }
  const selectCentro = (id: number): void => {
    closeForms()
    b.setCentro(id)
  }
  const selectCategoria = (id: number): void => {
    closeForms()
    b.setCategoria(id)
  }
  const selectSub = (id: number): void => {
    closeForms()
    b.setSub(id)
  }

  // Lápis: roteia o form pelo Tipo de lançamento da subcategoria ativa; IPCA (Tipo B) = form "Configuração".
  const openPencil = (monthIndex: number, cents: number): void => {
    switch (b.activeReleaseType) {
      case 'DESPESAS_PESSOAIS':
        setPessoalOpen(true)
        break
      case 'CAED':
        setCaedOpen(true)
        break
      case 'DESPESAS_LOGISTICAS':
        setLogisticaOpen(true)
        break
      case 'IPCA':
      default:
        openForm(monthIndex, cents)
        break
    }
  }

  // Cancelar/Descartar pede confirmação; só descarta de fato ao confirmar.
  const requestDiscard = (): void => {
    setConfirmOpen(true)
  }
  const confirmDiscardYes = (): void => {
    setForm(null)
    setPessoalOpen(false)
    setCaedOpen(false)
    setLogisticaOpen(false)
    setPessoalResetKey((k) => k + 1)
    setConfirmOpen(false)
  }

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
    // O form geral É o modelo IPCA (total × (1 + ipca/100)) — grava como tal.
    b.saveCalc(configToPayload({ total: form.total, ipca: form.ipca }), [...form.months], custoTotalCents)
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
            {labels.titlePrefix} <span className={headerCrumb}>· {props.title}</span>
          </h2>
          <button type="button" className={closeButton} aria-label={labels.close} onClick={props.onClose}>
            {'×'}
          </button>
        </div>

        <div className={tabsBar}>
          <button
            type="button"
            className={navButton}
            aria-label={labels.prevCentro}
            onClick={() => {
              closeForms()
              b.prevCentro()
            }}
          >
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
                  selectCentro(c.id)
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={navButton}
            aria-label={labels.nextCentro}
            onClick={() => {
              closeForms()
              b.nextCentro()
            }}
          >
            {'›'}
          </button>
        </div>

        <div className={columns}>
          <div className={column}>
            <div className={columnHead}>
              <h3 className={columnTitle}>{labels.categoria}</h3>
            </div>
            <div className={list}>
              {b.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={c.active ? `${item} ${itemActive}` : item}
                  onClick={() => {
                    selectCategoria(c.id)
                  }}
                >
                  <span className={itemName}>{c.name}</span>
                  <span className={chevron} aria-hidden="true">
                    {'›'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={column}>
            <div className={columnHead}>
              <h3 className={columnTitle}>{labels.subcategoria}</h3>
            </div>
            <div className={list}>
              {b.subCategories.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={s.active ? `${item} ${itemActive}` : item}
                  onClick={() => {
                    selectSub(s.id)
                  }}
                >
                  <span className={itemName}>{s.name}</span>
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
            ) : (
              <div className={list}>
                {b.despesas.map((d) => (
                  <div key={d.monthIndex} className={despesaRow}>
                    <span className={despesaName}>{d.name}</span>
                    <span className={despesaEnd}>
                      <span className={d.cents > 0 ? despesaValue : `${despesaValue} ${despesaValueZero}`}>
                        {d.label}
                      </span>
                      <button
                        type="button"
                        className={`${iconButton} ${iconButtonDel}`}
                        aria-label={labels.clearValue}
                        onClick={() => {
                          b.clearMonth(d.monthIndex)
                        }}
                      >
                        <TrashIcon size={16} />
                      </button>
                      <button
                        type="button"
                        className={`${iconButton} ${iconButtonEdit}`}
                        aria-label={labels.editValue}
                        onClick={() => {
                          openPencil(d.monthIndex, d.cents)
                        }}
                      >
                        <EditIcon size={16} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={modalFoot}>
          <button type="button" className={applyButton} onClick={applyForm} disabled>
            <CalculatorIcon size={16} />
            {labels.calcular}
          </button>
        </div>
      </div>

      {drawerOpen ? (
        <>
          <div className={drawerOverlay} role="presentation" onClick={requestDiscard} />
          <aside className={drawer} role="dialog" aria-modal="true" aria-label={labels.despesas}>
            <div className={drawerHead}>
              <span className={drawerHeadInfo} aria-hidden="true">
                <InfoIcon size={18} />
              </span>
              <h3 className={drawerHeadTitle}>{labels.despesas}</h3>
              <button
                type="button"
                className={drawerClose}
                aria-label={labels.close}
                onClick={requestDiscard}
              >
                {'×'}
              </button>
            </div>

            {pessoalOpen ? (
              <PessoalForm
                key={pessoalResetKey}
                labels={labels.pessoal}
                initialSalarioCents={b.despesas.find((d) => d.cents > 0)?.cents ?? 0}
                initialMeses={b.despesas.filter((d) => d.cents > 0).map((d) => d.monthIndex)}
                monthAbbrevs={b.despesas.map((d) => d.name.slice(0, 3))}
                formatCents={formatCentsBRL}
                onDescartar={requestDiscard}
                onSalvar={(custoMensalCents, meses, form) => {
                  // GRAVA (um POST por mês) — o `saveCalc` já aplica o eco otimista na grade.
                  b.saveCalc(pessoalToPayload(form), [...meses], custoMensalCents)
                  setPessoalOpen(false)
                }}
              />
            ) : caedOpen ? (
              <CaedForm
                key={pessoalResetKey}
                labels={labels.caed}
                initialMeses={b.despesas.filter((d) => d.cents > 0).map((d) => d.monthIndex)}
                monthAbbrevs={b.despesas.map((d) => d.name.slice(0, 3))}
                formatCents={formatCentsBRL}
                onDescartar={requestDiscard}
                onSalvar={(custoMensalCents, meses, form) => {
                  // GRAVA (um POST por mês) — o `saveCalc` já aplica o eco otimista na grade.
                  b.saveCalc(caedToPayload(form), [...meses], custoMensalCents)
                  setCaedOpen(false)
                }}
              />
            ) : logisticaOpen ? (
              <LogisticaForm
                key={pessoalResetKey}
                labels={labels.logistica}
                initialMeses={b.despesas.filter((d) => d.cents > 0).map((d) => d.monthIndex)}
                monthAbbrevs={b.despesas.map((d) => d.name.slice(0, 3))}
                formatCents={formatCentsBRL}
                onDescartar={requestDiscard}
                onSalvar={(custoMensalCents, meses, form) => {
                  // GRAVA (um POST por mês) — o `saveCalc` já aplica o eco otimista na grade.
                  b.saveCalc(logisticaToPayload(form), [...meses], custoMensalCents)
                  setLogisticaOpen(false)
                }}
              />
            ) : form !== null ? (
              <>
                <div className={drawerBody}>
                  <div className={configForm}>
                    <div className={configSection}>
                      <h4 className={configSectionTitle}>{labels.config}</h4>
                      <label className={checkRow}>
                        <input
                          type="checkbox"
                          className={checkbox}
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
                        <div className={fieldControl}>
                          <input
                            className={fieldInput}
                            inputMode="decimal"
                            value={form.total}
                            onChange={(e) => {
                              setForm({ ...form, total: e.target.value })
                            }}
                          />
                        </div>
                      </label>
                      <label className={field}>
                        <span className={fieldLabel}>{labels.justificativa}</span>
                        <div className={fieldControl}>
                          <input
                            className={fieldInput}
                            value={form.justificativa}
                            onChange={(e) => {
                              setForm({ ...form, justificativa: e.target.value })
                            }}
                          />
                        </div>
                      </label>
                      <label className={field}>
                        <span className={fieldLabel}>{labels.ipca}</span>
                        <div className={fieldControl}>
                          <input
                            className={fieldInput}
                            inputMode="decimal"
                            value={form.ipca}
                            onChange={(e) => {
                              setForm({ ...form, ipca: e.target.value })
                            }}
                          />
                        </div>
                      </label>
                      <div className={totalBox}>{formatCentsBRL(custoTotalCents)}</div>
                    </div>

                    <div className={configSection}>
                      <h4 className={configSectionTitle}>{labels.aplicarMeses}</h4>
                      <label className={checkRow}>
                        <input
                          type="checkbox"
                          className={checkbox}
                          checked={form.months.size === b.despesas.length}
                          onChange={toggleAllMonths}
                        />
                        {labels.todos}
                      </label>
                      {b.despesas.map((d) => (
                        <label key={d.monthIndex} className={checkRow}>
                          <input
                            type="checkbox"
                            className={checkbox}
                            checked={form.months.has(d.monthIndex)}
                            onChange={() => {
                              toggleMonth(d.monthIndex)
                            }}
                          />
                          {d.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={drawerFoot}>
                  <button type="button" className={cancelButton} onClick={requestDiscard}>
                    {labels.cancelar}
                  </button>
                  <button type="button" className={applyButton} onClick={applyForm}>
                    {labels.aplicar}
                  </button>
                </div>
              </>
            ) : null}
          </aside>
        </>
      ) : null}

      {confirmOpen ? (
        <div className={confirmOverlay} role="presentation">
          <div
            className={confirmDialog}
            role="alertdialog"
            aria-modal="true"
            aria-label={labels.discardTitle}
          >
            <h3 className={confirmTitle}>{labels.discardTitle}</h3>
            <p className={confirmBody}>{labels.discardBody}</p>
            <div className={confirmFooter}>
              <button
                type="button"
                className={confirmKeep}
                onClick={() => {
                  setConfirmOpen(false)
                }}
              >
                {labels.discardKeep}
              </button>
              <button type="button" className={confirmDiscardButton} onClick={confirmDiscardYes}>
                {labels.discardConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
