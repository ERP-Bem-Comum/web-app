import type { ReactNode } from 'react'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'

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
} from '#shared/ui/brand/brand-form.css.ts'

import { useSupplierEditBinding } from '../supplier-edit.binding.ts'
import { SupplierEditForm } from '../components/supplier-edit-form.component.tsx'
import { screen } from './supplier-edit.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/fornecedores/$id/editar')

export function SupplierEditPage(): ReactNode {
  const { id } = routeApi.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const goBack = (): void => {
    router.history.back()
  }
  const { state, updateCommand, canWrite, canEditSensitive, categories } = useSupplierEditBinding(id)

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <div className={page}>
          <div className={scrollArea}>
            <div className={content}>
              <EditHead
                title={t('partners.suppliers.edit.title')}
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
              <EditHead
                title={t('partners.suppliers.edit.title')}
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
    <div className={screen}>
      <SupplierEditForm
        key={id}
        initial={state.initial}
        categories={categories}
        canEditSensitive={canWrite}
        cnpjDisabled={!canEditSensitive}
        running={updateCommand.running}
        errorTag={updateCommand.errorTag}
        onSubmit={(values) => {
          updateCommand.execute(values)
        }}
        onCancel={() => void navigate({ to: '/parceiros/fornecedores/$id', params: { id } })}
        onBack={goBack}
      />
    </div>
  )
}

// Cabeçalho "brand": voltar + título/subtítulo (usado nos estados loading/error).
function EditHead({
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
