import type { ReactNode } from 'react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { UploadIcon } from '#shared/ui/icons/index.ts'
import { getSupplierFn } from '#modules/partners/public-api/index.ts'
import { useAttachSignedDocumentBinding } from '#modules/contracts/client/contract-attach-document/attach-signed-document.binding.ts'
import { useContractEditBinding } from '#modules/contracts/client/contract-edit/contract-edit.binding.ts'
import { useContractCreateBinding, usePartnerSearchBinding, useContractProgramOptionsBinding } from '../contract-create.binding.ts'
import { useContractFormController } from '../components/contract-form.controller.ts'
import type { SelectedPartner } from '../components/contract-form.controller.ts'
import { ContractForm } from '../components/contract-form.component.tsx'
import { formatDateOrDash } from '#modules/contracts/client/domain/format.ts'
import {
  screen,
  modalOverlay,
  modalContent,
  modalHeader,
  modalHeaderIcon,
  modalHeaderText,
  modalTitle,
  modalSubtitle,
  modalClose,
  modalBody,
  modalFooter,
  modalStatusRow,
  modalStatusLabel,
  summaryGrid,
  summaryCard,
  summaryCardLabel,
  summaryCardValue,
  statusBadge,
  statusBadgePending,
  statusBadgeActive,
  statusDot,
  sectionTitle,
  field,
  fieldLabel,
  input,
  inputError,
  fieldHint,
  fieldHintError,
  uploadZone,
  uploadZoneActive,
  uploadIconWrap,
  uploadFileInfo,
  uploadFileName,
  uploadFileSize,
  uploadAction,
  buttonPrimary,
  buttonSecondary,
  errorAlert,
} from './contract-create.css.ts'

const t = createTranslator(ptBR)

