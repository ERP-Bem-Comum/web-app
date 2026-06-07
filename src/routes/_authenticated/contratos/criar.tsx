import { createFileRoute } from '@tanstack/react-router'
import { ContractCreatePage } from '#modules/contracts/client/contract-create/page/contract-create.page.tsx'

export const Route = createFileRoute('/_authenticated/contratos/criar')({
  component: ContractCreatePage,
})
