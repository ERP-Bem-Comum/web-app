/**
 * Lançar Documento — PAGE (view burra §XI). Compõe controller (form-state), binding (create) e o binding
 * de opções de fornecedor; deriva via funções PURAS (`document-form.view`); renderiza form + sidebar +
 * ações. No sucesso, mostra os **títulos gerados** (FR-007). Não usa data-hooks/useReducer direto — só os
 * hooks de binding/controller.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Button } from '#shared/ui/index.ts'

import { useDocumentFormController } from '../document-form.controller.ts'
import { useLancarDocumentoBinding } from '../create-document.binding.ts'
import { useSuppliersOptions } from '../suppliers-options.binding.ts'
import { buildCreateInput, canSubmit, formatCents } from '../document-form.view.ts'
import { DocumentForm } from '../components/document-form.component.tsx'
import { ComposicaoSidebar } from '../components/composicao-sidebar.component.tsx'
import {
  body,
  bottombar,
  cardTitle,
  crumb,
  errorBanner,
  formCol,
  ghostButton,
  screen,
  sidebarCol,
  tituloChild,
  tituloParent,
  tituloVal,
  topTitle,
  topbar,
  successCard,
  successTitle,
} from './lancar-documento.css.ts'

const t = createTranslator(ptBR)

export function LancarDocumentoPage(): ReactNode {
  const controller = useDocumentFormController()
  const command = useLancarDocumentoBinding()
  const suppliers = useSuppliersOptions()

  // Estado de sucesso — mostra os títulos gerados (pai + filhos).
  if (command.created !== null) {
    const created = command.created
    return (
      <div className={screen}>
        <div className={successCard}>
          <h2 className={successTitle}>{t('financial.create.success.title')}</h2>
          <h4 className={cardTitle}>{t('financial.create.success.subtitle')}</h4>
          {created.payables.map((p) => (
            <div className={p.kind === 'Parent' ? tituloParent : tituloChild} key={p.id}>
              <span>{p.kind === 'Parent' ? t('financial.create.sidebar.tituloPai') : (p.retentionType ?? '')}</span>
              <span className={tituloVal}>{formatCents(p.valueCents)}</span>
            </div>
          ))}
          <div className={bottombar}>
            <Button
              onClick={() => {
                command.reset()
                controller.reset()
              }}
            >
              {t('financial.create.success.novo')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const supplierName = suppliers.find((s) => s.id === controller.fields.supplierRef)?.name ?? ''

  return (
    <div className={screen}>
      <header className={topbar}>
        <h1 className={topTitle}>{t('financial.create.title')}</h1>
        <span className={crumb}>{t('financial.create.crumb')}</span>
      </header>

      {command.errorTag !== null ? (
        <div className={errorBanner} role="alert">
          {t(command.errorTag)}
        </div>
      ) : null}

      <div className={body}>
        <div className={formCol}>
          <DocumentForm
            fields={controller.fields}
            suppliers={suppliers}
            onType={controller.setType}
            onPaymentMethod={controller.setPaymentMethod}
            onSupplier={controller.setSupplier}
            onText={controller.setText}
            onRetention={controller.setRetention}
          />
        </div>

        <aside className={sidebarCol}>
          <ComposicaoSidebar fields={controller.fields} supplierName={supplierName} />
          <div className={bottombar}>
            <button type="button" className={ghostButton} onClick={controller.reset}>
              {t('financial.create.discard')}
            </button>
            <Button
              onClick={() => {
                const input = buildCreateInput(controller.fields)
                if (input !== null) command.execute(input)
              }}
              disabled={!canSubmit(controller.fields)}
              loading={command.running}
              loadingLabel={t('common.loading')}
            >
              {t('financial.create.submit')}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
