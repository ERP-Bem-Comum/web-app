import type { ReactNode } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { isOk } from '#shared/primitives/result.ts'
import { formatContractNumber } from '#modules/contracts/client/domain/format.ts'
import { useContractEditBinding } from '../../contract-edit/contract-edit.binding.ts'
import { useContractDetailBinding } from '../contract-detail.binding.ts'
import { useAttachSignedDocumentBinding } from '#modules/contracts/client/contract-attach-document/attach-signed-document.binding.ts'
import { AttachDocumentModal } from '#modules/contracts/client/contract-attach-document/components/attach-document-modal.component.tsx'
import { useAmendmentCreateBinding } from '../../amendment-create/amendment-create.binding.ts'
import { useEndContractBinding } from '../../contract-terminate/end-contract.binding.ts'
import { useAttachAmendmentDocumentBinding } from '../../amendment-create/attach-amendment-document.binding.ts'
import { useDocumentContentBinding } from '../document-content.binding.ts'
import { AmendmentModal, type AmendmentForAttach, type AmendmentViewData } from '../../amendment-create/components/amendment-modal.component.tsx'
import type { Amendment } from '#modules/contracts/public-api/index.ts'
import { ContractInfo } from '../components/contract-info.component.tsx'
import { ContractDocuments, type DocRef } from '../components/contract-documents.component.tsx'
import { DocumentPreviewModal } from '../components/document-preview-modal.component.tsx'
import { ContractBankInfo } from '../components/contract-bank-info.component.tsx'
import { ContractContato } from '../components/contract-contato.component.tsx'
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
} from './contract-detail.css.ts'

const t = createTranslator(ptBR)

const fmtCurrencyCents = (cents: number): string => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDateUTC = (d: Date | null | undefined): string => (d ? d.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '')

// Monta os dados (já formatados) p/ o modo leitura do modal de aditivo. Derivação pura.
function buildAmendmentView(a: Amendment): AmendmentViewData {
  const v = a.impactValueCents ?? 0
  const impactLabel =
    a.type === 'distrato'
      ? 'Distrato'
      : a.type === 'valor' && v !== 0
        ? v < 0 ? `− ${fmtCurrencyCents(Math.abs(v))}` : `+ ${fmtCurrencyCents(v)}`
        : a.type === 'prazo' && a.newEndDate
          ? `Nova vigência: ${fmtDateUTC(a.newEndDate)}`
          : 'Sem impacto financeiro'
  return {
    type: a.type,
    description: a.description ?? '',
    signedAt: fmtDateUTC(a.signedAt),
    status: a.status,
    impactLabel,
  }
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  Pendente: statusBadgePending,
  'Em Andamento': statusBadgeActive,
  Finalizado: statusBadgeFinished,
  Distrato: statusBadgeTerminated,
}

