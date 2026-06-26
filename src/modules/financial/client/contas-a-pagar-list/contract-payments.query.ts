/**
 * Pagamentos CONCILIADOS de um contrato — fonte do relatório "Histórico de Pagamento" do módulo Contratos
 * (consumido via public-api, §I). Conciliado = execução contratual de fato (o pagamento casou no extrato).
 * Reusa o read de payable-titles (status Conciliado, só `Parent` = o documento; os `Child` são retenções)
 * e casa pelo `contractRef`. Devolve um DTO LIMPO já rotulado — o contrato não vê o `PayableTitleItem`.
 */
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { PaymentMethod } from '#modules/financial/client/data/model/document.model.ts'

const DASH = '—'

export type ContractPayment = Readonly<{
  documentNumber: string | null
  paymentLabel: string // forma de pagamento já rotulada (PT)
  paidAt: string | null // data da baixa (ISO YYYY-MM-DD) ou null
  grossValueCents: string | null // valor bruto do documento (centavos)
}>

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  TED: 'TED',
  TransferenciaBancaria: 'Transferência bancária',
  PIX: 'PIX',
  Boleto: 'Boleto',
  CartaoCorporativo: 'Cartão corporativo',
  Cambio: 'Câmbio',
  GuiaRecolhimento: 'Guia de recolhimento',
  Outro: 'Outro',
}

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
        paymentLabel: it.paymentMethod === null ? DASH : PAYMENT_LABEL[it.paymentMethod],
        paidAt: it.paidAt,
        grossValueCents: it.grossValueCents,
      }))
  },
  staleTime: 30_000,
})
