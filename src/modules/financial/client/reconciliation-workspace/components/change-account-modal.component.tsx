/**
 * ChangeAccountModal — view burra: modal "Alterar conta" (troca de conta sem voltar ao grid). Estrutura
 * fiel ao mock conciliacao_bancaria (modal-acc): cabeçalho (ícone + título + sub + ×), busca, lista
 * agrupada (Contas ativas / Encerradas) com bank-mark, identidade, saldo e marca da conta atual, + botão
 * "Adicionar nova conta bancária". A listagem real depende de #168 → estado honesto até lá. Só props.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { SearchIcon, WalletIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { ChangeAccountListState } from '../change-account.binding.ts'
import type { ChangeAccountItem } from '../reconciliation-workspace.view-model.ts'

const t = createTranslator(ptBR)
const CLOSE_GLYPH = '✕'
const PLUS_GLYPH = '+'
const CHECK_GLYPH = '✓'

export type ChangeAccountModalProps = Readonly<{
  open: boolean
  search: string
  list: ChangeAccountListState
  onClose: () => void
  onSearch: (v: string) => void
  onSelect: (id: string) => void
  onAdd: () => void
}>

function AccountItem({ item, onSelect }: { item: ChangeAccountItem; onSelect: (id: string) => void }) {
  const variant = item.isCurrent ? s.accItem.current : item.openable ? s.accItem.active : s.accItem.closed
  const body = (
    <>
      <span className={s.accMark} aria-hidden>
        {item.initials}
      </span>
      <span className={s.accItemInfo}>
        <span className={s.accItemName}>{item.name}</span>
        <span className={s.accItemMeta}>{item.meta}</span>
      </span>
      <span className={s.accItemBal}>
        <span className={s.accBalVal}>{item.balanceBRL}</span>
        <span className={s.accBalUpd}>{item.updated}</span>
      </span>
      {item.isCurrent ? (
        <span className={s.accState.current} aria-hidden>
          {CHECK_GLYPH}
        </span>
      ) : (
        <span className={s.accState.none} aria-hidden />
      )}
    </>
  )
  // Conta encerrada não abre o workspace → item não interativo (mock: is-inactive).
  if (!item.openable) {
    return <div className={variant}>{body}</div>
  }
  return (
    <button
      type="button"
      className={variant}
      aria-current={item.isCurrent ? 'true' : undefined}
      onClick={() => {
        onSelect(item.id)
      }}
    >
      {body}
    </button>
  )
}

export function ChangeAccountModal({
  open,
  search,
  list,
  onClose,
  onSearch,
  onSelect,
  onAdd,
}: ChangeAccountModalProps) {
  if (!open) return null
  return (
    <div
      className={s.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('financial.recon.switch.title')}
      onClick={onClose}
    >
      {}
      <div
        className={s.modalDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <header className={s.modalHead}>
          <span className={s.modalHeadIc} aria-hidden>
            <WalletIcon />
          </span>
          <h3 className={s.modalTitle}>{t('financial.recon.switch.title')}</h3>
          <span className={s.modalSub}>{t('financial.recon.switch.sub')}</span>
          <button
            type="button"
            className={s.modalClose}
            aria-label={t('financial.recon.switch.close')}
            onClick={onClose}
          >
            {CLOSE_GLYPH}
          </button>
        </header>

        <div className={s.modalSearch}>
          <div className={s.modalSearchBox}>
            <span className={s.modalSearchIcon} aria-hidden>
              <SearchIcon />
            </span>
            <input
              type="text"
              className={s.modalSearchInput}
              placeholder={t('financial.recon.switch.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                onSearch(e.target.value)
              }}
            />
          </div>
        </div>

        <div className={s.modalBody}>
          {list.tag === 'loading' ? (
            <p className={s.modalNotice}>{t('financial.recon.switch.loading')}</p>
          ) : list.tag === 'unavailable' ? (
            <p className={s.modalNotice}>{t('financial.recon.switch.unavailable')}</p>
          ) : list.tag === 'empty' ? (
            <p className={s.modalNotice}>{t('financial.recon.switch.empty')}</p>
          ) : (
            <>
              {list.groups.active.length > 0 ? (
                <>
                  <div className={s.accGroup}>
                    {t('financial.recon.switch.groupActive')} · {list.groups.active.length}
                  </div>
                  {list.groups.active.map((item) => (
                    <AccountItem key={item.id} item={item} onSelect={onSelect} />
                  ))}
                </>
              ) : null}
              {list.groups.closed.length > 0 ? (
                <>
                  <div className={s.accGroup}>
                    {t('financial.recon.switch.groupClosed')} · {list.groups.closed.length}
                  </div>
                  {list.groups.closed.map((item) => (
                    <AccountItem key={item.id} item={item} onSelect={onSelect} />
                  ))}
                </>
              ) : null}
              <button type="button" className={s.accAdd} onClick={onAdd}>
                <span aria-hidden>{PLUS_GLYPH}</span>
                {t('financial.recon.switch.add')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
