/**
 * Resumo dos filtros aplicados — funções PURAS (node:test, sem DOM). Cobre: montagem das partes só das
 * dimensões setadas, resolução UUID→rótulo (com fallback ao value cru quando ausente da lista), formatação de
 * data `YYYY-MM-DD`→`DD/MM/AAAA` e o intervalo de vencimento (ambas / só início / só fim / nenhuma).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildFilterSummaryParts,
  resolveDimensionLabel,
  formatIsoDateBR,
  formatDueRange,
  type FilterOption,
} from '../../../../src/modules/reports/client/filters-summary.view-model.ts'

const PLANOS: readonly FilterOption[] = [
  { value: 'p-1', label: '2026 GOD 1.0' },
  { value: 'p-2', label: '2026 ABC 2.0' },
]
const WORDS = { fromPrefix: 'a partir de', toPrefix: 'até' }

describe('formatIsoDateBR', () => {
  it('YYYY-MM-DD → DD/MM/AAAA', () => {
    assert.equal(formatIsoDateBR('2026-07-01'), '01/07/2026')
    assert.equal(formatIsoDateBR('2026-12-31'), '31/12/2026')
  })
  it('malformado → a própria string (sem Invalid Date)', () => {
    assert.equal(formatIsoDateBR('lixo'), 'lixo')
    assert.equal(formatIsoDateBR(''), '')
  })
})

describe('formatDueRange', () => {
  it('ambas as datas → "DD/MM/AAAA – DD/MM/AAAA"', () => {
    assert.equal(formatDueRange('2026-07-01', '2026-09-01', WORDS), '01/07/2026 – 01/09/2026')
  })
  it('só início → "a partir de …"', () => {
    assert.equal(formatDueRange('2026-07-01', '', WORDS), 'a partir de 01/07/2026')
  })
  it('só fim → "até …"', () => {
    assert.equal(formatDueRange('', '2026-09-01', WORDS), 'até 01/09/2026')
  })
  it('nenhuma → "" (dimensão pulada)', () => {
    assert.equal(formatDueRange('', '', WORDS), '')
  })
})

describe('resolveDimensionLabel', () => {
  it('value vazio → null (pula)', () => {
    assert.equal(resolveDimensionLabel({ label: 'Plano', value: '', options: PLANOS }), null)
  })
  it('UUID presente na lista → rótulo', () => {
    assert.equal(resolveDimensionLabel({ label: 'Plano', value: 'p-1', options: PLANOS }), '2026 GOD 1.0')
  })
  it('UUID ausente da lista → cai no próprio value (nunca some)', () => {
    assert.equal(resolveDimensionLabel({ label: 'Plano', value: 'p-999', options: PLANOS }), 'p-999')
  })
  it('sem options → usa o value cru (ex.: período já formatado)', () => {
    assert.equal(
      resolveDimensionLabel({ label: 'Período', value: '01/07/2026 – 01/09/2026' }),
      '01/07/2026 – 01/09/2026',
    )
  })
})

describe('buildFilterSummaryParts', () => {
  it('só as dimensões setadas viram "Rótulo: valor"; as vazias são puladas', () => {
    const parts = buildFilterSummaryParts([
      { label: 'Plano', value: 'p-1', options: PLANOS },
      { label: 'Conta', value: '', options: [] }, // pulada
      { label: 'Período', value: '01/07/2026 – 01/09/2026' },
    ])
    assert.deepEqual(parts, ['Plano: 2026 GOD 1.0', 'Período: 01/07/2026 – 01/09/2026'])
  })

  it('nenhuma dimensão setada → [] (a view não renderiza a linha)', () => {
    const parts = buildFilterSummaryParts([
      { label: 'Plano', value: '', options: PLANOS },
      { label: 'Período', value: '' },
    ])
    assert.deepEqual(parts, [])
  })

  it('UUID ausente da lista → mostra o value cru (não some do resumo)', () => {
    const parts = buildFilterSummaryParts([{ label: 'Plano', value: 'p-orfao', options: PLANOS }])
    assert.deepEqual(parts, ['Plano: p-orfao'])
  })
})
