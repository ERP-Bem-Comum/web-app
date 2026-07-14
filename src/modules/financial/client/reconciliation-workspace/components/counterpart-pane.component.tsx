/**
 * Counterpart-pane (US2 do #269) — view burra: contrapartidas esperadas que casam com a transação
 * selecionada (transferência entre contas). Reusa as classes de "outras possibilidades" do match para
 * listar cada candidata (valor, data prevista, aderência) com o botão "Confirmar contrapartida". Só
 * renderiza quando há candidatas (`state.tag === 'ready'`) → invisível p/ transações comuns de título.
 * Recebe o estado derivado por props; sem data-hooks (§XI).
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { CounterpartState } from '../counterpart.binding.ts'

const t = createTranslator(ptBR)
const DOT = '·'

export type CounterpartPaneProps = Readonly<{
  state: CounterpartState
  confirming: boolean
  errorTag: string | null
  onConfirm: (counterpartId: string) => void
}>

export function CounterpartPane({ state, confirming, errorTag, onConfirm }: CounterpartPaneProps) {
  // Só há o que mostrar quando o backend devolve contrapartidas candidatas. Nos demais estados (idle/
  // loading/none/error da busca) a seção fica oculta — não polui a aba de palpites de título.
  if (state.tag !== 'ready') return null

  return (
    <div className={s.counterpartSection}>
      <span className={s.altOverline}>
        {t('financial.recon.counterpart.title')} {DOT} {state.rows.length}
      </span>
      {state.rows.map((row) => (
        <div key={row.counterpartId} className={s.altCard}>
          <div className={s.altInfo}>
            <div className={s.altNm}>{t('financial.recon.counterpart.transfer')}</div>
            <div className={s.altMeta}>
              <span className={s.altConfMini}>
                {`${row.scorePct} ${t('financial.recon.counterpart.matchWord')}`} {DOT}{' '}
                {`${t('financial.recon.counterpart.expected')} ${row.expectedDateBR}`}
              </span>
            </div>
          </div>
          <span className={s.altAmt}>{row.valueBRL}</span>
          <button
            type="button"
            className={s.altBtn}
            disabled={confirming}
            onClick={() => {
              onConfirm(row.counterpartId)
            }}
          >
            {t('financial.recon.counterpart.confirm')}
          </button>
        </div>
      ))}
      {errorTag !== null ? <p className={s.errorText}>{t(errorTag)}</p> : null}
    </div>
  )
}
