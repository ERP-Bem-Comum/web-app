/**
 * Hidratação do parceiro selecionado (Lançar Documento) — ADAPTER React. Para QUALQUER tipo de favorecido
 * (Fornecedor/Financiador/Colaborador/Ato), busca (cross-módulo só via public-api — §I) os contratos
 * "Em Andamento" do parceiro com filtro **server-side** por contraparte (`contractorId`+`contractorType`,
 * #116) → preenche a Categorização + chip do contrato. O match client-side (`contractMatchesPartner`)
 * permanece como rede de segurança (o servidor já restringe ao parceiro; antes do #116 o filtro era SÓ no
 * client sobre a 1ª página, podendo perder contratos além do limite).
 *
 * Banco: TODOS os tipos de favorecido têm dados bancários (`bankAccount`+`pixKey`) e seu próprio `get*Fn`
 * (Fornecedor/Financiador/Colaborador/Ato) → o card "Conta do favorecido" é exibido para qualquer tipo.
 * Exibição agora; a PERSISTÊNCIA da categorização derivada vem do backend (core-api#48). O create já envia
 * o `contractRef` (ver page).
 */
import { useQuery } from '@tanstack/react-query'

import {
  getSupplierFn,
  getFinancierFn,
  getCollaboratorFn,
  getActFn,
} from '#modules/partners/public-api/index.ts'
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
    isServiceOrder: c.classification === 'ServiceOrder', // OS vs CT (mesma regra do grid de Contratos)
    centroCusto: c.centroDeCusto ?? '',
    categoria: c.categorizacao ?? '',
    programa: c.program?.sigla ?? c.program?.name ?? '',
    planoOrcamentario: c.budgetPlan?.scenarioName ?? '',
    programRef: c.programId ?? null,
    budgetPlanRef: c.budgetPlanId ?? null,
  }
}

/** Casa o contrato pelo id do contratado conforme o TIPO do parceiro (cada tipo tem seu campo no Contract). */
function contractMatchesPartner(c: Contract, ref: string, kind: PartnerKind): boolean {
  switch (kind) {
    case 'supplier':
      return c.supplierId === ref
    case 'financier':
      return c.financierId === ref
    case 'collaborator':
      return c.collaboratorId === ref
    case 'act':
      return c.actId === ref
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

/** Conta bancária + PIX do favorecido conforme o TIPO (todos têm `get*Fn` e `bankAccount`/`pixKey`). */
async function loadPartnerBank(kind: PartnerKind, ref: string): Promise<SupplierBankView | null> {
  const r =
    kind === 'supplier'
      ? await getSupplierFn({ data: { id: ref } })
      : kind === 'financier'
        ? await getFinancierFn({ data: { id: ref } })
        : kind === 'collaborator'
          ? await getCollaboratorFn({ data: { id: ref } })
          : await getActFn({ data: { id: ref } })
  if (!r.ok) return null
  const acc = r.data.bankAccount
  const pix = r.data.pixKey
  if (acc === null && pix === null) return null
  return {
    line: acc !== null ? `${acc.bank} · Ag ${acc.agency} · CC ${acc.accountNumber}` : '',
    pix: pix !== null ? `PIX · ${pix.key}` : null,
  }
}

export function usePartnerHydration(supplierRef: string, kind: PartnerKind | null): PartnerHydration {
  const enabled = supplierRef !== '' && kind !== null
  const query = useQuery({
    queryKey: ['financial', 'partner-hydration', kind, supplierRef] as const,
    enabled,
    queryFn: async (): Promise<PartnerHydration> => {
      if (kind === null) return EMPTY_HYDRATION
      // Contratos "Em Andamento" do parceiro — filtro server-side por contraparte (#116): só os deste
      // parceiro voltam (não mais "1ª página + filtro no client"). contractorType = kind (mesmos literais).
      const contracts = await listContractsFn({
        data: {
          status: 'Em Andamento',
          contractorId: supplierRef,
          contractorType: kind,
          page: 1,
          limit: 100,
          order: 'DESC',
        },
      })
      // TODOS os contratos "Em Andamento" do parceiro (pode haver mais de um → "Alterar" no chip).
      const partnerContracts = contracts.ok
        ? contracts.data.items.filter((c) => contractMatchesPartner(c, supplierRef, kind)).map(toContract)
        : []

      // Banco: detalhe do favorecido conforme o tipo (todos têm bankAccount/pixKey + get*Fn).
      const bank = await loadPartnerBank(kind, supplierRef)

      return { bank, contracts: partnerContracts }
    },
  })
  return query.data ?? EMPTY_HYDRATION
}
