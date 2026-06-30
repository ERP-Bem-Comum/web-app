/**
 * Dados bancários do favorecido (drawer de Detalhe do Documento) — ADAPTER React. Resolve banco/PIX do
 * favorecido CLIENT-SIDE, sem depender de enriquecer o GET /:id (core-api#95), exatamente como a
 * "Conta do Favorecido" do Lançar Documento (`partner-hydration.binding.ts → loadPartnerBank`): dado o
 * `kind` do parceiro, chama o `get*Fn` certo (via public-api §I) e lê `bankAccount` + `pixKey`.
 *
 * O `kind` do favorecido sai do partners-map (`partners.data?.get(supplierRef)?.kind`); o `supplierRef`
 * vem do detalhe do documento. Sem ambos, a query fica desabilitada (drawer fechado / sem favorecido).
 */
import { useQuery } from '@tanstack/react-query'

import {
  getSupplierFn,
  getFinancierFn,
  getCollaboratorFn,
  getActFn,
  type PixKeyType,
} from '#modules/partners/public-api/index.ts'

import type { PartnerKind } from './contas-a-pagar.view-model.ts'

export type PayeeBankView = Readonly<{
  bankLine: string | null
  pixType: PixKeyType | null
  pixKey: string | null
}>

/** Conta bancária + PIX do favorecido conforme o TIPO (todos têm `get*Fn` e `bankAccount`/`pixKey`). */
async function loadPayeeBank(kind: PartnerKind, ref: string): Promise<PayeeBankView | null> {
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
  const bankLine = acc !== null ? `${acc.bank} · Ag ${acc.agency} · CC ${acc.accountNumber}` : null
  const pixType = pix?.keyType ?? null
  const pixKey = pix?.key ?? null
  if (bankLine === null && pixType === null && pixKey === null) return null
  return { bankLine, pixType, pixKey }
}

/**
 * Resolve banco/PIX do favorecido p/ o drawer. `enabled` só com `supplierRef` + `kind` ambos != null
 * (favorecido conhecido e tipo resolvido pelo partners-map). Retorna `null` enquanto carrega ou quando
 * o favorecido não tem dados bancários.
 */
export function usePayeeBank(supplierRef: string | null, kind: PartnerKind | null): PayeeBankView | null {
  const query = useQuery({
    queryKey: ['financial', 'payee-bank', kind, supplierRef] as const,
    enabled: supplierRef !== null && kind !== null,
    queryFn: async (): Promise<PayeeBankView | null> => {
      if (supplierRef === null || kind === null) return null
      return loadPayeeBank(kind, supplierRef)
    },
  })
  return query.data ?? null
}
