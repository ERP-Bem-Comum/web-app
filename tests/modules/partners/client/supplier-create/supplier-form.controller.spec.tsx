import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import {
  useSupplierFormController,
  switchPersonType,
  type SupplierFormState,
  type SupplierFormValues,
} from '#modules/partners/client/supplier-create/components/supplier-form.controller.ts'

describe('useSupplierFormController', () => {
  it('bloqueia submit inválido: não chama onSubmit e marca erros', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSupplierFormController({ onSubmit }))

    act(() => {
      result.current.submit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)
  })

  it('submit válido: emite os valores com CNPJ normalizado e grupos opcionais nulos', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSupplierFormController({ onSubmit }))

    act(() => {
      result.current.setField('name', 'Acme')
      result.current.setField('corporateName', 'Acme LTDA')
      result.current.setField('fantasyName', 'Acme')
      result.current.setField('email', 'c@acme.dev')
      result.current.setField('document', '12.345.678/0001-90')
      result.current.setField('serviceCategory', 'Limpeza')
    })
    act(() => {
      result.current.submit()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const values = onSubmit.mock.calls[0]?.[0] as { document: string; bankAccount: unknown; pixKey: unknown }
    expect(values.document).toBe('12345678000190')
    expect(values.bankAccount).toBeNull()
    expect(values.pixKey).toBeNull()
  })

  it('grupo bancário parcialmente preenchido (sem checkbox) bloqueia o submit', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSupplierFormController({ onSubmit }))

    act(() => {
      result.current.setField('name', 'Acme')
      result.current.setField('corporateName', 'Acme LTDA')
      result.current.setField('fantasyName', 'Acme')
      result.current.setField('email', 'c@acme.dev')
      result.current.setField('document', '12345678000190')
      result.current.setField('serviceCategory', 'Limpeza')
      result.current.setField('bank', '341') // só o banco → grupo bancário incompleto
    })
    act(() => {
      result.current.submit()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  // ── Banco: o campo virou CÓDIGO de compensação (era texto livre). Ao ABRIR um cadastro antigo, o
  // controller converte o que dá para reconhecer sem ambiguidade e PRESERVA o resto — nunca apaga.
  const withBank = (bank: string): SupplierFormValues => ({
    personType: 'PJ',
    name: 'Acme',
    corporateName: 'Acme LTDA',
    fantasyName: 'Acme',
    email: 'c@acme.dev',
    document: '12345678000190',
    serviceCategory: 'Limpeza',
    bankAccount: { bank, agency: '12345', accountNumber: '9876', checkDigit: '1' },
    pixKey: null,
    serviceRating: null,
    ratingComment: null,
  })

  it('cadastro legado: "0237" abre já normalizado para o código "237"', () => {
    const { result } = renderHook(() =>
      useSupplierFormController({ initial: withBank('0237'), onSubmit: vi.fn() }),
    )
    expect(result.current.state.bank).toBe('237')
  })

  it('cadastro legado: "341 - Itaú" abre já normalizado para "341"', () => {
    const { result } = renderHook(() =>
      useSupplierFormController({ initial: withBank('341 - Itaú'), onSubmit: vi.fn() }),
    )
    expect(result.current.state.bank).toBe('341')
  })

  it('cadastro legado irreconhecível é PRESERVADO, não apagado', () => {
    const { result } = renderHook(() =>
      useSupplierFormController({ initial: withBank('Bradesco'), onSubmit: vi.fn() }),
    )
    expect(result.current.state.bank).toBe('Bradesco')
  })
})

// ── Fornecedor pessoa física (#1022) ──
describe('switchPersonType (PJ ↔ PF)', () => {
  const pj: SupplierFormState = {
    personType: 'PJ',
    name: 'Acme',
    corporateName: 'Acme LTDA',
    fantasyName: 'Acme',
    email: 'c@acme.dev',
    document: '12345678000190',
    serviceCategory: 'Limpeza',
    bank: '',
    agency: '',
    accountNumber: '',
    checkDigit: '',
    pixKeyType: 'cnpj',
    pixKey: '12345678000190',
    serviceRating: '',
    ratingComment: '',
  }

  it('limpa o documento (um CNPJ não vira CPF) e guarda Razão Social/Nome Fantasia na tela', () => {
    const pf = switchPersonType(pj, 'PF')
    expect(pf.personType).toBe('PF')
    expect(pf.document).toBe('')
    expect(pf.corporateName).toBe('Acme LTDA')
    expect(pf.fantasyName).toBe('Acme')
    // Voltar para PJ devolve os nomes da empresa.
    const back = switchPersonType(pf, 'PJ')
    expect(back.corporateName).toBe('Acme LTDA')
    expect(back.fantasyName).toBe('Acme')
  })

  it('a chave PIX do documento acompanha a pessoa: tipo CPF na PF, e a chave antiga some', () => {
    const pf = switchPersonType(pj, 'PF')
    expect(pf.pixKeyType).toBe('cpf')
    expect(pf.pixKey).toBe('')
    expect(switchPersonType(pf, 'PJ').pixKeyType).toBe('cnpj')
  })

  it('chave PIX de outro tipo (e-mail) não é tocada', () => {
    const pf = switchPersonType({ ...pj, pixKeyType: 'email', pixKey: 'c@acme.dev' }, 'PF')
    expect(pf.pixKeyType).toBe('email')
    expect(pf.pixKey).toBe('c@acme.dev')
  })

  it('escolher o tipo já marcado não muda nada', () => {
    expect(switchPersonType(pj, 'PJ')).toBe(pj)
  })
})

describe('useSupplierFormController — pessoa física', () => {
  it('PF válida emite CPF normalizado e NÃO envia Razão Social/Nome Fantasia guardados na tela', () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useSupplierFormController({ onSubmit }))

    act(() => {
      result.current.setField('corporateName', 'Digitado antes')
      result.current.setField('fantasyName', 'Digitado antes')
      result.current.setPersonType('PF')
    })
    act(() => {
      result.current.setField('name', 'Maria da Silva')
      result.current.setField('email', 'maria@exemplo.dev')
      result.current.setField('document', '52998224725')
      result.current.setField('serviceCategory', 'Limpeza')
    })
    act(() => {
      result.current.submit()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const values = onSubmit.mock.calls[0]?.[0] as SupplierFormValues
    expect(values.personType).toBe('PF')
    expect(values.document).toBe('52998224725')
    expect(values.corporateName).toBeNull()
    expect(values.fantasyName).toBeNull()
  })

  it('a edição semeia a chave pelo personType do cadastro', () => {
    const initial: SupplierFormValues = {
      personType: 'PF',
      name: 'Maria da Silva',
      corporateName: null,
      fantasyName: null,
      email: 'maria@exemplo.dev',
      document: '52998224725',
      serviceCategory: 'Limpeza',
      bankAccount: null,
      pixKey: null,
      serviceRating: null,
      ratingComment: null,
    }
    const { result } = renderHook(() => useSupplierFormController({ initial, onSubmit: vi.fn() }))
    expect(result.current.state.personType).toBe('PF')
    expect(result.current.state.corporateName).toBe('')
  })
})
