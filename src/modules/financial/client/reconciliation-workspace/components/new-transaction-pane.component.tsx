/**
 * New-transaction-pane (US4) — view burra: lançamento manual sem título. Cards de tipo (§9.4.8) e os
 * CAMPOS CORRESPONDENTES por tipo, fiéis ao mock: Pagamento/Recebimento mostram o bloco de documento
 * (fornecedor/tipo/data/valor/programa); Transferência/Aplicação/Resgate mostram aviso + confirmação
 * consciente + destino/produto; todos têm Categorização (categoria/centro/descrição).
 *
 * Honestidade: o manual-entry (#152) aceita `type` + refs (`supplierRef`/`programRef`/…) + `description`.
 * LIGADOS (reais): Tipo, Fornecedor (parceiros), Programa (programas ativos), Categoria + Centro de custo
 * (referências 020 · #200), Descrição, Destino/produto (core-api#143). CHROME (desabilitados até o backend
 * ativar): campos de documento — Número/Tipo/Emissão/Valor (core-api#370) e classificação Tarifa/Multa/Juros
 * (core-api#371). Acendem quando o contrato do manual-entry aceitar + retornar esses campos.
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
// `value` presente = mostra o dado (read-only, não editável); ausente = placeholder cinza (chrome puro).
function ChromeInput({
  label,
  placeholder,
  mono,
  value,
}: Readonly<{ label: string; placeholder: string; mono?: boolean; value?: string }>) {
  const filled = value !== undefined && value !== ''
  return (
    <label className={s.ntField}>
      <span className={s.ntLabel}>{label}</span>
      <input
        type="text"
        className={mono === true ? s.ntInputMono : s.ntInput}
        placeholder={placeholder}
        value={value ?? ''}
        readOnly
        disabled={!filled}
        aria-disabled={!filled}
      />
    </label>
  )
}

// Select REAL (ligado): Fornecedor/Programa — o backend aceita supplierRef/programRef no manual-entry.
function RealSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
}: Readonly<{
  label: string
  placeholder: string
  value: string
  options: readonly Readonly<{ value: string; label: string }>[]
  onChange: (v: string) => void
}>) {
  return (
    <label className={s.ntField}>
      <span className={s.ntLabel}>{label}</span>
      <select
        className={s.ntSelect}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function NewTransactionPane({ binding }: NewTransactionPaneProps) {
  const { type } = binding
  const special = type !== null && isSpecial(type)
  const destKeyBase = special ? `financial.recon.manual.dest.${type}` : ''

  // Selects da categorização definidos uma vez p/ arranjar em 2 colunas (sem campos full-width → sem rolagem):
  // com bloco de documento → [Programa | Centro] + [Categoria | Subcategoria]; senão → [Centro | Categoria] + [Subcategoria].
  const programaSelect = (
    <RealSelect
      label={t('financial.recon.manual.f.program')}
      placeholder={t('financial.recon.manual.f.programPlaceholder')}
      value={binding.programRef}
      options={binding.programOptions}
      onChange={binding.setProgramRef}
    />
  )
  // #502/S2: Plano Orçamentário — dirige a fonte da cascata (árvore do plano vs operacional), como no documento.
  const planoSelect = (
    <RealSelect
      label={t('financial.recon.manual.f.plano')}
      placeholder={t('financial.recon.manual.f.planoPlaceholder')}
      value={binding.budgetPlanRef}
      options={binding.planoOptions}
      onChange={binding.setBudgetPlanRef}
    />
  )
  const centroSelect = (
    <RealSelect
      label={t('financial.recon.manual.f.costCenter')}
      placeholder={t('financial.recon.manual.f.costCenterPlaceholder')}
      value={binding.costCenterRef}
      options={binding.costCenterOptions}
      onChange={binding.setCostCenterRef}
    />
  )
  const categoriaSelect = (
    <RealSelect
      label={t('financial.recon.manual.f.category')}
      placeholder={t('financial.recon.manual.f.categoryPlaceholder')}
      value={binding.categoryRef}
      options={binding.categoryOptions}
      onChange={binding.setCategoryRef}
    />
  )
  const subcategoriaSelect = (
    <RealSelect
      label={t('financial.recon.manual.f.subcategory')}
      placeholder={t('financial.recon.manual.f.subcategoryPlaceholder')}
      value={binding.subcategoryRef}
      options={binding.subcategoryOptions}
      onChange={binding.setSubcategoryRef}
    />
  )

  // Classificação Tarifa/Multa/Juros — só faz sentido p/ o tipo Tarifa/Juros (FeePenaltyInterest). Campo
  // HONESTO/desligado (as opções aparecem, mas o input do manual-entry no core-api ainda não tem campo
  // estruturado p/ o subtipo): acende quando o backend expor. Reusa os rótulos de tratamento (Fee/Penalty/Interest).
  const feeKindSelect = (
    <label className={s.ntField}>
      <span className={s.ntLabel}>{t('financial.recon.manual.f.feeKind')}</span>
      <select className={s.ntSelect} disabled aria-disabled="true" defaultValue="">
        <option value="">{t('financial.recon.manual.f.feeKindPlaceholder')}</option>
        <option value="Fee">{t('financial.recon.treatment.Fee')}</option>
        <option value="Penalty">{t('financial.recon.treatment.Penalty')}</option>
        <option value="Interest">{t('financial.recon.treatment.Interest')}</option>
      </select>
    </label>
  )

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

        {/* Bloco especial: destino/produto + data de efetivação (a confirmação consciente foi removida a
            pedido da P.O. — só atrapalhava; engano é reversível pelo "desfazer conciliação"). */}
        {special ? (
          <div className={s.ntSection}>
            <div className={`${s.ntRow} ${s.ntRowCols2}`}>
              {/* Destino REAL (#143): contas-cedente ativas (envia destinationAccountRef). */}
              <RealSelect
                label={t(`${destKeyBase}.label`)}
                placeholder={t(`${destKeyBase}.placeholder`)}
                value={binding.destinationAccount}
                options={binding.accountOptions}
                onChange={binding.setDestinationAccount}
              />
              {/* Reflete a data da transação bancária selecionada (read-only — o backend usa a data da transação). */}
              <ChromeInput
                label={t('financial.recon.manual.f.effective')}
                placeholder="DD/MM/AAAA"
                mono
                value={binding.effectiveDate}
              />
            </div>
          </div>
        ) : null}

        {/* Categorização — oculta p/ Transferência/Aplicação/Resgate (movimentação entre contas próprias). */}
        <div className={s.ntSection}>
          {binding.showCategorization ? (
            <>
              <div className={s.ntSectionLbl}>{t('financial.recon.manual.categorize')}</div>
              <p className={s.ntHint}>{t('financial.recon.manual.backendHint')}</p>

              {binding.showPayeeBlock ? (
                <>
                  <div className={`${s.ntRow} ${s.ntRowCols2}`}>
                    {/* Fornecedor — REAL: opções de parceiros ativos (envia supplierRef). */}
                    <RealSelect
                      label={t('financial.recon.manual.f.supplier')}
                      placeholder={t('financial.recon.manual.f.supplierPlaceholder')}
                      value={binding.supplierRef}
                      options={binding.partnerOptions}
                      onChange={binding.setSupplierRef}
                    />
                    {/* Número do documento — chrome até o contrato do manual-entry aceitar (core-api#370). */}
                    <ChromeInput
                      label={t('financial.recon.manual.f.docNumber')}
                      placeholder={t('financial.recon.manual.f.docNumberPlaceholder')}
                      mono
                    />
                  </div>
                  {/* Tipo de doc + Emissão + Valor — chrome até core-api#370, lado a lado (3 colunas). */}
                  <div className={`${s.ntRow} ${s.ntRowCols3}`}>
                    <ChromeSelect
                      label={t('financial.recon.manual.f.docType')}
                      placeholder={t('financial.recon.manual.f.docTypePlaceholder')}
                    />
                    <ChromeInput
                      label={t('financial.recon.manual.f.emission')}
                      placeholder="DD/MM/AAAA"
                      mono
                    />
                    <ChromeInput label={t('financial.recon.manual.f.docValue')} placeholder="R$ 0,00" mono />
                  </div>
                </>
              ) : null}

              {/* Cascata co-dependente Centro de Custo → Categoria → Subcategoria (EPIC #150), em 2 linhas 2-col
              (sem campos full-width). Escolher o centro filtra as categorias (placeholder #341); a categoria
              filtra as subcategorias (real, via parentId). Envia a folha (subcategoria|categoria) como categoryRef. */}
              {binding.showPayeeBlock ? (
                <>
                  {/* Programa + Plano lado a lado (o Plano dirige a cascata); Centro/Categoria/Subcategoria em 3 colunas. */}
                  <div className={`${s.ntRow} ${s.ntRowCols2}`}>
                    {programaSelect}
                    {planoSelect}
                  </div>
                  <div className={`${s.ntRow} ${s.ntRowCols3}`}>
                    {centroSelect}
                    {categoriaSelect}
                    {subcategoriaSelect}
                  </div>
                </>
              ) : (
                <>
                  {/* Tarifa/Juros (único tipo não-payee que categoriza): Plano + a classificação lado a lado
                  (o Plano dirige a cascata); Centro/Categoria/Subcategoria em 3 colunas. A classificação é
                  gated por tipo (só FeePenaltyInterest a tem). */}
                  <div className={`${s.ntRow} ${s.ntRowCols2}`}>
                    {planoSelect}
                    {type === 'FeePenaltyInterest' ? feeKindSelect : null}
                  </div>
                  <div className={`${s.ntRow} ${s.ntRowCols3}`}>
                    {centroSelect}
                    {categoriaSelect}
                    {subcategoriaSelect}
                  </div>
                </>
              )}
            </>
          ) : null}
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
