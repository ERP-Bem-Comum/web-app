import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { isOk } from '#shared/primitives/result.ts'
import { useContractDetailBinding } from '../contract-detail.binding.ts'
import { ContractHero } from '../components/contract-hero.component.tsx'
import { ContractDocuments } from '../components/contract-documents.component.tsx'
import { ContractTimeline } from '../components/contract-timeline.component.tsx'
import { ContractAside } from '../components/contract-aside.component.tsx'
import {
  screen,
  topbar,
  backButton,
  topbarTitle,
  topbarMeta,
  mainLayout,
  mainCol,
  asideCol,
} from './contract-detail.css.ts'

const t = createTranslator(ptBR)

export function ContractDetailPage({ contractId }: { contractId: string }): ReactNode {
  const navigate = useNavigate()
  const { data, isLoading } = useContractDetailBinding(contractId)

  if (isLoading) {
    return (
      <div className={screen}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (!data || !isOk(data)) {
    return (
      <div className={screen}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          Erro ao carregar contrato
        </div>
      </div>
    )
  }

  const contract = data.value

  return (
    <div className={screen}>
      {/* Topbar */}
      <div className={topbar}>
        <button
          type="button"
          className={backButton}
          onClick={() => { navigate({ to: '/contratos' }).catch(() => { /* noop */ }) }}
          aria-label="Voltar"
        >
          ←
        </button>
        <h1 className={topbarTitle}>
          Contrato
          <span className={topbarMeta}>
            {contract.classification === 'Contract' ? 'CT' : 'OS'} {contract.sequentialNumber}
          </span>
        </h1>
      </div>

      {/* Layout 2 colunas */}
      <div className={mainLayout}>
        <div className={mainCol}>
          <ContractHero contract={contract} />
          <ContractDocuments contract={contract} />
          <ContractTimeline contract={contract} />
        </div>
        <div className={asideCol}>
          <ContractAside contract={contract} />
        </div>
      </div>
    </div>
  )
}
