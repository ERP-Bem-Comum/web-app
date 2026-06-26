import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildHistoricoRows,
  contractSaldoText,
} from '../../../../../src/modules/contracts/client/contract-list/contract-list.view-model.ts'
import type { ContractRow } from '../../../../../src/modules/contracts/client/domain/types.ts'
import type { ContractPayment } from '../../../../../src/modules/financial/public-api/index.ts'

const pay = (over: Partial<ContractPayment>): ContractPayment => ({
  documentNumber: '100',
  documentType: 'Boleto',
  paidAt: '2026-06-10',
  grossValueCents: '100000', // R$ 1.000,00
  ...over,
})

describe('buildHistoricoRows (Histórico de Pagamento)', () => {
  it('ordena por data de pagamento ASC (mais antigo no topo) e numera 1,2,3…', () => {
    const rows = buildHistoricoRows(50000, 'Padaria X', [
      pay({ documentNumber: 'B', paidAt: '2026-06-20' }),
      pay({ documentNumber: 'A', paidAt: '2026-06-05' }),
      pay({ documentNumber: 'C', paidAt: '2026-06-12' }),
    ])
    assert.deepEqual(
      rows.map((r) => [r.index, r.document, r.date]),
      [
        ['1', 'A', '05/06/2026'],
        ['2', 'C', '12/06/2026'],
        ['3', 'B', '20/06/2026'],
      ],
    )
  })

  it('deduz o saldo do contrato em CASCATA a partir do saldo inicial (reais)', () => {
    const rows = buildHistoricoRows(20500, 'Padaria X', [
      pay({ paidAt: '2026-06-05', grossValueCents: '987600' }), // R$ 9.876,00
      pay({ paidAt: '2026-06-20', grossValueCents: '345000' }), // R$ 3.450,00
    ])
    // bruto exibido
    assert.equal(rows[0]?.gross, 'R$ 9.876,00')
    // saldo: 20.500 − 9.876 = 10.624 ; depois 10.624 − 3.450 = 7.174
    assert.equal(rows[0]?.balance, 'R$ 10.624,00')
    assert.equal(rows[1]?.balance, 'R$ 7.174,00')
  })

  it('pagamentos sem data vão para o fim; documento/forma ausentes viram "—"', () => {
    const rows = buildHistoricoRows(10000, 'X', [
      pay({ documentNumber: null, paidAt: null, documentType: '—' }),
      pay({ documentNumber: '7', paidAt: '2026-06-01' }),
    ])
    assert.equal(rows[0]?.document, '7') // o datado vem primeiro
    assert.equal(rows[1]?.date, '—')
    assert.equal(rows[1]?.document, '—')
  })

  it('lista vazia → nenhuma linha', () => {
    assert.equal(buildHistoricoRows(10000, 'X', []).length, 0)
  })
})

describe('coluna Tipo = tipo do DOCUMENTO (não a forma de pagamento)', () => {
  it('a linha usa o documentType', () => {
    const rows = buildHistoricoRows(10000, 'X', [pay({ documentType: 'NFS-e' })])
    assert.equal(rows[0]?.type, 'NFS-e')
  })
})

describe('contractSaldoText (Saldo do grid de contratos)', () => {
  const mkRow = (over: Partial<ContractRow>): ContractRow => over as unknown as ContractRow
  it('saldo = valor − Σ bruto conciliado (centavos); sem pagamentos → valor cheio', () => {
    const row = mkRow({ id: 'ct-1' as ContractRow['id'], currentValue: 88250 })
    // 657567 (987600) + 345 (345000) = 1.332.600 centavos = R$ 13.326,00 → 88.250 − 13.326 = 74.924
    // (compara só a parte numérica: formatCurrency usa espaço não-quebrável entre "R$" e o número)
    assert.ok(contractSaldoText(row, { 'ct-1': 1332600 }).includes('74.924,00'))
    assert.ok(contractSaldoText(row, {}).includes('88.250,00'))
  })
})
