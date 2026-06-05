/**
 * ContractDetail components (Vitest/jsdom) — renderização com dados mock.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { ContractHero } from '#modules/contracts/client/contract-detail/components/contract-hero.component.tsx'
import { ContractDocuments } from '#modules/contracts/client/contract-detail/components/contract-documents.component.tsx'
import { ContractAside } from '#modules/contracts/client/contract-detail/components/contract-aside.component.tsx'
import { ContractTimeline } from '#modules/contracts/client/contract-detail/components/contract-timeline.component.tsx'
import { mockContract } from '../../fixtures/contract.fixture.ts'

afterEach(() => {
  cleanup()
})

describe('ContractHero', () => {
  it('renderiza título e status do contrato', () => {
    const contract = mockContract()
    render(<ContractHero contract={contract} />)
    expect(screen.getByText(contract.title)).toBeTruthy()
    // Status aparece no badge e no campo "Status Base" — pegamos todos
    expect(screen.getAllByText(contract.status).length).toBeGreaterThanOrEqual(1)
  })

  it('renderiza dados do contratado', () => {
    const contract = mockContract()
    render(<ContractHero contract={contract} />)
    expect(screen.getByText('Empresa ABC Ltda')).toBeTruthy()
    expect(screen.getByText('12.345.678/0001-90')).toBeTruthy()
  })

  it('renderiza classificação e modelo', () => {
    const contract = mockContract()
    render(<ContractHero contract={contract} />)
    expect(screen.getByText('Contrato')).toBeTruthy()
    expect(screen.getByText('Serviço')).toBeTruthy()
  })
})

describe('ContractDocuments', () => {
  it('renderiza tabela com contrato base + aditivos', () => {
    const contract = mockContract()
    render(<ContractDocuments contract={contract} />)
    expect(screen.getByText('Documentos')).toBeTruthy()
    expect(screen.getByText('Contrato Base')).toBeTruthy()
    expect(screen.getByText('Aditivo 001')).toBeTruthy()
    expect(screen.getByText('Aditivo 002')).toBeTruthy()
  })

  it('renderiza badge de tipo para cada documento', () => {
    const contract = mockContract()
    render(<ContractDocuments contract={contract} />)
    expect(screen.getByText('Base')).toBeTruthy()
    expect(screen.getByText('Valor')).toBeTruthy()
    expect(screen.getByText('Prazo')).toBeTruthy()
  })
})

describe('ContractAside', () => {
  it('renderiza valor atual', () => {
    const contract = mockContract()
    render(<ContractAside contract={contract} />)
    // "Valor Atual" aparece no label da seção e no total da composição
    expect(screen.getAllByText('Valor Atual').length).toBeGreaterThanOrEqual(1)
  })

  it('renderiza composição com valor original e aditivos', () => {
    const contract = mockContract()
    render(<ContractAside contract={contract} />)
    expect(screen.getByText('Composição')).toBeTruthy()
    expect(screen.getByText('Valor Original')).toBeTruthy()
    expect(screen.getByText(/Aditivo 001/)).toBeTruthy()
    expect(screen.getByText(/Aditivo 002/)).toBeTruthy()
  })

  it('renderiza barra de vigência', () => {
    const contract = mockContract()
    render(<ContractAside contract={contract} />)
    expect(screen.getByText('Vigência Atual')).toBeTruthy()
  })
})

describe('ContractTimeline', () => {
  it('renderiza eventos da timeline', () => {
    const contract = mockContract()
    render(<ContractTimeline contract={contract} />)
    expect(screen.getByText('Timeline de Marcos')).toBeTruthy()
    expect(screen.getByText('Contrato criado')).toBeTruthy()
    expect(screen.getByText('Contrato assinado')).toBeTruthy()
    expect(screen.getByText('Aditivo 001 homologado')).toBeTruthy()
  })
})
