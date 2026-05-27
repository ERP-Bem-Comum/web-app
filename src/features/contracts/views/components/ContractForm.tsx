import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createContract } from '@/server/contracts.server'
import { usePartnerOptions } from '../hooks/use-partner-options'
import {
  ContractClassification,
  ContractModel,
  ContractType,
  ContractStatus,
} from '../../domain/types'

export function ContractForm() {
  const navigate = useNavigate()
  const { suppliers, financiers, collaborators, budgetPlans } = usePartnerOptions()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    classification: ContractClassification.CONTRACT,
    contractModel: ContractModel.SERVICE,
    object: '',
    totalValue: 0,
    contractType: ContractType.SUPPLIER,
    contractPeriodStart: '',
    contractPeriodEnd: '',
    supplierId: null as number | null,
    financierId: null as number | null,
    collaboratorId: null as number | null,
    budgetPlanId: null as number | null,
  })

  const handleChange = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createContract({
        data: {
          classification: form.classification,
          contractModel: form.contractModel,
          object: form.object,
          totalValue: form.totalValue,
          contractType: form.contractType,
          contractPeriod: {
            start: new Date(form.contractPeriodStart),
            end: new Date(form.contractPeriodEnd),
          },
          supplierId: form.supplierId,
          financierId: form.financierId,
          collaboratorId: form.collaboratorId,
          budgetPlanId: form.budgetPlanId,
        },
      })
      navigate({ to: '/contratos' })
    } catch (err) {
      alert('Erro ao criar contrato: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const partnerOptions = () => {
    switch (form.contractType) {
      case ContractType.SUPPLIER:
        return suppliers.data?.items || []
      case ContractType.FINANCIER:
        return financiers.data?.items || []
      case ContractType.COLLABORATOR:
        return collaborators.data?.items || []
      default:
        return []
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 max-w-3xl">
      <div>
        <label className="block text-sm font-medium mb-1">Objeto</label>
        <textarea
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          required
          value={form.object}
          onChange={(e) => handleChange('object', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Classificação</label>
          <select
            className="w-full px-3 py-2 border rounded-md"
            value={form.classification}
            onChange={(e) => handleChange('classification', e.target.value)}
          >
            {Object.values(ContractClassification).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Modelo</label>
          <select
            className="w-full px-3 py-2 border rounded-md"
            value={form.contractModel}
            onChange={(e) => handleChange('contractModel', e.target.value)}
          >
            {Object.values(ContractModel).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <select
            className="w-full px-3 py-2 border rounded-md"
            value={form.contractType}
            onChange={(e) => handleChange('contractType', e.target.value)}
          >
            {Object.values(ContractType).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Valor Total (R$)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            className="w-full px-3 py-2 border rounded-md"
            required
            value={form.totalValue}
            onChange={(e) => handleChange('totalValue', parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Início do Período</label>
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-md"
            required
            value={form.contractPeriodStart}
            onChange={(e) => handleChange('contractPeriodStart', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fim do Período</label>
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-md"
            required
            value={form.contractPeriodEnd}
            onChange={(e) => handleChange('contractPeriodEnd', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {form.contractType === ContractType.SUPPLIER
              ? 'Fornecedor'
              : form.contractType === ContractType.FINANCIER
                ? 'Financiador'
                : form.contractType === ContractType.COLLABORATOR
                  ? 'Colaborador'
                  : 'Parceiro'}
          </label>
          <select
            className="w-full px-3 py-2 border rounded-md"
            value={(form.supplierId || form.financierId || form.collaboratorId) ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null
              handleChange('supplierId', form.contractType === ContractType.SUPPLIER ? val : null)
              handleChange('financierId', form.contractType === ContractType.FINANCIER ? val : null)
              handleChange('collaboratorId', form.contractType === ContractType.COLLABORATOR ? val : null)
            }}
          >
            <option value="">Selecione...</option>
            {partnerOptions().map((p: any) => (
              <option key={p.id} value={p.id}>{p.name || p.fantasyName || p.corporateName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Plano Orçamentário</label>
          <select
            className="w-full px-3 py-2 border rounded-md"
            value={form.budgetPlanId ?? ''}
            onChange={(e) => handleChange('budgetPlanId', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Selecione...</option>
            {(budgetPlans.data?.items || []).map((bp: any) => (
              <option key={bp.id} value={bp.id}>{bp.scenarioName} ({bp.year})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => navigate({ to: '/contratos' })}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-[#32C6F4] hover:bg-[#76D9F8] text-black font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
