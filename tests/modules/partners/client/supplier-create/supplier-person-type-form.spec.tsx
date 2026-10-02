/**
 * Chave "Pessoa Jurídica | Pessoa Física" no formulário de fornecedor (#1022) — vitest/jsdom.
 *  - começa em PJ (CNPJ + Razão Social + Nome Fantasia);
 *  - em PF, Razão Social e Nome Fantasia SOMEM (decisão da P.O.), o documento vira CPF e "Nome" vira
 *    "Nome Completo"; voltar para PJ devolve o que foi digitado;
 *  - na edição sem permissão, a chave aparece bloqueada E diz o motivo.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import { SupplierForm } from '#modules/partners/client/supplier-create/components/supplier-form.component.tsx'
import { useSupplierFormController } from '#modules/partners/client/supplier-create/components/supplier-form.controller.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (key: string): string => ptBR[key] ?? key

afterEach(() => {
  cleanup()
})

const noop = (): void => undefined

function Harness(props: Readonly<{ documentLocked?: boolean }>): ReactNode {
  const controller = useSupplierFormController({ onSubmit: noop })
  return (
    <SupplierForm
      controller={controller}
      categories={['Limpeza']}
      canEditSensitive={false}
      documentLocked={props.documentLocked}
      running={false}
      errorTag={null}
      onCancel={noop}
      onBack={noop}
    />
  )
}

const option = (key: 'PJ' | 'PF'): HTMLButtonElement =>
  screen.getByRole('button', { name: tr(`partners.suppliers.personType.${key}`) }) as HTMLButtonElement

describe('SupplierForm — tipo de pessoa (#1022)', () => {
  it('começa em Pessoa Jurídica, com CNPJ, Razão Social e Nome Fantasia', () => {
    render(<Harness />)
    expect(option('PJ').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByLabelText(tr('partners.suppliers.form.cnpj'))).toBeTruthy()
    expect(document.getElementById('sup-corp')).not.toBeNull()
    expect(document.getElementById('sup-fant')).not.toBeNull()
  })

  it('Pessoa Física: Razão Social e Nome Fantasia somem; CPF e "Nome Completo"', () => {
    render(<Harness />)
    fireEvent.click(option('PF'))
    expect(option('PF').getAttribute('aria-pressed')).toBe('true')
    expect(document.getElementById('sup-corp')).toBeNull()
    expect(document.getElementById('sup-fant')).toBeNull()
    expect(screen.getByLabelText(tr('partners.suppliers.form.cpf'))).toBeTruthy()
    expect(screen.getByLabelText(tr('partners.suppliers.form.fullName'))).toBeTruthy()
  })

  it('o CPF é mascarado como CPF e trocar de tipo limpa o documento', () => {
    render(<Harness />)
    fireEvent.click(option('PF'))
    const doc = document.getElementById('sup-document') as HTMLInputElement
    fireEvent.change(doc, { target: { value: '52998224725' } })
    expect(doc.value).toBe('529.982.247-25')
    fireEvent.click(option('PJ'))
    expect((document.getElementById('sup-document') as HTMLInputElement).value).toBe('')
  })

  it('voltar para PJ devolve a Razão Social digitada antes', () => {
    render(<Harness />)
    fireEvent.change(document.getElementById('sup-corp') as HTMLInputElement, {
      target: { value: 'Acme LTDA' },
    })
    fireEvent.click(option('PF'))
    fireEvent.click(option('PJ'))
    expect((document.getElementById('sup-corp') as HTMLInputElement).value).toBe('Acme LTDA')
  })

  it('sem permissão de dado sensível: chave e documento bloqueados, com o motivo escrito', () => {
    render(<Harness documentLocked />)
    expect(option('PJ').disabled).toBe(true)
    expect(option('PF').disabled).toBe(true)
    expect((document.getElementById('sup-document') as HTMLInputElement).disabled).toBe(true)
    expect(screen.getByText(tr('partners.suppliers.form.personTypeLocked'))).toBeTruthy()
  })
})
