/**
 * PendingTitlesPane — view burra: lista os TÍTULOS pendentes de conciliação (Pago, ainda não conciliados)
 * no painel de sugestões quando NÃO há extrato importado na sessão — para a aba não ficar vazia. Mais
 * recente no topo. Apenas informativo (conciliar exige um movimento do extrato): reaproveita o visual do
 * `altCard`. Quando há extrato, o fluxo de sugestão da `SuggestionPane` é respeitado (este pane não aparece).
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import { centsToBRL, type PaidPayable } from '../reconciliation-workspace.view-model.ts'

const t = createTranslator(ptBR)

export type PendingTitlesPaneProps = Readonly<{ payables: readonly PaidPayable[] }>

export function PendingTitlesPane({ payables }: PendingTitlesPaneProps) {
  if (payables.length === 0) {
    return <div className={s.assocCol}>{t('financial.recon.pending.empty')}</div>
  }
  return (
    <div className={s.assocCol}>
      <div className={s.altList}>
        <span className={s.altOverline}>
          {t('financial.recon.pending.title')} · {payables.length}
        </span>
        {payables.map((p) => (
          <div key={p.id} className={s.altCard}>
            <div className={s.altInfo}>
              <div className={s.altNm}>
                {p.supplierName ?? p.documentNumber ?? t('financial.recon.pending.untitled')}
              </div>
              <div className={s.altMeta}>
                {p.documentNumber !== null ? <span className={s.altDocRef}>{p.documentNumber}</span> : null}
                <span className={s.altStatusMini.pago}>{t('financial.recon.sugg.paid')}</span>
                <span className={s.altConfMini}>
                  {t('financial.recon.sugg.vencWord')} {p.dueDate}
                </span>
              </div>
            </div>
            <span className={s.altAmt}>{centsToBRL(p.valueCents)}</span>
          </div>
        ))}
      </div>
      <p className={s.assocHint}>{t('financial.recon.pending.hint')}</p>
    </div>
  )
}
