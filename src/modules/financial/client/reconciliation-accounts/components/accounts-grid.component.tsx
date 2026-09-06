/**
 * AccountsGrid (TELA 1) — view burra: cabeçalho + linhas das contas-cedente (bank-mark, conta+meta,
 * última atualização, saldo, pill de conciliação, seta). Recebe as linhas derivadas por props; sem
 * data-hooks. Conta encerrada não abre (linha não-clicável + aviso).
 *
 * A linha NÃO é mais um <button> único: o corpo (role=button) leva à conciliação; a SETA é um botão
 * separado que alterna o EXPAND com os dados do cadastro (saldo inicial + data), logo abaixo da linha.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { CheckCircleIcon, ChevronDownIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-accounts.css.ts'
import type { AccountRow } from '../reconciliation-accounts.view-model.ts'

const t = createTranslator(ptBR)

export type AccountsGridProps = Readonly<{
  rows: readonly AccountRow[]
  expanded: ReadonlySet<string>
  onOpen: (row: AccountRow) => void
  onToggle: (id: string) => void
  onRequestClose: (row: AccountRow) => void
  onRequestEdit: (row: AccountRow) => void
  onRequestReopen: (row: AccountRow) => void
  onRequestDelete: (row: AccountRow) => void
  /** Conta sendo reaberta agora — desabilita o próprio botão, sem travar a linha inteira. */
  reopeningId: string | null
}>

function StatusPill({ row }: Readonly<{ row: AccountRow }>) {
  if (row.status === 'closed') {
    return <span className={s.statusPill.closed}>{t('financial.recon.accounts.status.closed')}</span>
  }
  if (row.status === 'pending') {
    return (
      <span className={s.statusPill.pending}>
        <span className={s.pillDot.pending} aria-hidden="true" />
        {t('financial.recon.accounts.status.pending').replace('{n}', String(row.pendingCount))}
      </span>
    )
  }
  return (
    <span className={s.statusPill.upToDate}>
      <CheckCircleIcon />
      {t('financial.recon.accounts.status.upToDate')}
    </span>
  )
}

