/**
 * Hidratação do fornecedor selecionado (Lançar Documento) — ADAPTER React. Quando um FORNECEDOR é
 * escolhido, busca (cross-módulo só via public-api — §I):
 *  - dados bancários do fornecedor (`getSupplierFn`) → card "Conta do fornecedor";
 *  - o contrato "Em Andamento" dele (`listContractsFn` + filtro client-side por `supplierId`, pois o
 *    list-input não filtra por fornecedor) → preenche a Categorização + chip do contrato.
 *
 * Exibição agora; a PERSISTÊNCIA da categorização derivada vem com o backend (core-api#48). O create já
 * envia o `contractRef` (ver page) p/ o backend derivar quando #48 entrar.
 */
import { useQuery } from '@tanstack/react-query'

import { getSupplierFn } from '#modules/partners/public-api/index.ts'
import { listContractsFn } from '#modules/contracts/public-api/index.ts'
import type { Contract } from '#modules/contracts/public-api/index.ts'

import {
  EMPTY_HYDRATION,
  type PartnerHydration,
  type PartnerKind,
  type SupplierBankView,
  type ContractCategoView,
} from './document-form.view.ts'

function toContract(c: Contract): ContractCategoView {
  return {
    ref: c.id,
    number: c.sequentialNumber,
    centroCusto: c.centroDeCusto ?? '',
    categoria: c.categorizacao ?? '',
    programa: c.program?.sigla ?? c.program?.name ?? '',
    planoOrcamentario: c.budgetPlan?.scenarioName ?? '',
    programRef: c.programId ?? null,
    budgetPlanRef: c.budgetPlanId ?? null,
  }
}

export function usePartnerHydration(supplierRef: string, kind: PartnerKind | null): PartnerHydration {
  const enabled = supplierRef !== '' && kind === 'supplier'
  const query = useQuery({
    queryKey: ['financial', 'partner-hydration', supplierRef] as const,
    enabled,
    queryFn: async (): Promise<PartnerHydration> => {
      const [supplier, contracts] = await Promise.all([
        getSupplierFn({ data: { id: supplierRef } }),
        listContractsFn({ data: { status: 'Em Andamento', page: 1, limit: 100, order: 'DESC' } }),
      ])

      let bank: SupplierBankView | null = null
      if (supplier.ok) {
        const acc = supplier.data.bankAccount
        const pix = supplier.data.pixKey
        if (acc !== null || pix !== null) {
          bank = {
            line: acc !== null ? `${acc.bank} · Ag ${acc.agency} · CC ${acc.accountNumber}` : '',
            pix: pix !== null ? `PIX · ${pix.key}` : null,
          }
        }
      }

      const active = contracts.ok ? contracts.data.items.find((c) => c.supplierId === supplierRef) : undefined

      return { bank, contract: active !== undefined ? toContract(active) : null }
    },
  })
  return query.data ?? EMPTY_HYDRATION
}
