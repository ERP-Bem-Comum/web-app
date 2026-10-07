/**
 * Spec 120 — dados bancários e PIX do colaborador editáveis no detalhe (vitest/jsdom).
 *  - no modo Editar, banco (seletor de código), agência, conta, DV, tipo e chave PIX habilitam;
 *  - fora dele, seguem somente leitura;
 *  - escolher a chave do tipo CPF preenche a chave com o CPF do cadastro;
 *  - banco parcial marca o erro ao validar; reset devolve os dados originais.
 */
import { useEffect, type ReactNode } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'

import { CollaboratorDetailContent } from '#modules/partners/client/collaborator-detail/components/collaborator-detail-content.component.tsx'
import {
  useCollaboratorDetailFormController,
  type CollaboratorDetailFormController,
} from '#modules/partners/client/collaborator-detail/components/collaborator-detail-form.controller.ts'
import type { CollaboratorDetail } from '#modules/partners/client/data/model/collaborator.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (key: string): string => ptBR[key] ?? key

afterEach(() => {
  cleanup()
})

const detail: CollaboratorDetail = {
  id: 'c-1',
  name: 'Fulana',
  email: 'f@x.org',
  occupationArea: 'PARC',
  role: 'Dev',
  registration: 'pre-registration',
  activation: 'active',
  contractCount: 0,
  cpf: '52998224725',
  startOfContract: '2024-01-01T00:00:00.000Z',
  employmentRelationship: 'CLT',
  territory: null,
  bankAccount: null,
  pixKey: null,
}

const BANK_IDS = ['cd-bank', 'cd-agency', 'cd-accountNumber', 'cd-checkDigit', 'cd-pix-type', 'cd-pixKey']

// O teste lê o controller vivo por aqui (o efeito roda a cada render, então é sempre o mais recente).
const sink: { current: CollaboratorDetailFormController | null } = { current: null }

function Harness(props: Readonly<{ editing: boolean; initial?: CollaboratorDetail }>): ReactNode {
  const controller = useCollaboratorDetailFormController(props.initial ?? detail)
  useEffect(() => {
    sink.current = controller
  })
  return (
    <CollaboratorDetailContent
      controller={controller}
      editing={props.editing}
      showComplete={false}
      preTitle=""
    />
  )
}

const el = (id: string): HTMLInputElement | HTMLSelectElement =>
  document.getElementById(id) as HTMLInputElement | HTMLSelectElement

describe('Detalhe do colaborador — dados bancários e PIX (spec 120)', () => {
  it('modo Editar: todos os campos bancários e de PIX habilitam', () => {
    render(<Harness editing />)
    for (const id of BANK_IDS) expect(el(id).disabled).toBe(false)
  })

  it('fora do modo Editar: seguem somente leitura', () => {
    render(<Harness editing={false} />)
    for (const id of BANK_IDS) expect(el(id).disabled).toBe(true)
  })

  it('banco é o seletor de códigos', () => {
    render(<Harness editing />)
    expect(el('cd-bank').tagName).toBe('SELECT')
    fireEvent.change(el('cd-bank'), { target: { value: '237' } })
    expect(sink.current?.state.bank).toBe('237')
  })

  it('chave PIX do tipo CPF mostra o CPF do colaborador', () => {
    render(<Harness editing />)
    fireEvent.change(el('cd-pix-type'), { target: { value: 'email' } })
    expect(el('cd-pixKey').value).toBe('f@x.org')
    fireEvent.change(el('cd-pix-type'), { target: { value: 'cpf' } })
    expect(el('cd-pixKey').value).toBe('52998224725')
  })

  it('banco parcial: validar recusa e marca o campo', () => {
    render(<Harness editing />)
    fireEvent.change(el('cd-bank'), { target: { value: '237' } })
    let ok = true
    act(() => {
      ok = sink.current?.validate(detail) ?? true
    })
    expect(ok).toBe(false)
    expect(screen.getAllByText(tr('partners.collaborators.form.invalid')).length).toBeGreaterThan(0)
    expect(sink.current?.buildPre().bankAccount).toEqual({
      bank: '237',
      agency: '',
      accountNumber: '',
      checkDigit: '',
    })
  })

  it('apagar dado já gravado: validar recusa e explica', () => {
    const gravado: CollaboratorDetail = {
      ...detail,
      bankAccount: { bank: '237', agency: '1234', accountNumber: '5678', checkDigit: '9' },
    }
    render(<Harness editing initial={gravado} />)
    for (const id of ['cd-agency', 'cd-accountNumber', 'cd-checkDigit']) {
      fireEvent.change(el(id), { target: { value: '' } })
    }
    fireEvent.change(el('cd-bank'), { target: { value: '' } })
    act(() => {
      sink.current?.validate(gravado)
    })
    expect(screen.getByText(tr('partners.collaborators.form.bankRemovalBlocked'))).toBeTruthy()
  })

  it('cancelar (reset) devolve os dados originais e limpa os erros', () => {
    const gravado: CollaboratorDetail = {
      ...detail,
      bankAccount: { bank: '237', agency: '1234', accountNumber: '5678', checkDigit: '9' },
    }
    render(<Harness editing initial={gravado} />)
    fireEvent.change(el('cd-accountNumber'), { target: { value: '' } })
    act(() => {
      sink.current?.validate(gravado)
    })
    act(() => {
      sink.current?.reset(gravado)
    })
    expect(el('cd-accountNumber').value).toBe('5678')
    expect(screen.queryByText(tr('partners.collaborators.form.invalid'))).toBeNull()
  })
})
