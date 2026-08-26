/**
 * BankSelect — o seletor de banco pelo código FEBRABAN.
 *
 * O caso que estes testes existem para travar é o do VALOR LEGADO: o cadastro de parceiro guardava o
 * banco como texto livre, então há registros com "Bradesco" escrito à mão. Se o seletor deixasse esse
 * valor cair, abrir e salvar um fornecedor apagaria o banco dele em silêncio — e a descoberta seria a
 * recusa do pagamento pelo banco, semanas depois.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { BankSelect, isUnknownBank } from '#shared/ui/brand/bank-select.component.tsx'

afterEach(() => {
  cleanup()
})

const LABELS = {
  placeholder: 'Selecione o banco…',
  frequentGroup: 'Mais usados',
  allGroup: 'Todos os bancos',
  unknownPrefix: 'Não reconhecido:',
} as const

const renderSelect = (value: string, onChange = vi.fn()) => {
  render(<BankSelect id="b" value={value} labels={LABELS} ariaLabel="Banco" onChange={onChange} />)
  return { select: screen.getByRole('combobox') as HTMLSelectElement, onChange }
}

describe('BankSelect', () => {
  it('mostra os dois grupos (mais usados + tabela completa)', () => {
    renderSelect('')
    expect(screen.getByRole('group', { name: 'Mais usados' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Todos os bancos' })).toBeTruthy()
  })

  it('vazio: fica no placeholder, sem escolher banco por conta própria', () => {
    const { select } = renderSelect('')
    expect(select.value).toBe('')
  })

  it('código conhecido: seleciona e exibe "código · nome"', () => {
    const { select } = renderSelect('237')
    expect(select.value).toBe('237')
    expect(screen.getAllByRole('option', { name: '237 · Bradesco' }).length).toBeGreaterThan(0)
  })

  it('VALOR LEGADO: mantém o texto livre selecionado e marcado como não reconhecido', () => {
    const { select } = renderSelect('Bradesco')
    expect(select.value).toBe('Bradesco')
    expect(screen.getByRole('option', { name: 'Não reconhecido: Bradesco' })).toBeTruthy()
  })

  it('escolher um banco devolve só o CÓDIGO', () => {
    const { select, onChange } = renderSelect('')
    fireEvent.change(select, { target: { value: '341' } })
    expect(onChange).toHaveBeenCalledWith('341')
  })

  it('desabilitado continua mostrando o banco (a tela de detalhe lê fora do modo edição)', () => {
    render(<BankSelect id="b" value="104" labels={LABELS} disabled ariaLabel="Banco" onChange={vi.fn()} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.disabled).toBe(true)
    expect(select.value).toBe('104')
  })

  it('isUnknownBank: só o texto fora da tabela é "desconhecido"', () => {
    expect(isUnknownBank('')).toBe(false)
    expect(isUnknownBank('237')).toBe(false)
    expect(isUnknownBank('Bradesco')).toBe(true)
  })
})
