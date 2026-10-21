/**
 * Escolaridade sem "Educação Infantil" (spec 126, P.O. 19/10) — vitest/jsdom.
 *  - o seletor do detalhe não oferece mais a opção;
 *  - quem JÁ tem o valor gravado continua vendo ele selecionado (não vira "Selecione...").
 */
import type { ReactNode } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

import { CollaboratorDetailContent } from '#modules/partners/client/collaborator-detail/components/collaborator-detail-content.component.tsx'
import { useCollaboratorDetailFormController } from '#modules/partners/client/collaborator-detail/components/collaborator-detail-form.controller.ts'
import type { CollaboratorDetail } from '#modules/partners/client/data/model/collaborator.model.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

const tr = (key: string): string => ptBR[key] ?? key
const edu = (v: string): string => tr(`partners.collaborators.education.${v}`)
const INFANTIL = edu('EDUCACAO_INFANTIL')

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

function Harness(props: Readonly<{ detail: CollaboratorDetail }>): ReactNode {
  const controller = useCollaboratorDetailFormController(props.detail)
  return <CollaboratorDetailContent controller={controller} editing showComplete preTitle="" />
}

const educationSelect = (): HTMLSelectElement => document.getElementById('cd-education') as HTMLSelectElement
const labels = (): readonly (string | null)[] =>
  Array.from(educationSelect().querySelectorAll('option')).map((o) => o.textContent)

describe('Detalhe do colaborador — Escolaridade sem "Educação Infantil" (spec 126)', () => {
  it('sem valor gravado: a opção não aparece', () => {
    render(<Harness detail={base} />)
    expect(labels()).not.toContain(INFANTIL)
    expect(labels()).toContain(edu('DOUTORADO'))
  })

  it('valor gravado = Educação Infantil: continua aparecendo e selecionado', () => {
    render(<Harness detail={{ ...base, education: 'EDUCACAO_INFANTIL' }} />)
    expect(labels()).toContain(INFANTIL)
    expect(educationSelect().value).toBe('EDUCACAO_INFANTIL')
  })
})