function ExpandPanel({
  row,
  onRequestClose,
  onRequestEdit,
  onRequestReopen,
  onRequestDelete,
  reopeningId,
}: Readonly<{
  row: AccountRow
  onRequestClose: (row: AccountRow) => void
  onRequestEdit: (row: AccountRow) => void
  onRequestReopen: (row: AccountRow) => void
  onRequestDelete: (row: AccountRow) => void
  /** Conta sendo reaberta agora — desabilita o próprio botão, sem travar a linha inteira. */
  reopeningId: string | null
}>) {
  const tipo = row.typeLabel !== null ? `${t(row.typeTag)} · ${row.typeLabel}` : t(row.typeTag)
  return (
    <div className={s.expandPanel}>
      <div className={s.expandItem}>
        <span className={s.expandLbl}>{t('financial.recon.accounts.expand.tipo')}</span>
        <span className={s.expandVal}>{tipo}</span>
      </div>
      <div className={s.expandItem}>
        <span className={s.expandLbl}>{t('financial.recon.accounts.expand.saldoInicial')}</span>
        <span className={s.expandVal}>{row.openingBalanceBRL}</span>
      </div>
      <div className={s.expandItem}>
        <span className={s.expandLbl}>{t('financial.recon.accounts.expand.dataCadastro')}</span>
        <span className={s.expandVal}>{row.openingDate}</span>
      </div>
      {/* #722: sem convênio a conta concilia normalmente, mas a geração de remessa recusa SEMPRE.
          Dizer isso aqui — no cadastro, onde se resolve — evita que o operador descubra só na hora
          de pagar, com o lote montado e a recusa vindo do backend. */}
      <div className={s.expandItem}>
        <span className={s.expandLbl}>{t('financial.recon.accounts.expand.convenio')}</span>
        <span className={row.missingConvenio ? s.expandValWarn : s.expandVal}>
          {row.missingConvenio ? t('financial.recon.accounts.expand.semConvenio') : row.convenio}
        </span>
      </div>
      {/* Editar: em qualquer conta. Encerrar: só na ativa. Reabrir e Excluir: só na ENCERRADA — são as
          duas saídas que o encerramento passou a ter (core-api#995 B1/B3), e antes delas uma conta
          encerrada por engano ficava presa: não reabria e não podia ser recadastrada. */}
      <div className={s.expandAction}>
        <button
          type="button"
          className={s.editAccountBtn}
          onClick={() => {
            onRequestEdit(row)
          }}
        >
          {t('financial.recon.accounts.edit.action')}
        </button>
        {row.status !== 'closed' ? (
          <button
            type="button"
            className={s.closeAccountBtn}
            onClick={() => {
              onRequestClose(row)
            }}
          >
            {t('financial.recon.accounts.close.action')}
          </button>
        ) : (
          <>
            {/* Reabrir age DIRETO, sem confirmação: é o caminho de recuperação de quem errou, e
                desfazê-lo é só encerrar de novo. Confirmar aqui cobraria mais atenção para consertar o
                engano do que para cometê-lo. */}
            <button
              type="button"
              className={s.editAccountBtn}
              disabled={reopeningId === row.id}
              onClick={() => {
                onRequestReopen(row)
              }}
            >
              {reopeningId === row.id
                ? t('financial.recon.accounts.reopen.running')
                : t('financial.recon.accounts.reopen.action')}
            </button>
            <button
              type="button"
              className={s.closeAccountBtn}
              onClick={() => {
                onRequestDelete(row)
              }}
            >
              {t('financial.recon.accounts.delete.action')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Row({
  row,
  expanded,
  onOpen,
  onToggle,
  onRequestClose,
  onRequestEdit,
  onRequestReopen,
  onRequestDelete,
  reopeningId,
}: Readonly<{
  row: AccountRow
  expanded: boolean
  onOpen: (row: AccountRow) => void
  onToggle: (id: string) => void
  onRequestClose: (row: AccountRow) => void
  onRequestEdit: (row: AccountRow) => void
  onRequestReopen: (row: AccountRow) => void
  onRequestDelete: (row: AccountRow) => void
  /** Conta sendo reaberta agora — desabilita o próprio botão, sem travar a linha inteira. */
  reopeningId: string | null
}>) {
  const initials = (row.bankName || row.bankCode).slice(0, 2).toUpperCase()
  const meta = `${row.bankCode} ${row.bankName} · Ag ${row.branch} · CC ${row.accountNumber}-${row.accountDv}`
  return (
    <>
      <div
        className={row.openable ? s.gridRow.base : s.gridRow.closed}
        role="button"
        tabIndex={row.openable ? 0 : -1}
        aria-disabled={!row.openable}
        onClick={() => {
          if (row.openable) onOpen(row)
        }}
        onKeyDown={(e) => {
          if (row.openable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onOpen(row)
          }
        }}
      >
        <span className={s.colConta}>
          <span className={s.bankMark} aria-hidden="true">
            {initials}
          </span>
          <span className={s.contaInfo}>
            <span className={s.contaNome}>{row.alias}</span>
            <span className={s.contaMeta}>{meta}</span>
          </span>
        </span>
        <span className={s.updRel}>{row.lastUpdatedAt}</span>
        <span className={s.saldoCol}>
          <span className={s.saldoVal}>{row.balanceBRL}</span>
          <span className={s.saldoLbl}>{t('financial.recon.accounts.saldoLbl')}</span>
        </span>
        <StatusPill row={row} />
        <button
          type="button"
          className={s.colArrowBtn}
          aria-expanded={expanded}
          aria-label={t('financial.recon.accounts.expand.aria')}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(row.id)
          }}
        >
          <span className={expanded ? s.chevronOpen : s.chevron} aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </button>
      </div>
      {expanded ? (
        <ExpandPanel
          row={row}
          onRequestClose={onRequestClose}
          onRequestEdit={onRequestEdit}
          onRequestReopen={onRequestReopen}
          onRequestDelete={onRequestDelete}
          reopeningId={reopeningId}
        />
      ) : null}
    </>
  )
}

export function AccountsGrid({
  rows,
  expanded,
  onOpen,
  onToggle,
  onRequestClose,
  onRequestEdit,
  onRequestReopen,
  onRequestDelete,
  reopeningId,
}: AccountsGridProps) {
  return (
    <>
      <div className={s.gridHead}>
        <span>{t('financial.recon.accounts.col.conta')}</span>
        <span>{t('financial.recon.accounts.col.upd')}</span>
        <span className={s.gridHeadRight}>{t('financial.recon.accounts.col.saldo')}</span>
        <span>{t('financial.recon.accounts.col.status')}</span>
        <span />
      </div>
      <div className={s.gridBody}>
        {rows.map((row) => (
          <Row
            key={row.id}
            row={row}
            expanded={expanded.has(row.id)}
            onOpen={onOpen}
            onToggle={onToggle}
            onRequestClose={onRequestClose}
            onRequestEdit={onRequestEdit}
            onRequestReopen={onRequestReopen}
            onRequestDelete={onRequestDelete}
            reopeningId={reopeningId}
          />
        ))}
      </div>
    </>
  )
}
