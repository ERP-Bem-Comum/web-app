/**
 * Search-create-pane (US3) — view burra: conciliação N:1 / parcial, fiel ao mock (§9.4.6). Resumo
 * (extrato × selecionados × diferença), busca + filtros (Período/Tipo/Valor), grid de títulos Pago com
 * multi-seleção (Data/Status/Nome·Ref/Categoria/Valor), rodapé, tratamento da diferença (cards + extras)
 * e atalho "criar novo". O botão Conciliar é bloqueado até balancear (gating do binding, regra pura).
 *
 * Honestidade: busca + filtros por Tipo (documento), Período (mês do vencimento) e Valor (faixa) são
 * client-side e funcionam sobre a lista já carregada (o filtro server-side por período é #324); a Categoria
 * depende de core-api#172 (null hoje → "—"); Status é "Pago" (só Pago concilia); os campos do tratamento
 * (centro de custo/observação) seguem client-side.
 */
import type { ComponentType } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  LinkIcon,
  SearchIcon,
  TargetIcon,
  TrendingUpIcon,
  WalletIcon,
} from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import {
  centsToBRL,
  type DifferenceTreatment,
  type PaidPayable,
} from '../reconciliation-workspace.view-model.ts'
import type { SearchCreateBinding } from '../search-create.binding.ts'

const t = createTranslator(ptBR)
const DASH = '—'
const DOT = '·'
const PLUS = '+'

const TREATMENTS: readonly DifferenceTreatment[] = ['Interest', 'Penalty', 'Discount', 'Fee', 'Partial']
const TREAT_ICON: Readonly<Record<DifferenceTreatment, ComponentType>> = {
  Interest: TrendingUpIcon,
  Penalty: TargetIcon,
  Discount: ChevronDownIcon,
  Fee: WalletIcon,
  Partial: LinkIcon,
}

export type SearchCreatePaneProps = Readonly<{
  binding: SearchCreateBinding
  payables: readonly PaidPayable[]
  extratoValueCents: string
}>

function PayRow({
  p,
  checked,
  onToggle,
}: Readonly<{ p: PaidPayable; checked: boolean; onToggle: (id: string) => void }>) {
  return (
    <button
      type="button"
      className={checked ? s.pmRow.checked : s.pmRow.off}
      aria-pressed={checked}
      onClick={() => {
        onToggle(p.id)
      }}
    >
      <span className={checked ? s.pmCb.on : s.pmCb.off} aria-hidden>
        {checked ? '✓' : ''}
      </span>
      <span className={s.pmDt}>{p.dueDate}</span>
      <span className={s.pmStatus}>{t('financial.recon.multi.status.paid')}</span>
      <span className={s.pmNmCell}>
        <span className={s.pmNm}>{p.supplierName ?? p.documentNumber ?? p.documentId}</span>
        <span className={s.pmDocRef}>{p.documentNumber ?? p.documentId}</span>
      </span>
      <span className={s.pmCat}>{p.category ?? DASH}</span>
      <span className={s.pmAmt}>{centsToBRL(p.valueCents)}</span>
    </button>
  )
}

const PERIOD_FIELDS: readonly { field: 'due' | 'issue'; labelTag: string }[] = [
  { field: 'due', labelTag: 'financial.recon.multi.flt.periodField.due' },
  { field: 'issue', labelTag: 'financial.recon.multi.flt.periodField.issue' },
]

