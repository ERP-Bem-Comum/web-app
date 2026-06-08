/**
 * AmendmentModal — modal de aditivo (réplica da wireframe). Dois modos:
 *  - 'create' : seleciona tipo + detalhes → cria aditivo Pendente (sem doc/assinatura, sem efeito).
 *  - 'attach' : clicado um aditivo Pendente → anexa o documento assinado (assinatura OBRIGATÓRIA),
 *               homologando o aditivo (passa a Homologado e tem efeito conforme o tipo).
 * View burra: usa o controller (create) internamente + estado local (attach). Estilo só-tokens.
 */
import type { ReactNode } from 'react'
import { useId, useState } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { useAmendmentFormController, type CreateAmendmentInput, type AmendmentType } from './amendment-form.controller.ts'
import * as s from './amendment-modal.css.ts'

const t = createTranslator(ptBR)

// Campo de valor como moeda: o usuário digita dígitos → tratados como CENTAVOS → exibe "R$ x.xxx,xx".
const centsToBRL = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const inputToCents = (raw: string): number => {
  const digits = raw.replace(/\D/g, '')
  return digits === '' ? 0 : Number(digits)
}

export type AmendmentForAttach = Readonly<{ id: string; type: AmendmentType; description: string }>

export interface AmendmentModalProps {
  readonly open: boolean
  readonly mode: 'create' | 'attach'
  readonly contractNumber: string
  readonly amendment?: AmendmentForAttach
  readonly onClose: () => void
  readonly onCreate: (input: CreateAmendmentInput) => void
  readonly onAttach: (args: Readonly<{ amendmentId: string; file: File; signedAt: string }>) => void
  readonly submitting: boolean
  readonly errorTag: string | null
}

const TYPES: readonly AmendmentType[] = ['prazo', 'valor', 'escopo', 'outro', 'distrato']

function TipoIcon({ type }: { type: AmendmentType }): ReactNode {
  const common = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'prazo':
      return <svg {...common}><rect x="2" y="3" width="12" height="11" rx="1.5" /><path d="M2 6h12M5 2v2M11 2v2" /></svg>
    case 'valor':
      return <svg {...common}><rect x="2" y="4" width="12" height="8" rx="1" /><circle cx="8" cy="8" r="1.6" /><path d="M4.5 8h.01M11.5 8h.01" /></svg>
    case 'escopo':
      return <svg {...common}><path d="M3 4h10M3 8h7M3 12h10" /></svg>
    case 'outro':
      return <svg {...common}><circle cx="4" cy="8" r="0.8" /><circle cx="8" cy="8" r="0.8" /><circle cx="12" cy="8" r="0.8" /></svg>
    case 'distrato':
      return <svg {...common}><path d="M4 2h5l3 3v9H4z" /><path d="M9 2v3h3" /><path d="M6.3 8.3l3.4 3.4M9.7 8.3l-3.4 3.4" /></svg>
  }
}

