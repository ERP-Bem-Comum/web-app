import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { isOk } from '#shared/primitives/result.ts'
import { useContractDetailBinding } from '../contract-detail.binding.ts'
import { ContractHero } from '../components/contract-hero.component.tsx'
import { ContractDocuments } from '../components/contract-documents.component.tsx'
import { ContractTimeline } from '../components/contract-timeline.component.tsx'
import { screen } from './contract-detail.css.ts'

const t = createTranslator(ptBR)

export function ContractDetailPage({ contractId }: { contractId: string }): ReactNode {
  const { data, isLoading } = useContractDetailBinding(contractId)

  if (isLoading) return <div>{t('common.loading')}</div>
  if (!data || !isOk(data)) return <div>Erro ao carregar contrato</div>

  const contract = data.value

  return (
    <div className={screen}>
      <ContractHero contract={contract} />
      <ContractDocuments contract={contract} />
      <ContractTimeline contract={contract} />
    </div>
  )
}
