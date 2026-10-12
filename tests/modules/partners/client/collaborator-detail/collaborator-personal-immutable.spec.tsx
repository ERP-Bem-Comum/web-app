/**
 * Dados pessoais imutáveis depois do cadastro (spec 124, P.O. 12/10) — vitest/jsdom.
 *  - colaborador CADASTRADO, modo Editar: data de nascimento, RG e raça/cor desativados e dizendo o porquê;
 *    o que pode mudar (endereço, escolaridade) segue habilitado;
 *  - PRÉ-CADASTRO: os três seguem editáveis — é ali que o operador completa o cadastro.
 */
import type { ReactNode } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { CollaboratorDetailContent } from '#modules/partners/client/collaborator-detail/components/collaborator-detail-content.component.tsx'
import { useCollaboratorDetailFormController } from '#modules/partners/client/collaborator-detail/components/collaborator-detail-form.controller.ts'
import type { CollaboratorDetail } from '#modules/partners/client/data/model/collaborator.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (key: string): string => ptBR[key] ?? key
const HINT = tr('partners.collaborators.form.personalLocked')

afterEach(() => {
  cleanup()
})

const detail: CollaboratorDetail = {
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

function Harness(props: Readonly<{ editing: boolean; registrationComplete: boolean }>): ReactNode {
  const controller = useCollaboratorDetailFormController(detail)
  return (
    <CollaboratorDetailContent
      controller={controller}
      editing={props.editing}
      showComplete
      preTitle=""
      registrationComplete={props.registrationComplete}
    />
  )
}

const control = (id: string): HTMLInputElement | HTMLSelectElement =>
  document.getElementById(id) as HTMLInputElement | HTMLSelectElement

describe('Detalhe do colaborador — dados pessoais imutáveis (spec 124)', () => {
  it('cadastrado + Editar: nascimento, RG e raça travados com o motivo; endereço e escolaridade livres', () => {
    render(<Harness editing registrationComplete />)
    expect(control('cd-dateOfBirth').disabled).toBe(true)
    expect(control('cd-rg').disabled).toBe(true)
    expect(control('cd-race').disabled).toBe(true)
    expect(screen.getAllByText(HINT)).toHaveLength(3)
    expect(control('cd-completeAddress').disabled).toBe(false)
    expect(control('cd-education').disabled).toBe(false)
  })

  it('pré-cadastro + Editar: os três seguem editáveis, sem o aviso', () => {
    render(<Harness editing registrationComplete={false} />)
    expect(control('cd-dateOfBirth').disabled).toBe(false)
    expect(control('cd-rg').disabled).toBe(false)
    expect(control('cd-race').disabled).toBe(false)
    expect(screen.queryByText(HINT)).toBeNull()
  })

  it('fora do modo Editar: sem o aviso', () => {
    render(<Harness editing={false} registrationComplete />)
    expect(screen.queryByText(HINT)).toBeNull()
  })
})
