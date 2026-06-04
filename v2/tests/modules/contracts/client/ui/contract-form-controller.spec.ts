/**
 * Controller do form de criação de contrato (Vitest/jsdom) — estado transiente,
 * checklist, validação de teto de OS e trigger de erros.
 */
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useContractFormController } from '#modules/contracts/client/contract-create/components/contract-form.controller.ts'

describe('useContractFormController', () => {
  it('estado inicial com valores padrão', () => {
    const { result } = renderHook(() => useContractFormController())

    expect(result.current.state.classification).toBe('Contract')
    expect(result.current.state.originalValueCents).toBe(0)
    expect(result.current.state.objective).toBe('')
    expect(result.current.selectedPartner).toBeNull()
    expect(result.current.showModal).toBe(false)
    expect(result.current.validationAttempted).toBe(false)
  })

  it('update altera o estado corretamente', () => {
    const { result } = renderHook(() => useContractFormController())

    act(() => {
      result.current.update('objective', 'Objeto de teste')
    })

    expect(result.current.state.objective).toBe('Objeto de teste')
  })

  it('setSelectedPartner define e remove parceiro', () => {
    const { result } = renderHook(() => useContractFormController())
    const partner = { id: '1', name: 'Empresa ABC', kind: 'Fornecedor' as const }

    act(() => {
      result.current.setSelectedPartner(partner)
    })
    expect(result.current.selectedPartner).toEqual(partner)

    act(() => {
      result.current.setSelectedPartner(null)
    })
    expect(result.current.selectedPartner).toBeNull()
  })

  it('openModal e closeModal controlam showModal', () => {
    const { result } = renderHook(() => useContractFormController())

    act(() => {
      result.current.openModal()
    })
    expect(result.current.showModal).toBe(true)

    act(() => {
      result.current.closeModal()
    })
    expect(result.current.showModal).toBe(false)
  })

  it('triggerValidation seta validationAttempted para true', () => {
    const { result } = renderHook(() => useContractFormController())

    expect(result.current.validationAttempted).toBe(false)

    act(() => {
      result.current.triggerValidation()
    })

    expect(result.current.validationAttempted).toBe(true)
  })

  describe('isOvertopOS', () => {
    it('é false quando classificação é Contract', () => {
      const { result } = renderHook(() => useContractFormController())

      act(() => {
        result.current.update('originalValueCents', 10_000_000)
      })

      expect(result.current.isOvertopOS).toBe(false)
    })

    it('é false quando classificação é OS e valor <= 999.999 centavos', () => {
      const { result } = renderHook(() => useContractFormController())

      act(() => {
        result.current.update('classification', 'ServiceOrder')
        result.current.update('originalValueCents', 999_999)
      })

      expect(result.current.isOvertopOS).toBe(false)
    })

    it('é true quando classificação é OS e valor > 999.999 centavos', () => {
      const { result } = renderHook(() => useContractFormController())

      act(() => {
        result.current.update('classification', 'ServiceOrder')
        result.current.update('originalValueCents', 1_000_000)
      })

      expect(result.current.isOvertopOS).toBe(true)
    })
  })

  describe('checklist', () => {
    it('inicia com 0 de 7 campos preenchidos', () => {
      const { result } = renderHook(() => useContractFormController())

      expect(result.current.checklist.done).toBe(0)
      expect(result.current.checklist.total).toBe(7)
      expect(result.current.checklist.checks.contratado).toBe(false)
      expect(result.current.checklist.checks.contrato).toBe(false)
      expect(result.current.checklist.checks.valor).toBe(false)
      expect(result.current.checklist.checks.vigencia).toBe(false)
      expect(result.current.checklist.checks.programa).toBe(false)
      expect(result.current.checklist.checks.categorizacao).toBe(false)
      expect(result.current.checklist.checks.centroDeCusto).toBe(false)
    })

    it('conta contratado quando supplierId preenchido', () => {
      const { result } = renderHook(() => useContractFormController())

      act(() => {
        result.current.update('supplierId', '123')
      })

      expect(result.current.checklist.checks.contratado).toBe(true)
      expect(result.current.checklist.done).toBe(1)
    })

    it('conta contratado quando selectedPartner definido', () => {
      const { result } = renderHook(() => useContractFormController())
      const partner = { id: '1', name: 'Empresa ABC', kind: 'Fornecedor' as const }

      act(() => {
        result.current.setSelectedPartner(partner)
      })

      expect(result.current.checklist.checks.contratado).toBe(true)
      expect(result.current.checklist.done).toBe(1)
    })

    it('conta todos os campos quando preenchidos', () => {
      const { result } = renderHook(() => useContractFormController())
      const partner = { id: '1', name: 'Empresa ABC', kind: 'Fornecedor' as const }

      act(() => {
        result.current.setSelectedPartner(partner)
        result.current.update('objective', 'Objeto de teste')
        result.current.update('originalValueCents', 100_000)
        result.current.update('originalPeriodStart', '2026-01-01')
        result.current.update('originalPeriodEnd', '2026-12-31')
        result.current.update('programId', 1)
        result.current.update('categorizacao', 'Avaliação')
        result.current.update('centroDeCusto', 'RH')
      })

      expect(result.current.checklist.done).toBe(7)
      expect(result.current.checklist.checks.contratado).toBe(true)
      expect(result.current.checklist.checks.contrato).toBe(true)
      expect(result.current.checklist.checks.valor).toBe(true)
      expect(result.current.checklist.checks.vigencia).toBe(true)
      expect(result.current.checklist.checks.programa).toBe(true)
      expect(result.current.checklist.checks.categorizacao).toBe(true)
      expect(result.current.checklist.checks.centroDeCusto).toBe(true)
    })
  })

  describe('submit', () => {
    it('retorna payload com dados preenchidos', () => {
      const { result } = renderHook(() => useContractFormController())
      const partner = { id: '1', name: 'Empresa ABC', kind: 'Fornecedor' as const }

      act(() => {
        result.current.setSelectedPartner(partner)
        result.current.update('supplierId', '1')
        result.current.update('title', 'Contrato Teste')
        result.current.update('objective', 'Objeto de teste')
        result.current.update('originalValueCents', 100_000)
        result.current.update('originalPeriodStart', '2026-01-01')
        result.current.update('originalPeriodEnd', '2026-12-31')
        result.current.update('classification', 'Contract')
        result.current.update('contractModel', 'Service')
        result.current.update('contractType', 'Supplier')
        result.current.update('programId', 1)
        result.current.update('budgetPlanId', 2)
        result.current.update('categorizacao', 'Avaliação')
        result.current.update('centroDeCusto', 'RH')
      })

      const payload = result.current.submit()

      expect(payload.title).toBe('Contrato Teste')
      expect(payload.objective).toBe('Objeto de teste')
      expect(payload.originalValueCents).toBe(100_000)
      expect(payload.classification).toBe('Contract')
      expect(payload.supplierId).toBe('1')
      expect(payload.programId).toBe(1)
      expect(payload.budgetPlanId).toBe(2)
      expect(payload.categorizacao).toBe('Avaliação')
      expect(payload.centroDeCusto).toBe('RH')
    })

    it('omit supplierId quando vazio', () => {
      const { result } = renderHook(() => useContractFormController())

      act(() => {
        result.current.update('objective', 'Objeto')
        result.current.update('originalValueCents', 100_000)
        result.current.update('originalPeriodStart', '2026-01-01')
        result.current.update('originalPeriodEnd', '2026-12-31')
      })

      const payload = result.current.submit()

      expect(payload.supplierId).toBeUndefined()
    })
  })
})
