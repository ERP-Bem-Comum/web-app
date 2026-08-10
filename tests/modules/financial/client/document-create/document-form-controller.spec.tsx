/**
 * useDocumentFormController (Vitest/jsdom) — herança da categorização do contrato (#502/S3).
 * Cobre a ação `hydrateCategorization`: sobrepõe SÓ a cascata (Programa/Plano/Centro/Categoria/Subcategoria),
 * deixa o resto do form intacto, e tem identidade ESTÁVEL entre renders (p/ o efeito de herança da page não
 * re-disparar em loop).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'

import { useDocumentFormController } from '#modules/financial/client/document-create/document-form.controller.ts'

afterEach(cleanup)

const PATCH = {
  programRef: 'prog-1',
  planoOrcamentario: 'plan-1',
  costCenterRef: 'cc-1',
  categoryRef: 'cat-1',
  subcategoryRef: 'sub-1',
}

describe('useDocumentFormController — herança da categorização (#502/S3)', () => {
  it('hydrateCategorization pré-preenche a cascata e NÃO clobra os demais campos', () => {
    const { result } = renderHook(() => useDocumentFormController())
    // Campo NÃO-categorização preenchido antes: prova que a herança não o sobrescreve.
    act(() => {
      result.current.setText('documentNumber', '0847')
    })
    act(() => {
      result.current.hydrateCategorization(PATCH)
    })
    expect(result.current.fields.programRef).toBe('prog-1')
    expect(result.current.fields.planoOrcamentario).toBe('plan-1')
    expect(result.current.fields.costCenterRef).toBe('cc-1')
    expect(result.current.fields.categoryRef).toBe('cat-1')
    expect(result.current.fields.subcategoryRef).toBe('sub-1')
    expect(result.current.fields.documentNumber).toBe('0847') // intacto
  })

  it('edições do operador APÓS a herança prevalecem (a page só herda 1x por contrato)', () => {
    const { result } = renderHook(() => useDocumentFormController())
    act(() => {
      result.current.hydrateCategorization(PATCH)
    })
    // Operador troca o centro → cascata zera categoria/subcategoria (regra do reducer), sem re-herdar.
    act(() => {
      result.current.setCostCenterRef('cc-2')
    })
    expect(result.current.fields.costCenterRef).toBe('cc-2')
    expect(result.current.fields.categoryRef).toBe('')
    expect(result.current.fields.subcategoryRef).toBe('')
  })

  it('hydrateCategorization tem identidade ESTÁVEL entre renders', () => {
    const { result, rerender } = renderHook(() => useDocumentFormController())
    const first = result.current.hydrateCategorization
    rerender()
    expect(result.current.hydrateCategorization).toBe(first)
  })
})
