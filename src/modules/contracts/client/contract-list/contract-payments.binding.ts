/**
 * useContractHistoricoPayments — ADAPTER React p/ o Histórico de Pagamento: busca os pagamentos
 * CONCILIADOS do contrato via a public-api do Financeiro (§I — cross-módulo só por public-api). Habilita
 * só quando há um contrato-alvo; `ready` indica que a busca assentou (sucesso ou erro) → a página então
 * monta o documento e imprime.
 */
import { useQuery } from '@tanstack/react-query'

import {
  contractPaymentsQueryOptions,
  reconciledGrossByContractQueryOptions,
  type ContractPayment,
} from '#modules/financial/public-api/index.ts'

// Referência ESTÁVEL p/ o caso vazio — senão `q.data ?? []` criaria um array novo a cada render, e o
// efeito que depende de `payments` re-dispararia em loop (especialmente em loading/erro).
const EMPTY: readonly ContractPayment[] = []
const EMPTY_MAP: Readonly<Record<string, number>> = {}

export function useContractHistoricoPayments(
  contractRef: string | null,
  supplierRef: string | undefined,
): { readonly payments: readonly ContractPayment[]; readonly ready: boolean } {
  const q = useQuery({
    ...contractPaymentsQueryOptions(contractRef ?? '', supplierRef),
    enabled: contractRef !== null,
  })
  return {
    payments: q.data ?? EMPTY,
    ready: contractRef !== null && (q.isSuccess || q.isError),
  }
}

// Mapa contractRef → total do valor BRUTO conciliado (centavos), p/ a coluna "Saldo" do grid de contratos.
export function useReconciledGrossByContract(): Readonly<Record<string, number>> {
  const q = useQuery(reconciledGrossByContractQueryOptions())
  return q.data ?? EMPTY_MAP
}
