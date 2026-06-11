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
import { useAmendmentFormController, type CreateAmendmentInput, type AmendmentType, type AmendmentAttach } from './amendment-form.controller.ts'
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

// Dados (já formatados) p/ o modo somente-leitura (view) — clicar um aditivo já existente.
// Documento anexado (modo leitura) — nome + id p/ visualizar/baixar via BFF.
export type AmendmentViewDoc = Readonly<{ name: string; documentId: string | undefined }>

export type AmendmentViewData = Readonly<{
  type: AmendmentType
  description: string
  signedAt: string
  status: string
  impactLabel: string
  // Documento anexado ao aditivo (quando houver) — exibido como caixa no modo leitura.
  doc?: AmendmentViewDoc
}>

export interface AmendmentModalProps {
  readonly open: boolean
  readonly mode: 'create' | 'attach' | 'view'
  readonly contractNumber: string
  readonly amendment?: AmendmentForAttach
  readonly viewData?: AmendmentViewData
  readonly onClose: () => void
  readonly onCreate: (input: CreateAmendmentInput, attach?: AmendmentAttach) => void
  readonly onAttach: (args: Readonly<{ amendmentId: string; file: File; signedAt: string }>) => void
  // Visualizar o documento anexado (modo leitura). Opcional.
  readonly onPreviewDoc?: (doc: AmendmentViewDoc) => void
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

export function AmendmentModal({ open, mode, contractNumber, amendment, viewData, onClose, onCreate, onAttach, onPreviewDoc, submitting, errorTag }: AmendmentModalProps): ReactNode {
  const { state, update, submit } = useAmendmentFormController(onCreate)
  const [file, setFile] = useState<File | null>(null)
  const [attachSignedAt, setAttachSignedAt] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const titleId = useId()

  if (!open) return null

  const isAttach = mode === 'attach'
  const isView = mode === 'view'
  // Documento anexado, exibido como caixa no modo leitura.
  const viewDoc = isView ? viewData?.doc : undefined
  const readOnly = isAttach || isView // tipo/resumo não editáveis
  const selectedType: AmendmentType | null = isView
    ? (viewData?.type ?? null)
    : isAttach
      ? (amendment?.type ?? null)
      : state.type
  const resumoText = isView
    ? (viewData?.description && viewData.description !== '' ? viewData.description : '—')
    : amendment !== undefined && amendment.description !== '' ? amendment.description : '—'

  // Documento e assinatura são INTERDEPENDENTES no create: ambos preenchidos → homologa no mesmo save;
  // nenhum → aditivo Pendente (sem efeito). Apenas um dos dois → inconsistente (sinaliza, bloqueia).
  const hasFile = file !== null
  const hasSignature = state.signedAt !== ''
  const attachInconsistent = hasFile !== hasSignature
  const willHomologate = hasFile && hasSignature

  const canCreate =
    state.type !== null &&
    state.description.trim() !== '' && // core-api: AmendmentDescriptionRequired (422) p/ qualquer tipo
    (state.type !== 'prazo' || state.newEndDate !== '') &&
    (state.type !== 'valor' || state.impactValueCents > 0) && // core-api: AmendmentImpactValueZero (422)
    // Distrato (#32): exige data efetiva + documento assinado + data de assinatura (o `signed_termination`
    // é pré-requisito do encerramento; sem ele o contrato não encerra). F3.
    (state.type !== 'distrato' || (state.terminationDate !== '' && willHomologate)) &&
    !attachInconsistent &&
    !submitting
  const canAttach = file !== null && attachSignedAt !== '' && !submitting

  const handleSubmit = (): void => {
    if (isAttach) {
      if (file !== null && amendment) onAttach({ amendmentId: amendment.id, file, signedAt: attachSignedAt })
    } else {
      // Com documento + assinatura → encaminha o anexo p/ a página homologar após criar.
      // Distrato: `terminatedAt` = data efetiva digitada; demais tipos não a usam.
      submit(file !== null && state.signedAt !== '' ? { file, signedAt: state.signedAt, terminatedAt: state.terminationDate } : undefined)
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
            <h3 className={s.title} id={titleId}>{isView ? 'Detalhes do Aditivo' : isAttach ? 'Documento do Aditivo' : t('contracts.amendment.title')}</h3>
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
                    disabled={readOnly}
                    onClick={() => { if (!readOnly) update('type', type) }}
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

          {/* Impacto + Status (somente leitura, modo view) */}
          {isView && (
            <div className={s.fieldRow2}>
              <div className={s.field}>
                <label className={s.label}>{t('contracts.amendment.field.impact.label')}</label>
                <div className={s.input}><span>{viewData?.impactLabel ?? '—'}</span></div>
              </div>
              <div className={s.field}>
                <label className={s.label}>{t('contracts.amendment.field.status')}</label>
                <div className={s.input}><span>{viewData?.status ?? '—'}</span></div>
              </div>
            </div>
          )}

          {/* Resumo */}
          <div>
            <div className={s.sectionLabel}>
              {t('contracts.amendment.field.description')} {!readOnly && <span className={s.req}>*</span>}
            </div>
            {readOnly ? (
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
                  {t('contracts.amendment.field.signedAt')} {(isAttach || hasFile) && <span className={s.req}>*</span>}
                </label>
                {isAttach ? (
                  <input className={s.input} type="date" value={attachSignedAt} onChange={(e) => { setAttachSignedAt(e.target.value) }} />
                ) : isView ? (
                  <div className={s.input}><span>{viewData?.signedAt && viewData.signedAt !== '' ? viewData.signedAt : '—'}</span></div>
                ) : (
                  <input className={s.input} type="date" value={state.signedAt} onChange={(e) => { update('signedAt', e.target.value) }} />
                )}
              </div>
              {!readOnly && (
                <div className={s.field}>
                  <label className={s.label}>{t('contracts.amendment.field.startDate')}</label>
                  <input className={s.input} type="date" value={state.startDate} onChange={(e) => { update('startDate', e.target.value) }} />
                </div>
              )}
            </div>
          </div>

          {/* Documento (oculto no modo view) */}
          {!isView && (
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
                  <span className={s.uploadHint}>{isAttach ? 'PDF · ≤ 20 MB' : t('contracts.amendment.document.optional')}</span>
                </div>
              </label>
            </div>
          )}

          {/* Modo leitura: caixa do documento ANEXADO (quando houver) — clicável p/ visualizar. */}
          {isView && viewDoc !== undefined && (
            <div>
              <div className={s.sectionLabel}>{t('contracts.amendment.field.document')}</div>
              <button
                type="button"
                className={s.uploadZone}
                disabled={viewDoc.documentId === undefined || onPreviewDoc === undefined}
                onClick={() => { if (onPreviewDoc !== undefined) onPreviewDoc(viewDoc) }}
              >
                <div className={s.uploadInfo}>
                  <span className={s.uploadName}>{viewDoc.name}</span>
                  <span className={s.uploadHint}>{viewDoc.documentId !== undefined ? t('contracts.detail.documents.preview') : t('contracts.detail.document.empty')}</span>
                </div>
              </button>
            </div>
          )}

          {/* Sinal: documento e assinatura são interdependentes (só no create). */}
          {!readOnly && attachInconsistent && (
            <div className={s.errorAlert} role="alert">{t('contracts.amendment.attachDependency')}</div>
          )}

          {/* Confirmação de exclusão (aditivo Pendente, modo attach) — gated até o backend. */}
          {isAttach && confirmDelete && (
            <div className={s.errorAlert} role="alert">
              {t('contracts.amendment.delete.question')} {t('contracts.amendment.delete.unavailable')}
            </div>
          )}

          {errorTag !== null && <div className={s.errorAlert} role="alert">{t(errorTag)}</div>}
        </div>

        <div className={s.footer}>
          {isView ? (
            <button type="button" className={s.buttonSecondary} onClick={onClose}>{t('contracts.amendment.close')}</button>
          ) : confirmDelete ? (
            <>
              <button
                type="button"
                className={`${s.buttonDanger} ${s.footerStart}`}
                disabled
                title={t('contracts.amendment.delete.unavailable')}
              >
                {t('contracts.amendment.delete.confirm')}
              </button>
              <button type="button" className={s.buttonSecondary} onClick={() => { setConfirmDelete(false) }}>
                {t('contracts.amendment.cancel')}
              </button>
            </>
          ) : (
            <>
              {isAttach && (
                <button type="button" className={`${s.buttonDanger} ${s.footerStart}`} onClick={() => { setConfirmDelete(true) }}>
                  {t('contracts.amendment.delete')}
                </button>
              )}
              <button type="button" className={s.buttonSecondary} onClick={onClose}>{t('contracts.amendment.cancel')}</button>
              <button type="button" className={s.buttonPrimary} disabled={isAttach ? !canAttach : !canCreate} onClick={handleSubmit}>
                {submitting
                  ? t('common.loading')
                  : isAttach
                    ? 'Salvar e homologar'
                    : willHomologate ? t('contracts.amendment.submitHomologate') : t('contracts.amendment.submit')}
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}
