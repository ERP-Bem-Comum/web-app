/**
 * SupplierDetailPage — detalhe do fornecedor (clique na linha da grid). Visual: identidade "brand" de
 * formulário (`brand-form.css.ts`) — mesma da tela Novo Fornecedor. `Editar` habilita os campos na
 * própria tela; `Salvar` persiste; `Voltar` retorna; `Inativar/Reativar` alterna a ativação.
 */
import { useState, type ReactNode } from 'react'
import { getRouteApi, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { ChevronLeftIcon } from '#shared/ui/icons/index.ts'
import {
  page,
  scrollArea,
  content,
  head,
  backBtn,
  headText,
  headTitle,
  headSubtitle,
  actionbar,
  actionbarInner,
  btnGhost,
  btnPrimary,
} from '#shared/ui/brand/brand-form.css.ts'
import {
  useSupplierFormController,
  type SupplierFormValues,
} from '#modules/partners/client/supplier-create/components/supplier-form.controller.ts'

import {
  useSupplierDetailBinding,
  type SupplierSaveCommand,
  type SupplierStatusCommand,
} from '../supplier-detail.binding.ts'
import { statusActionFor, type SupplierDetail } from '../supplier-detail.view-model.ts'
import { SupplierDetailContent } from '../components/supplier-detail-content.component.tsx'
import { ConfirmDialog } from '../components/confirm-dialog.component.tsx'
import { errorBanner, screen } from './supplier-detail.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/fornecedores/$id')

export function SupplierDetailPage(): ReactNode {
  const { id } = routeApi.useParams()
  const router = useRouter()
  const goBack = (): void => {
    router.history.back()
  }
  const [editing, setEditing] = useState(false)
  const { state, statusCommand, saveCommand, canWrite, canViewSensitive, categories } =
    useSupplierDetailBinding(id, () => {
      setEditing(false)
    })

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <div className={page}>
          <div className={scrollArea}>
            <div className={content}>
              <DetailHead
                title={t('partners.suppliers.detail.title')}
                subtitle={t('partners.suppliers.list.loading')}
                onBack={goBack}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={screen}>
        <div className={page}>
          <div className={scrollArea}>
            <div className={content}>
              <DetailHead
                title={t('partners.suppliers.detail.title')}
                subtitle={t(state.errorTag)}
                onBack={goBack}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DetailReady
      key={state.supplier.id}
      supplier={state.supplier}
      editing={editing}
      canWrite={canWrite}
      canViewSensitive={canViewSensitive}
      categories={categories}
      statusCommand={statusCommand}
      saveCommand={saveCommand}
      onEdit={() => {
        setEditing(true)
      }}
      onCancel={() => {
        setEditing(false)
      }}
      onBack={goBack}
    />
  )
}

// Cabeçalho "brand": voltar + título/subtítulo.
function DetailHead({
  title,
  subtitle,
  onBack,
}: {
  title: string
  subtitle?: string
  onBack: () => void
}): ReactNode {
  return (
    <div className={head}>
      <button type="button" className={backBtn} onClick={onBack} aria-label={t('common.back')}>
        <ChevronLeftIcon size={18} />
      </button>
      <div className={headText}>
        <h1 className={headTitle}>{title}</h1>
        {subtitle !== undefined ? <p className={headSubtitle}>{subtitle}</p> : null}
      </div>
    </div>
  )
}

type DetailReadyProps = Readonly<{
  supplier: SupplierDetail
  editing: boolean
  canWrite: boolean
  canViewSensitive: boolean
  categories: readonly string[]
  statusCommand: SupplierStatusCommand
  saveCommand: SupplierSaveCommand
  onEdit: () => void
  onCancel: () => void
  onBack: () => void
}>

function DetailReady(props: DetailReadyProps): ReactNode {
  const { supplier, editing } = props
  const [confirming, setConfirming] = useState(false)
  const [pendingEdit, setPendingEdit] = useState<SupplierFormValues | null>(null)
  const initial: SupplierFormValues = {
    name: supplier.name,
    corporateName: supplier.corporateName,
    fantasyName: supplier.fantasyName,
    email: supplier.email,
    cnpj: supplier.cnpj,
    serviceCategory: supplier.serviceCategory,
    bankAccount: supplier.bankAccount,
    pixKey: supplier.pixKey,
    serviceRating: supplier.serviceRating,
    ratingComment: supplier.ratingComment,
  }
  const c = useSupplierFormController({
    initial,
    onSubmit: (values) => {
      setPendingEdit(values)
    },
  })

  const action = statusActionFor(supplier.activation)
  const actionLabel =
    action === 'deactivate'
      ? t('partners.suppliers.actions.deactivate')
      : t('partners.suppliers.actions.reactivate')
  const errorTag = props.saveCommand.errorTag ?? props.statusCommand.errorTag

  return (
    <div className={screen}>
      <div className={page}>
        <div className={scrollArea}>
          <div className={content}>
            <DetailHead title={supplier.name} subtitle={supplier.fantasyName} onBack={props.onBack} />

            {errorTag !== null ? (
              <div className={errorBanner} role="alert">
                {t(errorTag)}
              </div>
            ) : null}

            <SupplierDetailContent
              controller={c}
              editing={editing}
              canViewSensitive={props.canWrite}
              cnpjDisabled={!props.canViewSensitive}
              activation={supplier.activation}
              categories={props.categories}
            />
          </div>
        </div>

        <div className={actionbar}>
          <div className={actionbarInner}>
            {editing ? (
              <>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    c.reset(initial)
                    props.onCancel()
                  }}
                >
                  {t('partners.suppliers.form.cancel')}
                </button>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={props.saveCommand.running}
                  onClick={() => {
                    c.submit()
                  }}
                >
                  {props.saveCommand.running
                    ? t('partners.suppliers.form.saving')
                    : t('partners.suppliers.form.save')}
                </button>
              </>
            ) : (
              <>
                <button type="button" className={btnGhost} onClick={props.onBack}>
                  {t('common.back')}
                </button>
                {props.canWrite ? (
                  <>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setConfirming(true)
                      }}
                    >
                      {actionLabel}
                    </button>
                    <button type="button" className={btnPrimary} onClick={props.onEdit}>
                      {t('partners.suppliers.actions.edit')}
                    </button>
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title={
          action === 'deactivate'
            ? t('partners.suppliers.confirm.deactivate-title')
            : t('partners.suppliers.confirm.reactivate-title')
        }
        message={
          action === 'deactivate'
            ? t('partners.suppliers.confirm.deactivate-message')
            : t('partners.suppliers.confirm.reactivate-message')
        }
        confirmLabel={t('partners.suppliers.confirm.confirm')}
        cancelLabel={t('partners.suppliers.confirm.cancel')}
        running={props.statusCommand.running}
        onConfirm={() => {
          props.statusCommand.execute(supplier.id, action)
          setConfirming(false)
        }}
        onCancel={() => {
          setConfirming(false)
        }}
      />

      <ConfirmDialog
        open={pendingEdit !== null}
        title={t('partners.confirm.edit.title')}
        message={t('partners.confirm.edit.message')}
        confirmLabel={t('partners.confirm.confirm')}
        cancelLabel={t('partners.confirm.cancel')}
        running={props.saveCommand.running}
        onConfirm={() => {
          if (pendingEdit !== null) props.saveCommand.execute(pendingEdit)
          setPendingEdit(null)
        }}
        onCancel={() => {
          setPendingEdit(null)
        }}
      />
    </div>
  )
}
