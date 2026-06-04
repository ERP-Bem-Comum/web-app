/**
 * Rota /contratos — listagem de contratos (protegida).
 */
import { createFileRoute } from '@tanstack/react-router'
import { ContractListFiltersSchema } from '#modules/contracts/client/domain/schemas.ts'
import { ContractListPage } from '#modules/contracts/client/contract-list/page/contract-list.page.tsx'

export const Route = createFileRoute('/_authenticated/contratos/')({
  validateSearch: ContractListFiltersSchema,
  component: ContractListPage,
})
