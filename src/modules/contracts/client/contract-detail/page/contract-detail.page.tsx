import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { isOk } from '#shared/primitives/result.ts'
import { useContractDetailBinding } from '../contract-detail.binding.ts'
import { useAttachSignedDocumentBinding } from '#modules/contracts/client/contract-attach-document/attach-signed-document.binding.ts'
import { AttachDocumentModal } from '#modules/contracts/client/contract-attach-document/components/attach-document-modal.component.tsx'
import { ContractInfo } from '../components/contract-info.component.tsx'
import { ContractDocuments } from '../components/contract-documents.component.tsx'
import { ContractBankInfo } from '../components/contract-bank-info.component.tsx'
import { ContractTimeline } from '../components/contract-timeline.component.tsx'
import { ContractAside } from '../components/contract-aside.component.tsx'
import {
  screen,
  topbar,
  backButton,
  topbarTitle,
  topbarMeta,
  statusBadge,
  statusBadgePending,
  statusBadgeActive,
  statusBadgeFinished,
  statusBadgeTerminated,
  mainLayout,
  mainCol,
  asideCol,
  bottombar,
  bottombarStatus,
  bottombarDot,
  bottombarActions,
  buttonPrimary,
  buttonSecondary,
} from './contract-detail.css.ts'

const t = createTranslator(ptBR)

const STATUS_BADGE_CLASS: Record<string, string> = {
  Pendente: statusBadgePending,
  'Em Andamento': statusBadgeActive,
  Finalizado: statusBadgeFinished,
  Distrato: statusBadgeTerminated,
}

export function ContractDetailPage({ contractId }: { contractId: string }): ReactNode {
  const navigate = useNavigate()
  const { data, isLoading } = useContractDetailBinding(contractId)
  const { attachCommand } = useAttachSignedDocumentBinding()
  const [attachOpen, setAttachOpen] = useState(false)
  // Anexo bem-sucedido → contrato efetivado: o modal some (derivado, sem setState em efeito). A lista/
  // detalhe são invalidados no binding; ao virar "Em Andamento" o botão-gatilho também deixa de aparecer.
  const modalOpen = attachOpen && attachCommand.result === null

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
          {contract.classification === 'Contract'
            ? t('contracts.create.field.classification.ct')
            : t('contracts.create.field.classification.os')}
          <span className={topbarMeta}>{contract.sequentialNumber}</span>
        </h1>
        <span className={`${statusBadge} ${STATUS_BADGE_CLASS[contract.status] ?? ''}`}>
          <span style={{ fontSize: '0.5rem', lineHeight: 1 }}>●</span>
          {contract.status}
        </span>
        {/* O gatilho "Incluir documento assinado" será posicionado no local definido pela stakeholder.
            O modal + binding (useAttachSignedDocumentBinding) seguem prontos abaixo, aguardando o botão. */}
      </div>

      {/* Layout 2 colunas */}
      <div className={mainLayout}>
        <div className={mainCol}>
          <ContractInfo contract={contract} />
          <ContractDocuments contract={contract} onOpenBase={() => { setAttachOpen(true) }} />
          <ContractBankInfo contract={contract} />
        </div>
        <div className={asideCol}>
          <ContractAside contract={contract} />
          <ContractTimeline contract={contract} />
        </div>
      </div>

      <footer className={bottombar}>
        <div className={bottombarStatus}>
          <span className={bottombarDot} />
          <span>Sincronizado</span>
          <span className={`${statusBadge} ${STATUS_BADGE_CLASS[contract.status] ?? ''}`}>
            <span style={{ fontSize: '0.5rem', lineHeight: 1 }}>●</span>
            {contract.status}
          </span>
        </div>
        <div className={bottombarActions}>
          <button
            type="button"
            className={buttonSecondary}
            onClick={() => { navigate({ to: '/contratos/$id/editar', params: { id: contractId } }).catch(() => { /* noop */ }) }}
          >
            Editar documento
          </button>
          <button
            type="button"
            className={buttonPrimary}
            onClick={() => { navigate({ to: '/contratos/criar' }).catch(() => { /* noop */ }) }}
          >
            Novo contrato
          </button>
        </div>
      </footer>

      <AttachDocumentModal
        open={modalOpen}
        contract={contract}
        onClose={() => { setAttachOpen(false) }}
        submitting={attachCommand.running}
        errorTag={attachCommand.errorTag}
        onSubmit={({ file, signedAt }) => {
          attachCommand.execute({ contractId, file, signedAt })
        }}
      />
    </div>
  )
}
