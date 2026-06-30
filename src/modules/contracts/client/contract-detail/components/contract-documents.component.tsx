import type { ReactNode } from 'react'
import { useState } from 'react'
import type { Contract, Amendment } from '#modules/contracts/public-api/index.ts'
import { amendmentSeqMap, formatAmendmentNumber } from '../amendment-number.ts'
import {
  sectionBlock,
  sectionHeadRow,
  sectionH3,
  sectionHeadAction,
  aditivos,
  aditRow,
  aditRowClickable,
  aditHead,
  aditHeadCell,
  aditHeadCellRight,
  aditRowBase,
  aditPaginator,
  aditPageBtn,
  aditPageInfo,
  aditNum,
  aditData,
  aditResumo,
  aditImpacto,
  aditImpactoPos,
  aditImpactoNeg,
  aditImpactoBase,
  aditImpactoNeutral,
  docActions,
  docAct,
  docBadge,
  docBadgeBase,
  docBadgePrazo,
  docBadgeValor,
  docBadgeEscopo,
  docBadgeDistrato,
  docBadgeOutro,
  statusBadgePending,
  statusBadgeActive,
  statusBadgeFinished,
  statusBadgeTerminated,
  statusBadgeHomologado,
} from '../page/contract-detail.css.ts'

export interface DocRef {
  readonly name: string
  // id do documento p/ buscar os bytes via .../documents/:id/content (BFF). undefined = sem doc anexado.
  readonly documentId: string | undefined
}

interface Props {
  contract: Contract
  onOpenBase: () => void
  onNewAmendment: () => void
  onOpenAmendment: (amendmentId: string) => void
  onPreview: (doc: DocRef) => void
  onDownload: (doc: DocRef) => void
}

// Ícones padrão (espelham a wireframe: #i-eye / #i-download).
function EyeIcon(): ReactNode {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  )
}
function DownloadIcon(): ReactNode {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v8" /><path d="M4.5 7.5L8 11l3.5-3.5" /><path d="M3 13h10" />
    </svg>
  )
}

const TIPO_CLASS: Record<string, string> = {
  base: docBadgeBase,
  prazo: docBadgePrazo,
  valor: docBadgeValor,
  escopo: docBadgeEscopo,
  distrato: docBadgeDistrato,
  outro: docBadgeOutro,
}
const TIPO_LABEL: Record<string, string> = {
  base: 'Base', prazo: 'Prazo', valor: 'Valor', escopo: 'Escopo', distrato: 'Distrato', outro: 'Outro',
}

const STATUS_CLASS: Record<string, string> = {
  Pendente: statusBadgePending,
  'Em Andamento': statusBadgeActive,
  Homologado: statusBadgeHomologado,
  Vigente: statusBadgeActive,
  Finalizado: statusBadgeFinished,
  Distrato: statusBadgeTerminated,
}

function formatCurrency(cents: number | undefined): string {
  if (cents === undefined) return '—'
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date | null | undefined): string {
  // YYYY-MM-DD (meia-noite UTC) → formatar em UTC p/ não recuar 1 dia em BRT.
  return date ? date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'
}

interface DocRow {
  readonly id: string
  readonly num: string
  readonly type: string
  readonly signedAt: Date | null | undefined
  readonly summary: string
  readonly impactKind: 'base' | 'pos' | 'neg' | 'neutral'
  readonly impactText: string
  readonly status: string
  readonly isBase: boolean
  readonly docName: string
  readonly documentId: string | undefined
}

