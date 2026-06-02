/**
 * Rota /contratos — listagem de contratos (protegida).
 */
import { createFileRoute } from '@tanstack/react-router'
import { ContractListPage } from '#modules/contracts/client/contract-list/page/contract-list.page.tsx'

export const Route = createFileRoute('/_authenticated/contratos/')({
  component: ContractListPage,
})
