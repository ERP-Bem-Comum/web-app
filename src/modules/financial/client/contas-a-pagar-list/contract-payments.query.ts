/**
 * Pagamentos CONCILIADOS de um contrato — fonte do relatório "Histórico de Pagamento" do módulo Contratos
 * (consumido via public-api, §I). Conciliado = execução contratual de fato (o pagamento casou no extrato).
 * Reusa o read de payable-titles (status Conciliado, só `Parent` = o documento; os `Child` são retenções)
 * e casa pelo `contractRef`. Devolve um DTO LIMPO já rotulado — o contrato não vê o `PayableTitleItem`.
 */
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'

const DASH = '—'

export type ContractPayment = Readonly<{
  documentNumber: string | null
  documentType: string // tipo do DOCUMENTO (NFS-e/DANFE/Boleto…) ou "—"
  paidAt: string | null // data da baixa (ISO YYYY-MM-DD) ou null
  grossValueCents: string | null // valor bruto do documento (centavos)
}>

// Busca os títulos CONCILIADOS do fornecedor do contrato (estreita a busca; o filtro do core-api traduz
// 'Conciliado'→'Reconciled') e casa pelo `contractRef`. `supplierRef` opcional: sem ele, varre os
// conciliados (até 200) e casa pelo contrato mesmo assim.
export const contractPaymentsQueryOptions = (contractRef: string, supplierRef: string | undefined) => ({
  queryKey: ['financial', 'contract-payments', contractRef, supplierRef] as const,
  retry: 1, // relatório: 1 tentativa basta; em erro o queryFn já cai p/ lista vazia

  queryFn: async (): Promise<readonly ContractPayment[]> => {
    const res = await financialRepository.listPayableTitles({
      status: 'Conciliado',
      ...(supplierRef !== undefined ? { supplierRef } : {}),
      page: 1,
      pageSize: 100, // máximo aceito pelo schema do server-fn; o supplierRef já estreita a um fornecedor
    })
    if (!res.ok) return []
    return res.value.items
      .filter((it) => it.kind === 'Parent' && it.contractRef === contractRef)
      .map((it) => ({
        documentNumber: it.documentNumber,
        documentType: it.type ?? DASH,
        paidAt: it.paidAt,
        grossValueCents: it.grossValueCents,
      }))
  },
  staleTime: 30_000,
})

// Total do valor BRUTO conciliado por contrato (todos os contratos) — alimenta a coluna "Saldo" do grid
// de contratos (saldo = valor do contrato − Σ bruto conciliado). Uma chamada agrega por `contractRef`.
export const reconciledGrossByContractQueryOptions = () => ({
  queryKey: ['financial', 'reconciled-gross-by-contract'] as const,
  retry: 1,
  queryFn: async (): Promise<Readonly<Record<string, number>>> => {
    const res = await financialRepository.listPayableTitles({ status: 'Conciliado', page: 1, pageSize: 100 })
    if (!res.ok) return {}
    const acc: Record<string, number> = {}
    for (const it of res.value.items) {
      if (it.kind !== 'Parent' || it.contractRef === null) continue
      const g = it.grossValueCents !== null ? Number.parseInt(it.grossValueCents, 10) || 0 : 0
      acc[it.contractRef] = (acc[it.contractRef] ?? 0) + g
    }
    return acc
  },
  staleTime: 30_000,
})
