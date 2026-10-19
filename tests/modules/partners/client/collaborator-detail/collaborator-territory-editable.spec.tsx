/**
 * Spec 121 — território do colaborador editável no detalhe (vitest/jsdom), core-api#1053.
 *  - no modo Editar, UF (seletor IBGE) e município habilitam — em pré-cadastrado E cadastrado;
 *  - fora dele, seguem somente leitura;
 *  - trocar vai no corpo do PUT; esvaziar o território já gravado é barrado e explicado.
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
  territory: { uf: 'CE', municipality: 'Fortaleza' },
  bankAccount: null,
  pixKey: null,
}

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

describe('Detalhe do colaborador — território (spec 121)', () => {
  it.each([
    ['pré-cadastrado', 'pre-registration'],
    ['cadastrado', 'complete'],
  ] as const)('modo Editar (%s): UF e município habilitam', (_label, registration) => {
    render(<Harness editing initial={{ ...detail, registration }} />)
    expect(el('cd-uf').disabled).toBe(false)
    expect(el('cd-municipality').disabled).toBe(false)
  })

  it('fora do modo Editar: seguem somente leitura', () => {
    render(<Harness editing={false} />)
    expect(el('cd-uf').disabled).toBe(true)
    expect(el('cd-municipality').disabled).toBe(true)
  })

  it('UF é o seletor IBGE e abre com o gravado', () => {
    render(<Harness editing />)
    expect(el('cd-uf').tagName).toBe('SELECT')
    expect(el('cd-uf').value).toBe('CE')
    expect(el('cd-municipality').value).toBe('Fortaleza')
  })

  it('trocar UF e município vai no corpo do PUT', () => {
    render(<Harness editing />)
    fireEvent.change(el('cd-uf'), { target: { value: 'SP' } })
    fireEvent.change(el('cd-municipality'), { target: { value: 'Campinas' } })
    let ok = false
    act(() => {
      ok = sink.current?.validate(detail) ?? false
    })
    expect(ok).toBe(true)
    expect(sink.current?.buildPre().territory).toEqual({ uf: 'SP', municipality: 'Campinas' })
  })

  it('esvaziar o território já gravado: validar recusa e explica', () => {
    render(<Harness editing />)
    fireEvent.change(el('cd-uf'), { target: { value: '' } })
    fireEvent.change(el('cd-municipality'), { target: { value: '' } })
    let ok = true
    act(() => {
      ok = sink.current?.validate(detail) ?? true
    })
    expect(ok).toBe(false)
    expect(screen.getByText(tr('partners.collaborators.form.territoryRemovalBlocked'))).toBeTruthy()
    expect(el('cd-uf').getAttribute('aria-invalid')).toBe('true')
  })

  it('sem território gravado: deixar vazio salva (null mantém)', () => {
    const semTerritorio: CollaboratorDetail = { ...detail, territory: null }
    render(<Harness editing initial={semTerritorio} />)
    let ok = false
    act(() => {
      ok = sink.current?.validate(semTerritorio) ?? false
    })
    expect(ok).toBe(true)
    expect(sink.current?.buildPre().territory).toBeNull()
  })
})
