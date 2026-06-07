/**
 * Rota /parceiros/fornecedores/$id/editar — STUB do MVP (US1). A tela real entra na US4.
 */
import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

const t = createTranslator(ptBR)

function SupplierEditStub(): ReactNode {
  return <PageHeader title={t('partners.suppliers.edit.title')} subtitle={t('partners.suppliers.coming-soon')} />
}

export const Route = createFileRoute('/_authenticated/parceiros/fornecedores/$id/editar')({
  component: SupplierEditStub,
})