export function ContractDetailPage({ contractId }: { contractId: string }): ReactNode {
  const navigate = useNavigate()
  const { data, isLoading, vigencia } = useContractDetailBinding(contractId)
  const { attachCommand } = useAttachSignedDocumentBinding()
  const { createCommand: amendmentCommand } = useAmendmentCreateBinding()
  const { attachCommand: amendmentAttachCommand } = useAttachAmendmentDocumentBinding()
  const { endCommand } = useEndContractBinding()
  const { documentCommand } = useDocumentContentBinding()
  const [attachOpen, setAttachOpen] = useState(false)
  const [amendmentOpen, setAmendmentOpen] = useState(false)
  const [selectedAmendment, setSelectedAmendment] = useState<AmendmentForAttach | null>(null)
  const [viewAmendment, setViewAmendment] = useState<AmendmentViewData | null>(null)
  const [previewDoc, setPreviewDoc] = useState<DocRef | null>(null)
  // Fluxo unificado de aditivo: se o create vier com documento+assinatura, guardamos o anexo e
  // homologamos logo após a criação (encadeado no efeito abaixo).
  const [pendingAmendmentAttach, setPendingAmendmentAttach] = useState<Readonly<{ file: File; signedAt: string; isDistrato: boolean; terminatedAt: string; reason: string }> | null>(null)

  // Edição inline da seção Contato (PATCH email/telefone/observações).
  const queryClient = useQueryClient()
  const [editingContato, setEditingContato] = useState(false)
  const [contatoEmail, setContatoEmail] = useState('')
  const [contatoTelephone, setContatoTelephone] = useState('')
  const [contatoObservations, setContatoObservations] = useState('')
  const { editCommand } = useContractEditBinding({
    onSuccess: () => {
      setEditingContato(false)
      void queryClient.invalidateQueries({ queryKey: ['contracts', 'detail', contractId] })
    },
  })
  // Modais somem ao concluir. A derivação server-state→"concluído" vive no binding (`succeeded`, A1);
  // aqui a page só compõe o UI-state local (aberto) com esse flag semântico. Distrato fecha ao `end` concluir.
  const amendmentModalOpen = amendmentOpen && !amendmentCommand.succeeded && !endCommand.succeeded
  const amendmentAttachOpen = selectedAmendment !== null && !amendmentAttachCommand.succeeded
  // Anexo bem-sucedido → contrato efetivado: o modal some. A lista/detalhe são invalidados no binding;
  // ao virar "Em Andamento" o botão-gatilho também deixa de aparecer.
  const modalOpen = attachOpen && !attachCommand.succeeded

  // Fluxo unificado: criado o aditivo COM anexo pendente → homologa em seguida (e, se distrato, encerra).
  // `ref` de guarda (não setState no efeito): roda uma vez por criação; reseta quando o create é limpo.
  const homologateChained = useRef(false)
  useEffect(() => {
    const created = amendmentCommand.result
    if (created === null) { homologateChained.current = false; return }
    if (pendingAmendmentAttach === null || homologateChained.current) return
    homologateChained.current = true
    const { file, signedAt, isDistrato, terminatedAt, reason } = pendingAmendmentAttach
    void amendmentAttachCommand
      .execute({ contractId, amendmentId: created.id, file, signedAt })
      .then((ok) => { if (ok && isDistrato) endCommand.execute({ contractId, file, terminatedAt, reason }) })
  }, [amendmentCommand.result, pendingAmendmentAttach, amendmentAttachCommand, endCommand, contractId])

  if (isLoading) {
    return (
      <div className={screen}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (!data || !isOk(data) || vigencia === null) {
    return (
      <div className={screen}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {t('contracts.detail.error.loading')}
        </div>
      </div>
    )
  }

  const contract = data.value

  // Entra em edição do Contato: pré-carrega os campos com os valores atuais do contrato.
  const startEditContato = (): void => {
    setContatoEmail(contract.email ?? '')
    setContatoTelephone(contract.telephone ?? '')
    setContatoObservations(contract.observations ?? '')
    setEditingContato(true)
  }
  const saveContato = (): void => {
    editCommand.execute({
      id: contractId,
      // email vazio → undefined (z.email() rejeita ''); telefone/obs aceitam string vazia.
      email: contatoEmail !== '' ? contatoEmail : undefined,
      telephone: contatoTelephone,
      observations: contatoObservations,
    })
  }

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
          <span className={topbarMeta}>{formatContractNumber(contract.sequentialNumber, contract.classification)}</span>
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
          <ContractDocuments
            contract={contract}
            onOpenBase={() => { attachCommand.reset(); setAttachOpen(true) }}
            onNewAmendment={() => {
              // reset() limpa o resultado da criação anterior → permite criar VÁRIOS aditivos sem recarregar.
              if (contract.status !== 'Pendente') { amendmentCommand.reset(); endCommand.reset(); setAmendmentOpen(true) }
            }}
            onOpenAmendment={(id) => {
              const a = contract.children.find((c) => c.id === id)
              if (!a) return
              if (a.status === 'Pendente') {
                // Aditivo pendente → anexar documento + homologar (modo attach).
                amendmentAttachCommand.reset(); endCommand.reset()
                setSelectedAmendment({ id: a.id, type: a.type, description: a.description ?? '' })
              } else {
                // Aditivo já existente (Homologado/etc.) → abre em modo leitura com as infos preenchidas.
                setViewAmendment(buildAmendmentView(a))
              }
            }}
            onPreview={(doc) => {
              setPreviewDoc(doc)
              if (doc.documentId !== undefined) documentCommand.open({ contractId, documentId: doc.documentId })
            }}
            onDownload={(doc) => {
              if (doc.documentId !== undefined) {
                documentCommand.download({ contractId, documentId: doc.documentId, fallbackName: doc.name })
              }
            }}
          />
          <ContractBankInfo contract={contract} />
          <ContractContato
            contract={contract}
            editing={editingContato}
            email={contatoEmail}
            telephone={contatoTelephone}
            observations={contatoObservations}
            onChange={(field, value) => {
              if (field === 'email') setContatoEmail(value)
              else if (field === 'telephone') setContatoTelephone(value)
              else setContatoObservations(value)
            }}
            onEdit={startEditContato}
            onSave={saveContato}
            onCancel={() => { setEditingContato(false) }}
            saving={editCommand.running}
            errorText={editCommand.errorTag === null ? null : t(editCommand.errorTag)}
          />
        </div>
        <div className={asideCol}>
          <ContractAside contract={contract} vigencia={vigencia} />
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
          {/* Edição do contato agora é INLINE na seção Contato (botão "Editar" lá). */}
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

      <AmendmentModal
        open={amendmentModalOpen}
        mode="create"
        contractNumber={formatContractNumber(contract.sequentialNumber, contract.classification)}
        amendment={undefined}
        onClose={() => { setAmendmentOpen(false) }}
        submitting={amendmentCommand.running || endCommand.running}
        errorTag={amendmentCommand.errorTag ?? endCommand.errorTag}
        onCreate={(input, attach) => {
          // Sem anexo → aditivo nasce Pendente (sem efeito). Com documento + assinatura → guardamos o
          // anexo e homologamos logo após criar (efeito de encadeamento); distrato encerra ao homologar.
          setPendingAmendmentAttach(
            attach !== undefined
              ? {
                  file: attach.file,
                  signedAt: attach.signedAt,
                  isDistrato: input.type === 'distrato',
                  // Distrato (#32): data efetiva digitada + motivo (= descrição do aditivo).
                  terminatedAt: attach.terminatedAt,
                  reason: input.description ?? '',
                }
              : null,
          )
          amendmentCommand.execute(contractId, input)
        }}
        onAttach={() => { /* não usado no modo create */ }}
      />

      <AmendmentModal
        open={amendmentAttachOpen}
        mode="attach"
        contractNumber={formatContractNumber(contract.sequentialNumber, contract.classification)}
        amendment={selectedAmendment ?? undefined}
        onClose={() => { setSelectedAmendment(null) }}
        submitting={amendmentAttachCommand.running}
        errorTag={amendmentAttachCommand.errorTag}
        onCreate={() => { /* não usado no modo attach */ }}
        onAttach={({ amendmentId, file, signedAt }) => {
          // Homologa o aditivo; se for DISTRATO, encadeia o encerramento do contrato (POST /:id/end).
          // Distrato no attach-pending: data efetiva degrada p/ a data de assinatura; motivo = descrição.
          const reason = selectedAmendment?.description ?? ''
          void amendmentAttachCommand
            .execute({ contractId, amendmentId, file, signedAt })
            .then((okHomolog) => { if (okHomolog && selectedAmendment?.type === 'distrato') endCommand.execute({ contractId, file, terminatedAt: signedAt, reason }) })
        }}
      />

      <DocumentPreviewModal
        open={previewDoc !== null}
        name={previewDoc?.name ?? ''}
        blobUrl={documentCommand.blobUrl}
        loading={documentCommand.running}
        errorTag={documentCommand.errorTag}
        onClose={() => { setPreviewDoc(null); documentCommand.reset() }}
      />

      <AmendmentModal
        open={viewAmendment !== null}
        mode="view"
        contractNumber={formatContractNumber(contract.sequentialNumber, contract.classification)}
        viewData={viewAmendment ?? undefined}
        onClose={() => { setViewAmendment(null) }}
        onCreate={() => { /* não usado no modo view */ }}
        onAttach={() => { /* não usado no modo view */ }}
        submitting={false}
        errorTag={null}
      />
    </div>
  )
}
