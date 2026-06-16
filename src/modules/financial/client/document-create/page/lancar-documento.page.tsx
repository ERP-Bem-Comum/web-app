/**
 * Lançar Documento — PAGE (view burra §XI). Compõe controller (form-state), binding (create) e o binding
 * de opções de fornecedor; deriva via funções PURAS (`document-form.view`); renderiza form + sidebar +
 * ações. No sucesso, mostra os **títulos gerados** (FR-007). Não usa data-hooks/useReducer direto — só os
 * hooks de binding/controller.
 */
import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { useDocumentFormController } from '../document-form.controller.ts'
import { useSupplierPickerController } from '../supplier-picker.controller.ts'
import { useLancarDocumentoBinding } from '../create-document.binding.ts'
import { useDocumentEditing } from '../edit-document.binding.ts'
import { usePartnersOptions } from '../partners-options.binding.ts'
import { usePartnerHydration } from '../partner-hydration.binding.ts'
import {
  buildCreateInput,
  buildDraftInput,
  buildAdjustInput,
  canSubmit,
  canSaveDraft,
  canSaveEdit,
} from '../document-form.view.ts'
import { DocumentForm } from '../components/document-form.component.tsx'
import { SupplierPicker } from '../components/supplier-picker.component.tsx'
import { ComposicaoSidebar } from '../components/composicao-sidebar.component.tsx'
import { DocumentPreview } from '../components/document-preview.component.tsx'
import { DocumentBottombar } from '../components/document-bottombar.component.tsx'
import {
  body,
  crumb,
  errorBanner,
  formCol,
  scrollArea,
  screen,
  sidebarCol,
  topTitle,
  topbar,
  topbarBack,
  topbarClose,
} from './lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type LancarDocumentoPageProps = Readonly<{ documentId?: string }>

export function LancarDocumentoPage({ documentId }: LancarDocumentoPageProps = {}): ReactNode {
  const navigate = useNavigate()
  const edit = useDocumentEditing(documentId)
  const controller = useDocumentFormController(edit.initialFields)
  const picker = useSupplierPickerController()
  const command = useLancarDocumentoBinding()
  const partners = usePartnersOptions()

  // Sucesso → o binding invalida a lista e redireciona pro grid (sem card de sucesso inline).
  const selectedPartner = partners.find((p) => p.id === controller.fields.supplierRef) ?? null
  const supplierName = selectedPartner?.name ?? ''
  // Hidrata banco + contrato "Em Andamento" do fornecedor (auto-preenchimento do Pagamento/Categorização).
  const hydration = usePartnerHydration(controller.fields.supplierRef, selectedPartner?.kind ?? null)

  // Modo da tela: criação · edição (Aberto, ajustável) · consulta (status ≠ Aberto, só leitura).
  const mode = !edit.isEdit ? 'create' : edit.editable ? 'edit' : 'view'
  const errorTag = edit.isEdit ? edit.errorTag : command.errorTag
  const running = edit.isEdit ? edit.running : command.running
  const goToGrid = (): void => {
    void navigate({ to: '/financeiro/contas-a-pagar' })
  }

  // Anexa os refs do contrato "Em Andamento" e dispara o create (backend deriva a categorização — #48).
  const submit = (base: ReturnType<typeof buildCreateInput>): void => {
    if (base === null) return
    const c = hydration.contract
    command.execute(
      c !== null
        ? {
            ...base,
            contractRef: c.ref,
            programRef: c.programRef ?? undefined,
            budgetPlanRef: c.budgetPlanRef ?? undefined,
          }
        : base,
    )
  }

  // Ajuste (modo edição): só os campos editáveis + version; o binding invalida e volta ao grid.
  const submitEdit = (): void => {
    if (edit.detail === null) return
    const input = buildAdjustInput(controller.fields, edit.detail)
    if (input !== null) edit.execute(input)
  }

  return (
    <div className={screen}>
      <header className={topbar}>
        <Link
          to="/financeiro/contas-a-pagar"
          className={topbarBack}
          aria-label={t('financial.create.backLabel')}
        >
          {t('financial.create.back')}
        </Link>
        <h1 className={topTitle}>{edit.isEdit ? t('financial.edit.title') : t('financial.create.title')}</h1>
        <span className={crumb}>{t('financial.create.crumb')}</span>
        <Link
          to="/financeiro/contas-a-pagar"
          className={topbarClose}
          aria-label={t('financial.create.closeLabel')}
        >
          {t('financial.create.close')}
        </Link>
      </header>

      {errorTag !== null ? (
        <div className={errorBanner} role="alert">
          {t(errorTag)}
        </div>
      ) : null}

      <div className={body}>
        <DocumentPreview />

        <div className={`${formCol} ${scrollArea}`}>
          {/* Hero do fornecedor com picker buscável (todos os parceiros) — via MANUAL do fornecedor. */}
          <SupplierPicker
            selected={selectedPartner}
            options={partners}
            open={picker.open}
            query={picker.query}
            disabled={edit.isEdit}
            onToggle={picker.toggle}
            onClose={picker.close}
            onQueryChange={picker.setQuery}
            onSelect={(id) => {
              controller.setSupplier(id)
              picker.close()
            }}
          />

          <DocumentForm
            fields={controller.fields}
            hydration={hydration}
            locks={edit.locks ?? undefined}
            onType={controller.setType}
            onPaymentMethod={controller.setPaymentMethod}
            onText={controller.setText}
            onRetention={controller.setRetention}
          />
        </div>

        <aside className={`${sidebarCol} ${scrollArea}`}>
          <ComposicaoSidebar fields={controller.fields} supplierName={supplierName} />
        </aside>
      </div>

      <DocumentBottombar
        mode={mode}
        onDiscard={edit.isEdit ? goToGrid : controller.reset}
        onSaveDraft={() => {
          submit(buildDraftInput(controller.fields))
        }}
        onSubmit={
          edit.isEdit
            ? submitEdit
            : () => {
                submit(buildCreateInput(controller.fields))
              }
        }
        canSaveDraft={canSaveDraft(controller.fields)}
        canSubmit={
          edit.isEdit
            ? edit.detail !== null && canSaveEdit(controller.fields, edit.detail)
            : canSubmit(controller.fields)
        }
        running={running}
      />
    </div>
  )
}
