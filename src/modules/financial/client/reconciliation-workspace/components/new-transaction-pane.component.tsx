/**
 * New-transaction-pane (US4) — view burra: lançamento manual sem título. Cards de tipo (§9.4.8) e os
 * CAMPOS CORRESPONDENTES por tipo, fiéis ao mock: Pagamento/Recebimento mostram o bloco de documento
 * (fornecedor/tipo/data/valor/programa); Transferência/Aplicação/Resgate mostram aviso + confirmação
 * consciente + destino/produto; todos têm Categorização (categoria/centro/descrição).
 *
 * Honestidade: o contrato de manual-entry (#152) aceita só `type` + refs + `description`; as listas de
 * opções (fornecedor/programa/categoria/centro/produto) e os campos de documento dependem do backend →
 * ficam como chrome (desabilitados, em estado de placeholder). Tipo + Descrição + confirmação funcionam.
 */
import type { ComponentType } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import {
  CheckCircleIcon,
  DownloadIcon,
  LinkIcon,
  TrendingUpIcon,
  UploadIcon,
  WalletIcon,
} from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { ManualEntryType } from '../reconciliation-workspace.view-model.ts'
import type { ManualEntryBinding } from '../manual-entry.binding.ts'

const t = createTranslator(ptBR)
const CHECK_GLYPH = '✓'
const BANG_GLYPH = '!'

const TYPES: readonly ManualEntryType[] = [
  'Payment',
  'Receipt',
  'Transfer',
  'FeePenaltyInterest',
  'Investment',
  'Redemption',
]
const TYPE_ICON: Readonly<Record<ManualEntryType, ComponentType>> = {
  Payment: UploadIcon,
  Receipt: DownloadIcon,
  Transfer: LinkIcon,
  FeePenaltyInterest: WalletIcon,
  Investment: TrendingUpIcon,
  Redemption: TrendingUpIcon,
}
const SPECIAL: readonly ManualEntryType[] = ['Transfer', 'Investment', 'Redemption']
const isSpecial = (tp: ManualEntryType): tp is 'Transfer' | 'Investment' | 'Redemption' =>
  SPECIAL.includes(tp)

export type NewTransactionPaneProps = Readonly<{ binding: ManualEntryBinding }>

// Campo "chrome": label + controle desabilitado em estado de placeholder (depende do backend).
function ChromeSelect({ label, placeholder }: Readonly<{ label: string; placeholder: string }>) {
  return (
    <label className={s.ntField}>
      <span className={s.ntLabel}>{label}</span>
      <select className={s.ntSelect} disabled aria-disabled="true" defaultValue="">
        <option value="">{placeholder}</option>
      </select>
    </label>
  )
}
function ChromeInput({
  label,
  placeholder,
  mono,
}: Readonly<{ label: string; placeholder: string; mono?: boolean }>) {
  return (
    <label className={s.ntField}>
      <span className={s.ntLabel}>{label}</span>
      <input
        type="text"
        className={mono === true ? s.ntInputMono : s.ntInput}
        placeholder={placeholder}
        disabled
        aria-disabled="true"
      />
    </label>
  )
}

