import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { useActFormController } from '#modules/partners/client/act-create/components/act-form.controller.ts'
import { ActForm } from '#modules/partners/client/act-create/components/act-form.component.tsx'

function Harness(): ReturnType<typeof ActForm> {
  const controller = useActFormController({ onSubmit: vi.fn() })
  return <ActForm controller={controller} running={false} errorTag={null} onCancel={vi.fn()} />
}

describe('ActForm', () => {
  it('o <select> de área renderiza as 4 opções (+ placeholder)', () => {
    render(<Harness />)
    const areaSelect = screen.getByLabelText(/Área de Atuação/i) as HTMLSelectElement
    // 4 áreas + a opção "Selecione…"
    expect(areaSelect.querySelectorAll('option').length).toBe(5)
  })

  it('toggle de repasse revela conta bancária e PIX', () => {
    render(<Harness />)
    // sem repasse: campos de banco/PIX ocultos
    expect(screen.queryByLabelText('Banco')).toBeNull()
    expect(screen.queryByLabelText('Chave PIX')).toBeNull()

    const toggle = screen.getByLabelText(/Possui Repasse Financeiro/i)
    fireEvent.click(toggle)

    // com repasse: campos revelados
    expect(screen.getByLabelText('Banco')).toBeTruthy()
    expect(screen.getByLabelText('Chave PIX')).toBeTruthy()
    expect(screen.getByLabelText(/Tipo de chave/i)).toBeTruthy()
  })
})