/** Filtro de Período (popover): segmented toggle Vencimento/Emissão + 2 date inputs (De/Até) + Aplicar/Limpar. */
function PeriodFilter({ binding }: Readonly<{ binding: SearchCreateBinding }>) {
  return (
    <span className={s.ddWrap}>
      <button
        type="button"
        className={binding.periodActive ? s.pmMiniFltOn : s.pmMiniFlt}
        aria-haspopup="dialog"
        aria-expanded={binding.periodOpen}
        onClick={binding.togglePeriod}
      >
        <CalendarDaysIcon />
        <span className={s.pmMiniLbl}>{t('financial.recon.multi.flt.period')}</span>
        {binding.periodActive ? <span className={s.fltDot} aria-hidden /> : null}
        <span className={s.pmMiniChev} aria-hidden>
          <ChevronDownIcon />
        </span>
      </button>
      {binding.periodOpen ? (
        <>
          <button
            type="button"
            className={s.ddBackdrop}
            aria-label={t('financial.recon.multi.flt.close')}
            onClick={binding.closePeriod}
          />
          <div className={s.filterPopover} role="dialog" aria-label={t('financial.recon.multi.flt.period')}>
            <div className={s.fltSeg} role="group" aria-label={t('financial.recon.multi.flt.periodBy')}>
              {PERIOD_FIELDS.map((f) => {
                const active = binding.periodFieldDraft === f.field
                return (
                  <button
                    key={f.field}
                    type="button"
                    className={active ? s.fltSegBtn.on : s.fltSegBtn.off}
                    aria-pressed={active}
                    onClick={() => {
                      binding.setPeriodFieldDraft(f.field)
                    }}
                  >
                    {t(f.labelTag)}
                  </button>
                )
              })}
            </div>
            <div className={s.periodCustomRow}>
              <label className={s.periodCustomField}>
                <span className={s.periodCustomLbl}>{t('financial.recon.multi.flt.from')}</span>
                <input
                  type="date"
                  className={s.periodCustomInput}
                  value={binding.periodFromDraft}
                  max={binding.periodToDraft !== '' ? binding.periodToDraft : undefined}
                  aria-label={t('financial.recon.multi.flt.from')}
                  onChange={(e) => {
                    binding.setPeriodFromDraft(e.target.value)
                  }}
                />
              </label>
              <label className={s.periodCustomField}>
                <span className={s.periodCustomLbl}>{t('financial.recon.multi.flt.to')}</span>
                <input
                  type="date"
                  className={s.periodCustomInput}
                  value={binding.periodToDraft}
                  min={binding.periodFromDraft !== '' ? binding.periodFromDraft : undefined}
                  aria-label={t('financial.recon.multi.flt.to')}
                  onChange={(e) => {
                    binding.setPeriodToDraft(e.target.value)
                  }}
                />
              </label>
            </div>
            <div className={s.fltActions}>
              <button type="button" className={s.fltClear} onClick={binding.clearPeriod}>
                {t('financial.recon.multi.flt.clear')}
              </button>
              <button type="button" className={s.fltApply} onClick={binding.applyPeriod}>
                {t('financial.recon.multi.flt.apply')}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </span>
  )
}

/** Filtro de Valor (popover): 2 inputs numéricos R$ (Mínimo/Máximo) + Aplicar/Limpar. */
function ValueFilter({ binding }: Readonly<{ binding: SearchCreateBinding }>) {
  return (
    <span className={s.ddWrap}>
      <button
        type="button"
        className={binding.valueActive ? s.pmMiniFltOn : s.pmMiniFlt}
        aria-haspopup="dialog"
        aria-expanded={binding.valueOpen}
        onClick={binding.toggleValue}
      >
        <WalletIcon />
        <span className={s.pmMiniLbl}>{t('financial.recon.multi.flt.value')}</span>
        {binding.valueActive ? <span className={s.fltDot} aria-hidden /> : null}
        <span className={s.pmMiniChev} aria-hidden>
          <ChevronDownIcon />
        </span>
      </button>
      {binding.valueOpen ? (
        <>
          <button
            type="button"
            className={s.ddBackdrop}
            aria-label={t('financial.recon.multi.flt.close')}
            onClick={binding.closeValue}
          />
          <div className={s.filterPopoverEnd} role="dialog" aria-label={t('financial.recon.multi.flt.value')}>
            <div className={s.periodCustomRow}>
              <label className={s.periodCustomField}>
                <span className={s.periodCustomLbl}>{t('financial.recon.multi.flt.min')}</span>
                <span className={s.fltMoneyWrap}>
                  <span className={s.fltMoneyPrefix} aria-hidden>
                    {t('financial.recon.multi.flt.valuePrefix')}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={s.fltMoneyInput}
                    placeholder="0,00"
                    value={binding.valueMinDraft}
                    aria-label={t('financial.recon.multi.flt.min')}
                    onChange={(e) => {
                      binding.setValueMinDraft(e.target.value)
                    }}
                  />
                </span>
              </label>
              <label className={s.periodCustomField}>
                <span className={s.periodCustomLbl}>{t('financial.recon.multi.flt.max')}</span>
                <span className={s.fltMoneyWrap}>
                  <span className={s.fltMoneyPrefix} aria-hidden>
                    {t('financial.recon.multi.flt.valuePrefix')}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={s.fltMoneyInput}
                    placeholder="0,00"
                    value={binding.valueMaxDraft}
                    aria-label={t('financial.recon.multi.flt.max')}
                    onChange={(e) => {
                      binding.setValueMaxDraft(e.target.value)
                    }}
                  />
                </span>
              </label>
            </div>
            <div className={s.fltActions}>
              <button type="button" className={s.fltClear} onClick={binding.clearValue}>
                {t('financial.recon.multi.flt.clear')}
              </button>
              <button type="button" className={s.fltApply} onClick={binding.applyValue}>
                {t('financial.recon.multi.flt.apply')}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </span>
  )
}

export function SearchCreatePane({ binding, extratoValueCents }: SearchCreatePaneProps) {
  const hasDiff = binding.residualCents !== 0
  const selectedCount = binding.selectedIds.size

  return (
    <div className={s.assocCol}>
      {/* Resumo: extrato × selecionados × diferença */}
      <div className={s.pmSummary}>
        <div className={s.pmSummaryLeft}>
          <div className={s.pmExtrato}>
            <span className={s.pmSummaryLbl}>{t('financial.recon.multi.extratoValue')}</span>
            <span className={s.pmExtratoVal}>{centsToBRL(extratoValueCents)}</span>
          </div>
          <div className={s.pmSel}>
            <span className={s.pmSummaryLbl}>
              {t('financial.recon.multi.selected')} {DOT} {selectedCount}
            </span>
            <span className={s.pmSelVal}>{centsToBRL(binding.selectedSumCents)}</span>
          </div>
        </div>
        <div className={hasDiff ? s.pmDiff.error : s.pmDiff.zero}>
          <span className={s.pmDiffLbl}>{t('financial.recon.multi.diff')}</span>
          <span className={s.pmDiffVal}>{centsToBRL(binding.residualCents)}</span>
        </div>
      </div>

      {/* Busca + filtros */}
      <div className={s.pmSearchBar}>
        <div className={s.pmSearchInput}>
          <span className={s.pmSearchIcon} aria-hidden>
            <SearchIcon />
          </span>
          <input
            type="text"
            className={s.pmSearchField}
            placeholder={t('financial.recon.multi.searchPlaceholder')}
            value={binding.search}
            onChange={(e) => {
              binding.setSearch(e.target.value)
            }}
          />
        </div>
        {/* Período: popover com toggle Vencimento/Emissão + calendário De/Até (056) */}
        <PeriodFilter binding={binding} />
        {/* Tipo: lista CANÔNICA de documento + impostos retidos (056) */}
        <span className={s.pmMiniSelWrap}>
          <span className={s.pmMiniLbl}>{t('financial.recon.multi.flt.type')}</span>
          <select
            className={s.pmMiniSelect}
            aria-label={t('financial.recon.multi.flt.type')}
            value={binding.documentType}
            onChange={(e) => {
              binding.setDocumentType(e.target.value)
            }}
          >
            <option value="all">{t('financial.recon.multi.flt.typeAll')}</option>
            {binding.typeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </span>
        {/* Valor: popover com intervalo Mínimo/Máximo em R$ (056) */}
        <ValueFilter binding={binding} />
      </div>

      {/* Grid de títulos Pago */}
      {binding.totalCount === 0 ? (
        <p className={s.emptyState}>{t('financial.recon.multi.empty')}</p>
      ) : (
        <div className={s.pmGrid}>
          <div className={s.pmGridHead}>
            <span />
            <span>{t('financial.recon.multi.col.date')}</span>
            <span>{t('financial.recon.multi.col.status')}</span>
            <span>{t('financial.recon.multi.col.name')}</span>
            <span>{t('financial.recon.multi.col.category')}</span>
            <span className={s.pmRight}>{t('financial.recon.multi.col.value')}</span>
          </div>
          <div className={s.pmRows}>
            {binding.filtered.length === 0 ? (
              <p className={s.emptyState}>{t('financial.recon.multi.noResults')}</p>
            ) : (
              binding.filtered.map((p) => (
                <PayRow key={p.id} p={p} checked={binding.selectedIds.has(p.id)} onToggle={binding.toggle} />
              ))
            )}
          </div>
          <div className={s.pmFoot}>
            <span>
              <span className={s.pmFootCount}>{selectedCount}</span> {t('financial.recon.multi.footSelected')}{' '}
              {binding.totalCount}
            </span>
            <span className={s.pmFootTotal}>{centsToBRL(binding.selectedSumCents)}</span>
          </div>
        </div>
      )}

      {/* Tratamento da diferença — só após clicar Conciliar com diferença (§9.4.6) */}
      {binding.showTreatment ? (
        <div className={s.diffTreat}>
          <div className={s.dtHead}>
            <span className={s.dtHeadIc} aria-hidden>
              <TargetIcon />
            </span>
            <span className={s.dtLbl}>{t('financial.recon.multi.diffTreat')}</span>
            <span className={s.dtAmt}>{centsToBRL(binding.residualCents)}</span>
          </div>
          <p className={s.dtExplain}>{t('financial.recon.multi.diffExplain')}</p>
          <div className={s.diffTypes}>
            {TREATMENTS.map((tr) => {
              const active = binding.treatment === tr
              const Icon = TREAT_ICON[tr]
              return (
                <button
                  key={tr}
                  type="button"
                  className={active ? s.diffTypeCard.on : s.diffTypeCard.off}
                  aria-pressed={active}
                  onClick={() => {
                    binding.setTreatment(tr)
                  }}
                >
                  <span className={active ? s.dtcIc.on : s.dtcIc.off} aria-hidden>
                    <Icon />
                  </span>
                  <span className={active ? s.dtcName.on : s.dtcName.off}>
                    {t(`financial.recon.treatment.${tr}`)}
                  </span>
                </button>
              )
            })}
          </div>
          {binding.treatment !== null ? (
            <div className={s.diffExtras}>
              <div className={`${s.ntRow} ${s.ntRowCols2}`}>
                <label className={s.ntField}>
                  <span className={s.ntLabel}>{t('financial.recon.multi.diffCostCenter')}</span>
                  <select
                    className={s.ntSelect}
                    value={binding.costCenterRef}
                    onChange={(e) => {
                      binding.setCostCenterRef(e.target.value)
                    }}
                  >
                    <option value="">{t('financial.recon.multi.diffCostCenterPlaceholder')}</option>
                    {binding.costCenterOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={s.ntField}>
                  <span className={s.ntLabel}>
                    {t('financial.recon.multi.diffNote')}{' '}
                    <span className={s.ntOpt}>{t('financial.recon.manual.optional')}</span>
                  </span>
                  <input
                    type="text"
                    className={s.ntInput}
                    placeholder={t('financial.recon.multi.diffNotePlaceholder')}
                    value={binding.observation}
                    onChange={(e) => {
                      binding.setObservation(e.target.value)
                    }}
                  />
                </label>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Atalho: criar novo pagamento (chrome até #172/cadastro) */}
      <button type="button" className={s.pmCreateNew} disabled aria-disabled="true">
        <span aria-hidden>{PLUS}</span>
        {t('financial.recon.multi.createNew')}
      </button>

      {binding.errorTag !== null ? <p className={s.errorText}>{t(binding.errorTag)}</p> : null}

      <div className={s.ntActions}>
        <button
          type="button"
          className={s.ntCancel}
          onClick={() => {
            binding.clear()
          }}
        >
          {t('financial.recon.multi.clear')}
        </button>
        <span className={s.spacer} />
        <button
          type="button"
          className={s.btnConfirm}
          disabled={!binding.canConfirm || binding.submitting}
          onClick={() => {
            binding.confirm()
          }}
        >
          <LinkIcon />
          {t('financial.recon.multi.confirm')} {selectedCount > 0 ? `(${String(selectedCount)})` : ''}
        </button>
      </div>
    </div>
  )
}
