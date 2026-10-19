/**
 * Dados pessoais imutáveis DEPOIS DE REGISTRADOS (spec 124, P.O. 12/10 + 19/10) — vitest/jsdom.
 *  - a trava é POR CAMPO e olha o GRAVADO: RG, nascimento ou raça já registrados → desativados e dizendo o
 *    porquê; o que ainda falta segue editável (o PUT preenche — core-api#1070);
 *  - o que pode mudar (endereço, escolaridade) segue habilitado;
 *  - digitar num campo vazio não o trava (a trava vem do detalhe carregado, não do form);
 *  - o PUT leva os três (`buildPre`), e vazio vai ausente (mantém o gravado).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

import { CollaboratorDetailContent } from '#modules/partners/client/collaborator-detail/components/collaborator-detail-content.component.tsx'
import {
  lockedPersonalFrom,
  useCollaboratorDetailFormController,
} from '#modules/partners/client/collaborator-detail/components/collaborator-detail-form.controller.ts'
import type { CollaboratorDetail } from '#modules/partners/client/data/model/collaborator.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (key: string): string => ptBR[key] ?? key
const HINT = tr('partners.collaborators.form.personalLocked')

afterEach(() => {
  cleanup()
})

const base: CollaboratorDetail = {
  id: 'c-1',
  name: 'Fulana',
  email: 'f@x.org',
  occupationArea: 'PARC',
  role: 'Dev',
  registration: 'complete',
  activation: 'active',
  contractCount: 0,
  cpf: '52998224725',
  startOfContract: '2024-01-01T00:00:00.000Z',
  employmentRelationship: 'CLT',
  territory: null,
  bankAccount: null,
  pixKey: null,
}

const allFilled: CollaboratorDetail = {
  ...base,
  rg: '12.345.678-9',
  dateOfBirth: '1990-05-20',
  race: 'PARDO',
}

function Harness(props: Readonly<{ editing: boolean; detail: CollaboratorDetail }>): ReactNode {
  const controller = useCollaboratorDetailFormController(props.detail)
  return (
    <>
      <CollaboratorDetailContent
        controller={controller}
        editing={props.editing}
        showComplete
        preTitle=""
        lockedPersonal={lockedPersonalFrom(props.detail)}
      />
      {/* O que o PUT levaria agora — lido pelo teste do `buildPre`. */}
      <output data-testid="pre">{JSON.stringify(controller.buildPre())}</output>
    </>
  )
}

const pre = (): Readonly<{ rg?: string; dateOfBirth?: string; race?: string }> =>
  JSON.parse(screen.getByTestId('pre').textContent ?? '{}') as Readonly<{
    rg?: string
    dateOfBirth?: string
    race?: string
  }>

const control = (id: string): HTMLInputElement | HTMLSelectElement =>
  document.getElementById(id) as HTMLInputElement | HTMLSelectElement

describe('Detalhe do colaborador — dados pessoais travam quando já registrados (spec 124)', () => {
  it('os três registrados + Editar: travados com o motivo; endereço e escolaridade livres', () => {
    render(<Harness editing detail={allFilled} />)
    expect(control('cd-dateOfBirth').disabled).toBe(true)
    expect(control('cd-rg').disabled).toBe(true)
    expect(control('cd-race').disabled).toBe(true)
    expect(screen.getAllByText(HINT)).toHaveLength(3)
    expect(control('cd-completeAddress').disabled).toBe(false)
    expect(control('cd-education').disabled).toBe(false)
  })

  it('cadastro completo SEM os três (caso da tela da P.O.): os três editáveis, sem o aviso', () => {
    render(<Harness editing detail={base} />)
    expect(control('cd-dateOfBirth').disabled).toBe(false)
    expect(control('cd-rg').disabled).toBe(false)
    expect(control('cd-race').disabled).toBe(false)
    expect(screen.queryByText(HINT)).toBeNull()
  })

  it('só o RG registrado: trava só o RG', () => {
    render(<Harness editing detail={{ ...base, rg: '12.345.678-9' }} />)
    expect(control('cd-rg').disabled).toBe(true)
    expect(control('cd-dateOfBirth').disabled).toBe(false)
    expect(control('cd-race').disabled).toBe(false)
    expect(screen.getAllByText(HINT)).toHaveLength(1)
  })

  it('digitar num campo vazio não o trava (a trava vem do gravado)', () => {
    render(<Harness editing detail={base} />)
    fireEvent.change(control('cd-rg'), { target: { value: '99.888.777-6' } })
    expect(control('cd-rg').disabled).toBe(false)
    expect(screen.queryByText(HINT)).toBeNull()
  })

  it('pré-cadastro (nada registrado): os três editáveis', () => {
    render(<Harness editing detail={{ ...base, registration: 'pre-registration' }} />)
    expect(control('cd-dateOfBirth').disabled).toBe(false)
    expect(control('cd-rg').disabled).toBe(false)
    expect(control('cd-race').disabled).toBe(false)
  })

  it('fora do modo Editar: sem o aviso', () => {
    render(<Harness editing={false} detail={allFilled} />)
    expect(screen.queryByText(HINT)).toBeNull()
  })

  it('o PUT leva os três preenchidos; vazio vai ausente (mantém o gravado)', () => {
    render(<Harness editing detail={base} />)
    fireEvent.change(control('cd-race'), { target: { value: 'PRETO' } })
    expect(pre().race).toBe('PRETO')
    expect(pre().rg).toBeUndefined()
    expect(pre().dateOfBirth).toBeUndefined()
  })
})
