import type { ReactNode } from 'react'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useFinancierEditBinding } from '../financier-edit.binding.ts'
import { FinancierEditForm } from '../components/financier-edit-form.component.tsx'
import { screen } from './financier-edit.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/financiadores/$id/editar')

export function FinancierEditPage(): ReactNode {
  const { id } = routeApi.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const goBack = (): void => { router.history.back(); }
  const { state, updateCommand } = useFinancierEditBinding(id)

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <PageHeader
          title={t('partners.financiers.edit.title')}
          subtitle={t('partners.financiers.list.loading')}
          onBack={goBack}
          backLabel={t('common.back')}
        />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={screen}>
        <PageHeader
          title={t('partners.financiers.edit.title')}
          subtitle={t(state.errorTag)}
          onBack={goBack}
          backLabel={t('common.back')}
        />
      </div>
    )
  }

  return (
    <div className={screen}>
      <PageHeader
        title={t('partners.financiers.edit.title')}
        onBack={goBack}
        backLabel={t('common.back')}
      />
      <FinancierEditForm
        key={id}
        initial={state.initial}
        running={updateCommand.running}
        errorTag={updateCommand.errorTag}
        onSubmit={(values) => {
          updateCommand.execute(values)
        }}
        onCancel={() => void navigate({ to: '/parceiros/financiadores/$id', params: { id } })}
      />
    </div>
  )
}
