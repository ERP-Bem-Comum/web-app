/**
 * Avaliação de serviço no formulário de fornecedor (§1.6) — vitest/jsdom.
 *  - o <select> de avaliação está HABILITADO e renderiza "Sem avaliação" + os 4 níveis;
 *  - o campo de comentário está editável;
 *  - o controller emite serviceRating/ratingComment no submit (null quando sem avaliação).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, renderHook, act } from '@testing-library/react'

import { SupplierForm } from '#modules/partners/client/supplier-create/components/supplier-form.component.tsx'
import { useSupplierFormController } from '#modules/partners/client/supplier-create/components/supplier-form.controller.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (key: string): string => ptBR[key] ?? key

afterEach(() => {
  cleanup()
})

const noop = (): void => undefined

function Harness(): ReactNode {
  const controller = useSupplierFormController({ onSubmit: noop })
  return (
    <SupplierForm
      controller={controller}
      categories={['Limpeza']}
      canEditSensitive={false}
      running={false}
      errorTag={null}
      onCancel={noop}
    />
  )
}

describe('SupplierForm — avaliação de serviço habilitada (§1.6)', () => {
  it('o select de avaliação está habilitado e lista "Sem avaliação" + 4 níveis', () => {
    render(<Harness />)
    const select = screen.getByLabelText(tr('partners.suppliers.form.serviceRating')) as HTMLSelectElement
    expect(select.disabled).toBe(false)
    const optionLabels = Array.from(select.options).map((o) => o.textContent)
    expect(optionLabels).toContain(tr('partners.suppliers.rating.none'))
    expect(optionLabels).toContain(tr('partners.suppliers.rating.RUIM'))
    expect(optionLabels).toContain(tr('partners.suppliers.rating.REGULAR'))
    expect(optionLabels).toContain(tr('partners.suppliers.rating.BOM'))
    expect(optionLabels).toContain(tr('partners.suppliers.rating.OTIMO'))
  })

  it('o campo de comentário está editável (não-desabilitado)', () => {
    render(<Harness />)
    const comment = document.getElementById('sup-rating-comment') as HTMLInputElement
    expect(comment.disabled).toBe(false)
    fireEvent.change(comment, { target: { value: 'Atende bem' } })
    expect(comment.value).toBe('Atende bem')
  })
})

describe('useSupplierFormController — avaliação no submit', () => {
  const fillRequired = (r: ReturnType<typeof useSupplierFormController>): void => {
    r.setField('name', 'Acme')
    r.setField('corporateName', 'Acme LTDA')
    r.setField('fantasyName', 'Acme')
    r.setField('email', 'c@acme.dev')
    r.setField('cnpj', '12345678000190')
    r.setField('serviceCategory', 'Limpeza')
  }

  it('emite serviceRating/ratingComment quando avaliado', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSupplierFormController({ onSubmit }))
    act(() => {
      fillRequired(result.current)
      result.current.setField('serviceRating', 'BOM')
      result.current.setField('ratingComment', 'Atende bem')
    })
    act(() => { result.current.submit() })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const values = onSubmit.mock.calls[0]?.[0] as { serviceRating: unknown; ratingComment: unknown }
    expect(values.serviceRating).toBe('BOM')
    expect(values.ratingComment).toBe('Atende bem')
  })

  it('emite null quando sem avaliação (opção vazia)', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSupplierFormController({ onSubmit }))
    act(() => { fillRequired(result.current) })
    act(() => { result.current.submit() })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const values = onSubmit.mock.calls[0]?.[0] as { serviceRating: unknown; ratingComment: unknown }
    expect(values.serviceRating).toBeNull()
    expect(values.ratingComment).toBeNull()
  })
})
