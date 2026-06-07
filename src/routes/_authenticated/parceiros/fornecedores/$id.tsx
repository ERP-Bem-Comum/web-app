/**
 * Rota /parceiros/fornecedores/$id — STUB do MVP (US1). A tela de detalhe real entra na US3.
 */
import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

const t = createTranslator(ptBR)

function SupplierDetailStub(): ReactNode {
  return <PageHeader title={t('partners.suppliers.detail.title')} subtitle={t('partners.suppliers.coming-soon')} />
}

export const Route = createFileRoute('/_authenticated/parceiros/fornecedores/$id')({
  component: SupplierDetailStub,
})