export function ContractDocuments({ contract, onOpenBase, onNewAmendment, onOpenAmendment, onPreview, onDownload }: Props): ReactNode {
  const [page, setPage] = useState(0)
  const ctPrefix = contract.classification === 'Contract' ? 'CT' : 'OS'

  // Casa cada linha ao seu documento anexado (associação documento ↔ dono via parentType/parentId).
  const baseDocumentId = contract.files.find((f) => f.parentType === 'Contract')?.id
  const amendmentDoc = (amendmentId: string) =>
    contract.files.find((f) => f.parentType === 'Amendment' && f.parentId === amendmentId)

  const seq = amendmentSeqMap(contract.children)
  // Mais recente no topo (item 4): aditivos por createdAt desc; o contrato base fica sempre por último.
  const amendmentsDesc = [...contract.children].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const amendmentRows: readonly DocRow[] = amendmentsDesc.map((a: Amendment): DocRow => {
      const v = a.impactValueCents ?? 0
      // Impacto por tipo: valor → "+ R$ x" (acréscimo) / "− R$ x" (supressão, valor negativo no domínio);
      // prazo → "+ DD/MM/AAAA" (nova vigência); escopo/outro/distrato → sem impacto financeiro.
      const impact =
        a.type === 'distrato'
          ? { kind: 'neg' as const, text: 'DISTRATO' }
          : a.type === 'valor' && v !== 0
            ? v < 0
              ? { kind: 'neg' as const, text: `− ${formatCurrency(Math.abs(v))}` }
              : { kind: 'pos' as const, text: `+ ${formatCurrency(v)}` }
            : a.type === 'prazo' && a.newEndDate
              ? { kind: 'neutral' as const, text: `+ ${formatDate(a.newEndDate)}` }
              : { kind: 'neutral' as const, text: 'sem impacto' }
      const adoc = amendmentDoc(a.id)
      return {
        id: a.id,
        num: formatAmendmentNumber(seq.get(a.id), contract.sequentialNumber, a.amendmentNumber),
        type: a.type,
        // Assinatura: usa o `signedAt` do aditivo (#32, lido no mapper); fallback no `uploadedAt` do
        // documento anexado p/ aditivos legados sem a data.
        signedAt: a.signedAt ?? adoc?.uploadedAt ?? null,
        summary: a.description ?? '—',
        impactKind: impact.kind,
        impactText: impact.text,
        status: a.status,
        isBase: false,
        docName: `Aditivo ${formatAmendmentNumber(seq.get(a.id), contract.sequentialNumber, a.amendmentNumber)}`,
        documentId: adoc?.id,
      }
    })

  const baseRow: DocRow = {
    id: contract.id,
    num: `${ctPrefix} ${contract.sequentialNumber}`,
    type: 'base',
    signedAt: contract.signedAt,
    summary: contract.objective || '—',
    impactKind: 'base',
    impactText: formatCurrency(contract.originalValue.cents),
    // Status do DOCUMENTO base: Pendente (sem assinado) → Homologado (efetivado, em azul).
    status: contract.status === 'Pendente' ? 'Pendente' : 'Homologado',
    isBase: true,
    docName: `Contrato ${ctPrefix} ${contract.sequentialNumber}`,
    documentId: baseDocumentId,
  }

  // Paginação dos ADITIVOS: 5 por página (o contrato base fica sempre por último, fora da paginação).
  const PAGE_SIZE = 5
  const totalPages = Math.max(1, Math.ceil(amendmentRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pagedAmendmentRows = amendmentRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const showPaginator = amendmentRows.length > PAGE_SIZE
  const rows: readonly DocRow[] = [...pagedAmendmentRows, baseRow]

  const impactClass = (k: DocRow['impactKind']): string =>
    k === 'pos' ? aditImpactoPos : k === 'neg' ? aditImpactoNeg : k === 'base' ? aditImpactoBase : aditImpactoNeutral

  return (
    <section className={sectionBlock}>
      <div className={sectionHeadRow}>
        <h3 className={sectionH3}>Documentos</h3>
        <button
          type="button"
          className={sectionHeadAction}
          onClick={onNewAmendment}
          // Aditivo só é aceito pelo core-api em contrato Ativo (Em Andamento) — fora disso retorna
          // 409 ContractNotActive. Gateia o botão por status, com dica explicando o motivo.
          disabled={contract.status !== 'Em Andamento'}
          title={
            contract.status === 'Em Andamento'
              ? undefined
              : contract.status === 'Pendente'
                ? 'Disponível após a efetivação do contrato (Em Andamento).'
                : contract.status === 'Distrato'
                  ? 'Contrato em distrato não aceita novos aditivos.'
                  : 'Contrato finalizado não aceita novos aditivos.'
          }
        >
          + Novo Aditivo
        </button>
      </div>

      <div className={aditivos}>
        <div className={`${aditRow} ${aditHead}`}>
          <span className={aditHeadCell}>Nº</span>
          <span className={aditHeadCell}>Tipo</span>
          <span className={aditHeadCell}>Assinatura</span>
          <span className={aditHeadCell}>Resumo</span>
          <span className={`${aditHeadCell} ${aditHeadCellRight}`}>Impacto</span>
          <span className={aditHeadCell}>Status</span>
          <span className={`${aditHeadCell} ${aditHeadCellRight}`}>Doc</span>
        </div>

        {rows.map((r) => {
          // Linha clicável: base (abre o doc do contrato) e TODO aditivo — Pendente abre p/ anexar/homologar;
          // já existente (Homologado/etc.) abre o modal em modo leitura (view) com as infos preenchidas.
          const amendmentClickable = !r.isBase
          const clickProps = r.isBase
            ? { role: 'button' as const, tabIndex: 0, onClick: onOpenBase }
            : amendmentClickable
              ? { role: 'button' as const, tabIndex: 0, onClick: () => { onOpenAmendment(r.id) } }
              : {}
          return (
          <div
            key={r.id}
            className={`${aditRow} ${r.isBase ? `${aditRowClickable} ${aditRowBase}` : amendmentClickable ? aditRowClickable : ''}`}
            {...clickProps}
          >
            <span className={aditNum}>{r.num}</span>
            <span><span className={`${docBadge} ${TIPO_CLASS[r.type] ?? docBadgeOutro}`}>{TIPO_LABEL[r.type] ?? r.type}</span></span>
            <span className={aditData}>{formatDate(r.signedAt)}</span>
            <span className={aditResumo} title={r.summary}>{r.summary}</span>
            <span className={`${aditImpacto} ${impactClass(r.impactKind)}`}>{r.impactText}</span>
            <span>
              {/* Status com a MESMA métrica do badge de Tipo (docBadge) — proporcional na tabela. */}
              <span className={`${docBadge} ${STATUS_CLASS[r.status] ?? ''}`}>
                {r.status}
              </span>
            </span>
            <span className={docActions}>
              <button
                type="button"
                className={docAct}
                aria-label="Visualizar documento"
                title={r.documentId !== undefined ? 'Visualizar documento' : 'Sem documento anexado'}
                disabled={r.documentId === undefined}
                onClick={(e) => { e.stopPropagation(); onPreview({ name: r.docName, documentId: r.documentId }) }}
              >
                <EyeIcon />
              </button>
              <button
                type="button"
                className={docAct}
                aria-label="Baixar documento"
                title={r.documentId !== undefined ? 'Baixar documento' : 'Sem documento anexado'}
                disabled={r.documentId === undefined}
                onClick={(e) => { e.stopPropagation(); onDownload({ name: r.docName, documentId: r.documentId }) }}
              >
                <DownloadIcon />
              </button>
            </span>
          </div>
          )
        })}
      </div>

      {showPaginator && (
        <div className={aditPaginator}>
          <button
            type="button"
            className={aditPageBtn}
            disabled={safePage === 0}
            aria-label="Página anterior"
            onClick={() => { setPage((p) => Math.max(0, p - 1)) }}
          >
            ‹
          </button>
          <span className={aditPageInfo}>{safePage + 1} / {totalPages}</span>
          <button
            type="button"
            className={aditPageBtn}
            disabled={safePage >= totalPages - 1}
            aria-label="Próxima página"
            onClick={() => { setPage((p) => Math.min(totalPages - 1, p + 1)) }}
          >
            ›
          </button>
        </div>
      )}
    </section>
  )
}
