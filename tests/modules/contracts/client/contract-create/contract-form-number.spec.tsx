/**
 * useContractFormController — número do contrato (spec 118), vitest/jsdom.
 *  - submit() omite `sequentialNumber` com o campo vazio e envia o valor aparado quando preenchido;
 *  - `contractNumberInvalid` só acende com o campo preenchido fora do formato.
 */
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useContractFormController } from '#modules/contracts/client/contract-create/components/contract-form.controller.ts'

describe('useContractFormController — número do contrato', () => {
  it('vazio: submit() não leva sequentialNumber e o campo é válido', () => {
    const { result } = renderHook(() => useContractFormController())
    expect(result.current.contractNumberInvalid).toBe(false)
    expect('sequentialNumber' in result.current.submit()).toBe(false)
  })

  it('preenchido: submit() leva o número aparado', () => {
    const { result } = renderHook(() => useContractFormController())
    act(() => {
      result.current.update('contractNumber', ' 0123/2024 ')
    })
    expect(result.current.contractNumberInvalid).toBe(false)
    expect(result.current.submit().sequentialNumber).toBe('0123/2024')
  })

  it('formato inválido acende contractNumberInvalid', () => {
    const { result } = renderHook(() => useContractFormController())
    act(() => {
      result.current.update('contractNumber', '12/2024')
    })
    expect(result.current.contractNumberInvalid).toBe(true)
  })
})
