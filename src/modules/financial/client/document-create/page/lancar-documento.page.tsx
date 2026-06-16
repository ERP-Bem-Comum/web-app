/**
 * Lançar Documento — PAGE (view burra §XI). Compõe controller (form-state), binding (create) e o binding
 * de opções de fornecedor; deriva via funções PURAS (`document-form.view`); renderiza form + sidebar +
 * ações. No sucesso, mostra os **títulos gerados** (FR-007). Não usa data-hooks/useReducer direto — só os
 * hooks de binding/controller.
 */
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { useDocumentFormController } from '../document-form.controller.ts'
import { useSupplierPickerController } from '../supplier-picker.controller.ts'
import { useLancarDocumentoBinding } from '../create-document.binding.ts'
import { usePartnersOptions } from '../partners-options.binding.ts'
import { usePartnerHydration } from '../partner-hydration.binding.ts'
import { buildCreateInput, canSubmit } from '../document-form.view.ts'
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

export function LancarDocumentoPage(): ReactNode {
  const controller = useDocumentFormController()
  const picker = useSupplierPickerController()
  const command = useLancarDocumentoBinding()
  const partners = usePartnersOptions()

  // Sucesso → o binding invalida a lista e redireciona pro grid (sem card de sucesso inline).
  const selectedPartner = partners.find((p) => p.id === controller.fields.supplierRef) ?? null
  const supplierName = selectedPartner?.name ?? ''
  // Hidrata banco + contrato "Em Andamento" do fornecedor (auto-preenchimento do Pagamento/Categorização).
  const hydration = usePartnerHydration(controller.fields.supplierRef, selectedPartner?.kind ?? null)

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
        <h1 className={topTitle}>{t('financial.create.title')}</h1>
        <span className={crumb}>{t('financial.create.crumb')}</span>
        <Link
          to="/financeiro/contas-a-pagar"
          className={topbarClose}
          aria-label={t('financial.create.closeLabel')}
        >
          {t('financial.create.close')}
        </Link>
      </header>

      {command.errorTag !== null ? (
        <div className={errorBanner} role="alert">
          {t(command.errorTag)}
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
        onDiscard={controller.reset}
        onSubmit={() => {
          const base = buildCreateInput(controller.fields)
          if (base === null) return
          // Anexa os refs do contrato "Em Andamento" (backend deriva a categorização — core-api#48).
          const c = hydration.contract
          const input =
            c !== null
              ? {
                  ...base,
                  contractRef: c.ref,
                  programRef: c.programRef ?? undefined,
                  budgetPlanRef: c.budgetPlanRef ?? undefined,
                }
              : base
          command.execute(input)
        }}
        canSubmit={canSubmit(controller.fields)}
        running={command.running}
      />
    </div>
  )
}
