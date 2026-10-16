/**
 * CPF travado no detalhe do colaborador (decisão da P.O., 05/10) — vitest/jsdom.
 *  - no modo Editar, o CPF segue desativado e diz o porquê; os demais cadastrais habilitam;
 *  - fora do modo Editar, nada de explicação (o campo só está em leitura como os outros).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { CollaboratorDetailContent } from '#modules/partners/client/collaborator-detail/components/collaborator-detail-content.component.tsx'
import { useCollaboratorDetailFormController } from '#modules/partners/client/collaborator-detail/components/collaborator-detail-form.controller.ts'
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

function Harness(props: Readonly<{ editing: boolean }>): ReactNode {
  const controller = useCollaboratorDetailFormController(detail)
  return (
    <CollaboratorDetailContent
      controller={controller}
      editing={props.editing}
      showComplete={false}
      preTitle=""
    />
  )
}

describe('Detalhe do colaborador — CPF travado', () => {
  it('modo Editar: CPF desativado com o motivo; Nome habilitado', () => {
    render(<Harness editing />)
    const cpf = document.getElementById('cd-cpf') as HTMLInputElement
    expect(cpf.disabled).toBe(true)
    expect(cpf.value).toBe('529.982.247-25')
    expect(screen.getByText(tr('partners.collaborators.form.cpfLocked'))).toBeTruthy()
    expect((document.getElementById('cd-name') as HTMLInputElement).disabled).toBe(false)
  })

  it('fora do modo Editar: sem a explicação', () => {
    render(<Harness editing={false} />)
    expect(screen.queryByText(tr('partners.collaborators.form.cpfLocked'))).toBeNull()
  })
})
