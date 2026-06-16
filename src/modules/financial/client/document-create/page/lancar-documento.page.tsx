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
import { Button } from '#shared/ui/index.ts'

import { useDocumentFormController } from '../document-form.controller.ts'
import { useLancarDocumentoBinding } from '../create-document.binding.ts'
import { useSuppliersOptions } from '../suppliers-options.binding.ts'
import { buildCreateInput, canSubmit, formatCents } from '../document-form.view.ts'
import { DocumentForm } from '../components/document-form.component.tsx'
import { ComposicaoSidebar } from '../components/composicao-sidebar.component.tsx'
import { DocumentPreview } from '../components/document-preview.component.tsx'
import { DocumentBottombar } from '../components/document-bottombar.component.tsx'
import {
  body,
  bottombar,
  cardTitle,
  crumb,
  errorBanner,
  formCol,
  screen,
  sidebarCol,
  tituloChild,
  tituloParent,
  tituloVal,
  topTitle,
  topbar,
  topbarBack,
  topbarClose,
  hero,
  heroInfo,
  heroOverline,
  heroName,
  heroAlter,
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
              <span>
                {p.kind === 'Parent' ? t('financial.create.sidebar.tituloPai') : (p.retentionType ?? '')}
              </span>
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

        <div className={formCol}>
          {/* Hero do fornecedor (Figma). v1: exibe o selecionado; "Alterar" abre o select da seção (chrome). */}
          <div className={hero}>
            <div className={heroInfo}>
              <span className={heroOverline}>{t('financial.create.hero.overline')}</span>
              <span className={heroName}>
                {supplierName !== '' ? supplierName : t('financial.create.hero.placeholder')}
              </span>
            </div>
            <span className={heroAlter}>{t('financial.create.hero.change')}</span>
          </div>

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
        </aside>
      </div>

      <DocumentBottombar
        onDiscard={controller.reset}
        onSubmit={() => {
          const input = buildCreateInput(controller.fields)
          if (input !== null) command.execute(input)
        }}
        canSubmit={canSubmit(controller.fields)}
        running={command.running}
      />
    </div>
  )
}
