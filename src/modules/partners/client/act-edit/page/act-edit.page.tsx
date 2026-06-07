import type { ReactNode } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useActEditBinding } from '../act-edit.binding.ts'
import { ActEditForm } from '../components/act-edit-form.component.tsx'
import { screen } from './act-edit.css.ts'

const t = createTranslator(ptBR)
const routeApi = getRouteApi('/_authenticated/parceiros/atos/$id/editar')

export function ActEditPage(): ReactNode {
  const { id } = routeApi.useParams()
  const navigate = useNavigate()
  const { state, updateCommand } = useActEditBinding(id)

  if (state.status === 'loading') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.acts.edit.title')} subtitle={t('partners.acts.list.loading')} />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={screen}>
        <PageHeader title={t('partners.acts.edit.title')} subtitle={t(state.errorTag)} />
      </div>
    )
  }

  return (
    <div className={screen}>
      <PageHeader title={t('partners.acts.edit.title')} />
      <ActEditForm
        key={id}
        initial={state.initial}
        running={updateCommand.running}
        errorTag={updateCommand.errorTag}
        onSubmit={(values) => {
          updateCommand.execute(values)
        }}
        onCancel={() => void navigate({ to: '/parceiros/atos/$id', params: { id } })}
      />
    </div>
  )
}