export function NewTransactionPane({ binding }: NewTransactionPaneProps) {
  const { type } = binding
  const special = type !== null && isSpecial(type)
  const destKeyBase = special ? `financial.recon.manual.dest.${type}` : ''

  return (
    <div className={s.assocCol}>
      <div className={s.ntForm}>
        {/* Classificação do lançamento — cards de tipo */}
        <div className={s.ntSection}>
          <div className={s.ntSectionLbl}>{t('financial.recon.manual.classify')}</div>
          <div className={s.ntTypeGrid}>
            {TYPES.map((tp) => {
              const active = type === tp
              const Icon = TYPE_ICON[tp]
              return (
                <button
                  key={tp}
                  type="button"
                  className={active ? s.ntCard.on : s.ntCard.off}
                  aria-pressed={active}
                  onClick={() => {
                    binding.setType(tp)
                  }}
                >
                  {active && isSpecial(tp) ? (
                    <span className={s.ntCardBadge} aria-hidden>
                      {BANG_GLYPH}
                    </span>
                  ) : null}
                  <span className={active ? s.ntCardIc.on : s.ntCardIc.off} aria-hidden>
                    <Icon />
                  </span>
                  <span className={active ? s.ntCardName.on : s.ntCardName.off}>
                    {t(`financial.recon.manualType.${tp}`)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bloco especial: aviso + confirmação consciente + destino/produto + data de efetivação */}
        {special ? (
          <div className={s.ntSection}>
            <div className={s.ntWarn}>
              <span className={s.ntWarnIc} aria-hidden>
                <LinkIcon />
              </span>
              <div className={s.ntWarnTxt}>
                {t(`${destKeyBase}.warning`)}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={binding.consciousConfirm}
                  className={s.ntConfirm}
                  onClick={() => {
                    binding.setConsciousConfirm(!binding.consciousConfirm)
                  }}
                >
                  <span
                    className={binding.consciousConfirm ? s.ntConfirmCb.on : s.ntConfirmCb.off}
                    aria-hidden
                  >
                    {binding.consciousConfirm ? CHECK_GLYPH : ''}
                  </span>
                  {t(`${destKeyBase}.confirm`)}
                </button>
              </div>
            </div>
            <div className={`${s.ntRow} ${s.ntRowCols2}`}>
              <ChromeSelect label={t(`${destKeyBase}.label`)} placeholder={t(`${destKeyBase}.placeholder`)} />
              <ChromeInput label={t('financial.recon.manual.f.effective')} placeholder="DD/MM/AAAA" mono />
            </div>
          </div>
        ) : null}

        {/* Categorização */}
        <div className={s.ntSection}>
          <div className={s.ntSectionLbl}>{t('financial.recon.manual.categorize')}</div>
          <p className={s.ntHint}>{t('financial.recon.manual.backendHint')}</p>

          {binding.showPayeeBlock ? (
            <>
              <div className={`${s.ntRow} ${s.ntRowCols2}`}>
                <ChromeInput
                  label={t('financial.recon.manual.f.supplier')}
                  placeholder={t('financial.recon.manual.f.supplierPlaceholder')}
                />
                <ChromeSelect
                  label={t('financial.recon.manual.f.docType')}
                  placeholder={t('financial.recon.manual.f.docTypePlaceholder')}
                />
              </div>
              <div className={`${s.ntRow} ${s.ntRowCols2}`}>
                <ChromeInput label={t('financial.recon.manual.f.emission')} placeholder="DD/MM/AAAA" mono />
                <ChromeInput label={t('financial.recon.manual.f.docValue')} placeholder="R$ 0,00" mono />
              </div>
              <div className={s.ntRow}>
                <ChromeSelect
                  label={t('financial.recon.manual.f.program')}
                  placeholder={t('financial.recon.manual.f.programPlaceholder')}
                />
              </div>
            </>
          ) : null}

          <div className={`${s.ntRow} ${s.ntRowCols2}`}>
            <ChromeSelect
              label={t('financial.recon.manual.f.category')}
              placeholder={t('financial.recon.manual.f.categoryPlaceholder')}
            />
            <ChromeSelect
              label={t('financial.recon.manual.f.costCenter')}
              placeholder={t('financial.recon.manual.f.costCenterPlaceholder')}
            />
          </div>
          <div className={s.ntRow}>
            <label className={s.ntField}>
              <span className={s.ntLabel}>
                {t('financial.recon.manual.description')}{' '}
                <span className={s.ntOpt}>{t('financial.recon.manual.optional')}</span>
              </span>
              <textarea
                className={s.ntTextarea}
                placeholder={t('financial.recon.manual.descPlaceholder')}
                value={binding.description}
                onChange={(e) => {
                  binding.setDescription(e.target.value)
                }}
              />
            </label>
          </div>
        </div>

        {binding.errorTag !== null ? <p className={s.errorText}>{t(binding.errorTag)}</p> : null}

        <div className={s.ntActions}>
          <button
            type="button"
            className={s.ntCancel}
            onClick={() => {
              binding.reset()
            }}
          >
            {t('financial.recon.manual.cancel')}
          </button>
          <span className={s.spacer} />
          <button
            type="button"
            className={s.btnConfirm}
            disabled={!binding.canSubmit || binding.submitting}
            onClick={() => {
              binding.submit()
            }}
          >
            <CheckCircleIcon />
            {t('financial.recon.manual.submitFull')}
          </button>
        </div>
      </div>
    </div>
  )
}