function formatCurrencyCents(cents: number): string {
  if (!cents || cents <= 0) return 'R$ 0,00'
  const val = cents / 100
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ContractCreatePage(): ReactNode {
  const navigate = useNavigate()
  const { createCommand } = useContractCreateBinding()
  const programOptions = useContractProgramOptionsBinding()
  const { attachCommand } = useAttachSignedDocumentBinding()
  // Workaround: o backend não aceita contato no create → PATCH logo após criar (se preenchido).
  const { editCommand: contatoEditCommand } = useContractEditBinding()
  const form = useContractFormController()

  /* Busca de parceiros via binding */
  const [partnerQuery, setPartnerQuery] = useState('')
  const [partnerOpen, setPartnerOpen] = useState(false)

  const partnerSearch = usePartnerSearchBinding(partnerQuery, partnerOpen)

  const partnerLoading = partnerSearch.isLoading
  const partnerResults: readonly SelectedPartner[] = partnerSearch.results

  const handlePartnerQueryChange = useCallback((q: string) => {
    setPartnerQuery(q)
  }, [])

  const handleSelectPartner = useCallback((partner: SelectedPartner) => {
    form.setSelectedPartner(partner)
    if (partner.kind === 'Fornecedor') {
      // O tipo do contrato é DERIVADO do parceiro escolhido (busca unificada) — mantém consistência.
      form.update('contractType', 'Supplier')
      form.update('supplierId', partner.id)
      form.update('financierId', '')
      form.update('collaboratorId', '')
      form.update('actId', '')
      // A busca de parceiros não traz dados bancários (só o detalhe). Buscamos o detalhe do fornecedor
      // e herdamos banco/PIX para a seção "Dados Bancários" (campos somente-leitura).
      void getSupplierFn({ data: { id: partner.id } }).then((res) => {
        if (!res.ok) return
        const b = res.data.bankAccount
        if (b !== null) {
          form.update('bancaryInfo', { bank: b.bank, agency: b.agency, accountNumber: b.accountNumber, dv: b.checkDigit })
        }
        const p = res.data.pixKey
        if (p !== null) {
          form.update('pixInfo', { keyType: p.keyType, key: p.key })
        }
      })
    } else if (partner.kind === 'Financiador') {
      form.update('contractType', 'Financier')
      form.update('financierId', partner.id)
      form.update('supplierId', '')
      form.update('collaboratorId', '')
      form.update('actId', '')
    } else if (partner.kind === 'Acordo') {
      // Acordo de Cooperação Técnica (ACT) como contratado — #32 aceita contractor.type='act'.
      form.update('contractType', 'ACT')
      form.update('actId', partner.id)
      form.update('supplierId', '')
      form.update('financierId', '')
      form.update('collaboratorId', '')
    } else {
      form.update('contractType', 'Collaborator')
      form.update('collaboratorId', partner.id)
      form.update('supplierId', '')
      form.update('financierId', '')
      form.update('actId', '')
    }
    if (partner.bancaryInfo) {
      form.update('bancaryInfo', { ...partner.bancaryInfo })
    }
    if (partner.pixInfo) {
      form.update('pixInfo', { ...partner.pixInfo })
    }
  }, [form])

  const handleRemovePartner = useCallback(() => {
    form.setSelectedPartner(null)
    form.update('supplierId', '')
    form.update('financierId', '')
    form.update('collaboratorId', '')
    form.update('bancaryInfo', { bank: '', agency: '', accountNumber: '', dv: '' })
    form.update('pixInfo', { keyType: '', key: '' })
    setPartnerQuery('')
  }, [form])

  /* Modal de finalização */
  const [showModal, setShowModal] = useState(false)
  const [signatureDate, setSignatureDate] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const openModal = useCallback(() => { setShowModal(true) }, [])
  const closeModal = useCallback(() => { setShowModal(false) }, [])

  const handleConfirm = useCallback(() => {
    if (form.isOvertopOS || form.checklist.done < form.checklist.total) {
      form.triggerValidation()
      closeModal()
      return
    }
    // Anexar documento exige data de assinatura (US2 AS-2).
    if (uploadedFile !== null && signatureDate === '') {
      return
    }
    // Se o contrato já foi criado (retry após falha no anexo), não cria de novo: só reanexa.
    if (createCommand.result !== null) {
      if (uploadedFile !== null) {
        attachCommand.execute({ contractId: createCommand.result.id, file: uploadedFile, signedAt: signatureDate })
      }
      return
    }
    const payload = form.submit()
    createCommand.execute(payload)
  }, [form, createCommand, attachCommand, closeModal, uploadedFile, signatureDate])

  const handleCancel = useCallback(() => {
    navigate({ to: '/contratos' }).catch(() => { /* noop */ })
  }, [navigate])

  /* Pós-criação: se há documento assinado, anexar e efetivar (Pendente → Em Andamento) ANTES de
     redirecionar. Sem documento, redireciona direto (contrato fica Pendente). Roda uma vez por criação. */
  const postCreateHandled = useRef(false)
  useEffect(() => {
    if (createCommand.result === null || postCreateHandled.current) return
    postCreateHandled.current = true
    const id = createCommand.result.id
    // Workaround: backend não persiste contato no create → PATCH logo após criar (se preenchido).
    const email = form.state.email
    const telephone = form.state.telephone
    const observations = form.state.observations
    if (email !== '' || telephone !== '' || observations !== '') {
      contatoEditCommand.execute({ id, email: email !== '' ? email : undefined, telephone, observations })
    }
    if (uploadedFile !== null && signatureDate !== '') {
      attachCommand.execute({ contractId: id, file: uploadedFile, signedAt: signatureDate })
    } else {
      navigate({ to: '/contratos' }).catch(() => { /* noop */ })
    }
  }, [createCommand.result, uploadedFile, signatureDate, attachCommand, navigate, contatoEditCommand, form.state.email, form.state.telephone, form.state.observations])

  /* Anexo bem-sucedido → contrato efetivado (Em Andamento): redireciona para a grade. */
  useEffect(() => {
    if (attachCommand.result !== null) {
      navigate({ to: '/contratos' }).catch(() => { /* noop */ })
    }
  }, [attachCommand.result, navigate])

  const handleCreateNewPartner = useCallback(() => {
    window.open('/parceiros/criar', '_blank')
  }, [])

  /* Upload handlers */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') {
      setUploadedFile(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file?.type === 'application/pdf') {
      setUploadedFile(file)
    }
  }, [])

  /* Status preview: arquivo anexado → Em Andamento; sem arquivo → Pendente */
  const statusLabel = uploadedFile !== null ? t('contracts.status.Em Andamento') : t('contracts.status.Pendente')
  const statusStyle = uploadedFile !== null ? statusBadgeActive : statusBadgePending

  return (
    <div className={screen}>
      <ContractForm
        state={form.state}
        onUpdate={form.update}
        onSubmit={form.submit}
        submitting={createCommand.running}
        errorText={createCommand.errorTag === null ? null : t(createCommand.errorTag)}
        selectedPartner={form.selectedPartner}
        onSelectPartner={handleSelectPartner}
        onRemovePartner={handleRemovePartner}
        checklist={form.checklist}
        isOvertopOS={form.isOvertopOS}
        validationAttempted={form.validationAttempted}
        onCancel={handleCancel}
        onOpenModal={openModal}
        partnerSearchQuery={partnerQuery}
        onPartnerSearchQueryChange={handlePartnerQueryChange}
        partnerSearchResults={partnerResults}
        partnerSearchLoading={partnerLoading}
        partnerSearchOpen={partnerOpen}
        onPartnerSearchOpen={() => { setPartnerOpen(true) }}
        onPartnerSearchClose={() => { setPartnerOpen(false) }}
        onCreateNewPartner={handleCreateNewPartner}
        documentUploaded={uploadedFile !== null}
        currentYear={form.currentYear}
        programOptions={programOptions}
      />

      {/* Modal de finalização */}
      {showModal && (
        <div className={modalOverlay} onClick={closeModal}>
          <div className={modalContent} onClick={(e) => { e.stopPropagation() }}>
            {/* Header */}
            <div className={modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div className={modalHeaderIcon}>📄</div>
                <div className={modalHeaderText}>
                  <h2 className={modalTitle}>Finalizar cadastro</h2>
                  <span className={modalSubtitle}>Revise os dados e anexe o documento assinado</span>
                </div>
              </div>
              <button type="button" className={modalClose} onClick={closeModal} aria-label="Fechar">×</button>
            </div>

            {/* Body */}
            <div className={modalBody}>
              {/* Resumo */}
              <div>
                <div className={sectionTitle}>{t('contracts.create.modal.summary')}</div>
                <div className={summaryGrid}>
                  <div className={summaryCard}>
                    <div className={summaryCardLabel}>Contratado</div>
                    <div className={summaryCardValue} title={form.selectedPartner?.name ?? '—'}>
                      {form.selectedPartner?.name ?? '—'}
                    </div>
                  </div>
                  <div className={summaryCard}>
                    <div className={summaryCardLabel}>Valor</div>
                    <div className={summaryCardValue}>{formatCurrencyCents(form.state.originalValueCents)}</div>
                  </div>
                  <div className={summaryCard}>
                    <div className={summaryCardLabel}>Vigência</div>
                    <div className={summaryCardValue}>
                      {formatDateOrDash(form.state.originalPeriodStart)} → {formatDateOrDash(form.state.originalPeriodEnd)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status preview */}
              <div className={modalStatusRow}>
                <span className={modalStatusLabel}>Status do contrato</span>
                <span className={`${statusBadge} ${statusStyle}`} style={{ marginLeft: 'auto' }}>
                  <span className={statusDot}>●</span>
                  {statusLabel}
                </span>
              </div>

              {/* Data de Assinatura */}
              <div className={field}>
                <label className={fieldLabel}>Data de Assinatura</label>
                <input
                  className={`${input} ${uploadedFile && !signatureDate ? inputError : ''}`}
                  type="date"
                  value={signatureDate}
                  onChange={(e) => { setSignatureDate(e.target.value) }}
                />
                {uploadedFile && !signatureDate ? (
                  <div className={fieldHintError}>
                    <span>⚠</span>
                    Ao anexar o contrato assinado, informe a data de assinatura.
                  </div>
                ) : (
                  <div className={fieldHint}>Informe a data de assinatura do contrato.</div>
                )}
              </div>

              {/* Upload PDF */}
              <div className={field}>
                <label className={fieldLabel}>Documento Principal</label>
                <div
                  className={`${uploadZone} ${isDragOver ? uploadZoneActive : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    id="contract-upload"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="contract-upload" style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', cursor: 'pointer' }}>
                    <div className={uploadIconWrap}>
                      <UploadIcon />
                    </div>
                    <div className={uploadFileInfo}>
                      <div className={uploadFileName}>
                        {uploadedFile ? uploadedFile.name : 'Clique para escolher o arquivo'}
                      </div>
                      <div className={uploadFileSize}>
                        {uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(1)} MB` : 'PDF assinado · até 20MB'}
                      </div>
                    </div>
                    <div className={uploadAction}>{uploadedFile ? 'Trocar' : 'Escolher'}</div>
                  </label>
                </div>
              </div>

              {(createCommand.errorTag ?? attachCommand.errorTag) && (
                <div className={errorAlert} role="alert">
                  {t(createCommand.errorTag ?? attachCommand.errorTag ?? '')}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={modalFooter}>
              <button type="button" className={buttonSecondary} onClick={closeModal}>
                Voltar ao formulário
              </button>
              <button
                type="button"
                className={buttonPrimary}
                disabled={createCommand.running || attachCommand.running || form.isOvertopOS || (uploadedFile !== null && signatureDate === '')}
                onClick={handleConfirm}
              >
                {createCommand.running || attachCommand.running ? t('common.loading') : 'Confirmar e salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