export function AmendmentModal({ open, mode, contractNumber, amendment, onClose, onCreate, onAttach, submitting, errorTag }: AmendmentModalProps): ReactNode {
  const { state, update, submit } = useAmendmentFormController(onCreate)
  const [file, setFile] = useState<File | null>(null)
  const [attachSignedAt, setAttachSignedAt] = useState('')
  const titleId = useId()

  if (!open) return null

  const isAttach = mode === 'attach'
  const selectedType: AmendmentType | null = isAttach ? (amendment?.type ?? null) : state.type
  const resumoText = amendment !== undefined && amendment.description !== '' ? amendment.description : '—'

  const canCreate =
    state.type !== null &&
    state.description.trim() !== '' && // core-api: AmendmentDescriptionRequired (422) p/ qualquer tipo
    (state.type !== 'prazo' || state.newEndDate !== '') &&
    (state.type !== 'valor' || state.impactValueCents > 0) && // core-api: AmendmentImpactValueZero (422)
    (state.type !== 'distrato' || state.terminationDate !== '') && // distrato exige data efetiva
    !submitting
  const canAttach = file !== null && attachSignedAt !== '' && !submitting

  const handleSubmit = (): void => {
    if (isAttach) {
      if (file !== null && amendment) onAttach({ amendmentId: amendment.id, file, signedAt: attachSignedAt })
    } else {
      submit()
    }
  }

  return (
    <dialog
      className={s.dialog}
      aria-labelledby={titleId}
      // showModal() entrega ESC + focus-trap + inert (A4). ref-callback abre ao montar; try/catch p/ jsdom.
      ref={(el) => {
        if (el !== null && !el.open) {
          // jsdom não implementa showModal() → fallback abre o dialog (open) p/ o conteúdo ficar acessível.
          try { el.showModal() } catch { el.open = true }
        }
      }}
      onCancel={(e) => { e.preventDefault(); onClose() }}
      onClick={(e) => { if (e.currentTarget === e.target) onClose() }}
    >
      <div className={s.content}>
        <div className={s.header}>
          <div className={s.headLeft}>
            <h3 className={s.title} id={titleId}>{isAttach ? 'Documento do Aditivo' : t('contracts.amendment.title')}</h3>
            <span className={s.autoNum}>{contractNumber}</span>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label={t('contracts.amendment.cancel')}>×</button>
        </div>

        <div className={s.body}>
          {/* Tipo */}
          <div>
            <div className={s.sectionLabel}>{t('contracts.amendment.field.type')}</div>
            <div className={s.tipoGrid}>
              {TYPES.map((type) => {
                const active = selectedType === type
                return (
                  <button
                    key={type}
                    type="button"
                    className={`${s.tipoCard} ${active ? s.tipoCardActiveTone[type] : ''}`}
                    disabled={isAttach}
                    onClick={() => { if (!isAttach) update('type', type) }}
                  >
                    <span className={`${s.tipoIcon} ${active ? s.tipoIconActiveTone[type] : ''}`}><TipoIcon type={type} /></span>
                    <span className={s.tipoName}>{t(`contracts.amendment.type.${type}`)}</span>
                    <span className={s.tipoDesc}>{t(`contracts.amendment.type.desc.${type}`)}</span>
                  </button>
                )
              })}
            </div>

            {!isAttach && state.type === 'prazo' && (
              <div className={`${s.condRow} ${s.condRowTone.prazo}`}>
                <div className={`${s.condHead} ${s.condHeadTone.prazo}`}>Detalhes do Prazo</div>
                <div className={s.field}>
                  <label className={s.label}>{t('contracts.amendment.field.newEndDate')}</label>
                  <input className={s.input} type="date" value={state.newEndDate} onChange={(e) => { update('newEndDate', e.target.value) }} />
                </div>
              </div>
            )}

            {!isAttach && state.type === 'distrato' && (
              <div className={`${s.condRow} ${s.condRowTone.distrato}`}>
                <div className={`${s.condHead} ${s.condHeadTone.distrato}`}>Detalhes do Distrato</div>
                <div className={s.field}>
                  <label className={s.label}>{t('contracts.amendment.field.terminationDate')} <span className={s.req}>*</span></label>
                  <input className={s.input} type="date" value={state.terminationDate} onChange={(e) => { update('terminationDate', e.target.value) }} />
                </div>
                <div className={s.distratoWarn}>⚠ {t('contracts.amendment.distrato.warning')}</div>
              </div>
            )}

            {!isAttach && state.type === 'valor' && (
              <div className={`${s.condRow} ${s.condRowTone.valor}`}>
                <div className={`${s.condHead} ${s.condHeadTone.valor}`}>Detalhes do Valor</div>
                <div className={s.fieldRow2}>
                  <div className={s.field}>
                    <label className={s.label}>{t('contracts.amendment.field.impact')}</label>
                    <div className={s.toggleBar}>
                      <button type="button" className={`${s.toggleButton} ${state.impactDirection === 'acrescimo' ? s.toggleButtonActive : ''}`} onClick={() => { update('impactDirection', 'acrescimo') }}>
                        {t('contracts.amendment.field.impact.acrescimo')}
                      </button>
                      <button type="button" className={`${s.toggleButton} ${state.impactDirection === 'supressao' ? s.toggleButtonActive : ''}`} onClick={() => { update('impactDirection', 'supressao') }}>
                        {t('contracts.amendment.field.impact.supressao')}
                      </button>
                    </div>
                  </div>
                  <div className={s.field}>
                    <label className={s.label}>{t('contracts.amendment.field.value')}</label>
                    <input
                      className={s.input}
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={state.impactValueCents > 0 ? centsToBRL(state.impactValueCents) : ''}
                      onChange={(e) => { update('impactValueCents', inputToCents(e.target.value)) }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumo */}
          <div>
            <div className={s.sectionLabel}>
              {t('contracts.amendment.field.description')} {!isAttach && <span className={s.req}>*</span>}
            </div>
            {isAttach ? (
              <div className={s.input}><span>{resumoText}</span></div>
            ) : (
              <textarea className={s.textarea} value={state.description} onChange={(e) => { update('description', e.target.value) }} />
            )}
          </div>

          {/* Datas */}
          <div>
            <div className={s.sectionLabel}>Datas</div>
            <div className={s.fieldRow2}>
              <div className={s.field}>
                <label className={s.label}>
                  {t('contracts.amendment.field.signedAt')} {isAttach && <span className={s.req}>*</span>}
                </label>
                {isAttach ? (
                  <input className={s.input} type="date" value={attachSignedAt} onChange={(e) => { setAttachSignedAt(e.target.value) }} />
                ) : (
                  <input className={s.input} type="date" value={state.signedAt} onChange={(e) => { update('signedAt', e.target.value) }} />
                )}
              </div>
              {!isAttach && (
                <div className={s.field}>
                  <label className={s.label}>{t('contracts.amendment.field.startDate')}</label>
                  <input className={s.input} type="date" value={state.startDate} onChange={(e) => { update('startDate', e.target.value) }} />
                </div>
              )}
            </div>
          </div>

          {/* Documento */}
          <div>
            <div className={s.sectionLabel}>
              {t('contracts.amendment.field.document')} {isAttach && <span className={s.req}>*</span>}
            </div>
            <label className={s.uploadZone}>
              <input
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f?.type === 'application/pdf') { setFile(f); update('hasDocument', true) } }}
              />
              <div className={s.uploadInfo}>
                <span className={s.uploadName}>{file !== null ? file.name : t('contracts.amendment.field.document.hint')}</span>
                <span className={s.uploadHint}>PDF · ≤ 20 MB</span>
              </div>
            </label>
          </div>

          {errorTag !== null && <div className={s.errorAlert} role="alert">{t(errorTag)}</div>}
        </div>

        <div className={s.footer}>
          <button type="button" className={s.buttonSecondary} onClick={onClose}>{t('contracts.amendment.cancel')}</button>
          <button type="button" className={s.buttonPrimary} disabled={isAttach ? !canAttach : !canCreate} onClick={handleSubmit}>
            {submitting ? t('common.loading') : isAttach ? 'Salvar e homologar' : t('contracts.amendment.submit')}
          </button>
        </div>
      </div>
    </dialog>
  )
}
