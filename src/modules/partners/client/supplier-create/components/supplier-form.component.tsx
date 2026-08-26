import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { formatMask, unmask } from '#shared/ui/index.ts'
import { ChevronLeftIcon, ChevronDownIcon, FileTextIcon, WalletIcon } from '#shared/ui/icons/index.ts'

import {
  PIX_KEY_TYPES,
  isPixKeyType,
  SERVICE_RATINGS,
  isServiceRating,
  type SupplierFormController,
} from './supplier-form.controller.ts'
import { BankSelect, isUnknownBank } from '#shared/ui/brand/bank-select.component.tsx'
import { derivePixKey } from '#modules/partners/client/domain/derive-pix-key.ts'
import {
  page,
  scrollArea,
  content,
  head,
  backBtn,
  headTitle,
  sectionCard,
  sectionHeader,
  sectionIcon,
  sectionH2,
  sectionBody,
  grid,
  field,
  fieldLabel,
  control,
  input,
  select,
  chevron,
  controlError,
  fieldError,
  actionbar,
  actionbarInner,
  btnPrimary,
  btnGhost,
} from '#shared/ui/brand/brand-form.css.ts'
import { errorBanner } from './supplier-form.css.ts'

const t = createTranslator(ptBR)

/** Rótulos do seletor de banco (o componente é burro e não fala i18n — como o BrandPaginator). */
const BANK_LABELS = {
  placeholder: t('partners.suppliers.form.bankPlaceholder'),
  frequentGroup: t('partners.suppliers.form.bankFrequent'),
  allGroup: t('partners.suppliers.form.bankAll'),
  unknownPrefix: t('partners.suppliers.form.bankUnknown'),
} as const

export type SupplierFormProps = Readonly<{
  controller: SupplierFormController
  categories: readonly string[]
  /** Mostra as seções Banco/PIX (payment target). Na criação/edição = quem tem `supplier:write`. */
  canEditSensitive: boolean
  /** Bloqueia o campo CNPJ (vital): true na edição sem `supplier:edit-sensitive`. */
  cnpjDisabled?: boolean
  running: boolean
  errorTag: string | null
  onCancel: () => void
  /** Botão "voltar" do cabeçalho "brand". Omitido (ex.: fluxo de edição) → sem botão de voltar. */
  onBack?: () => void
  /** Título do cabeçalho; default = "Novo Fornecedor". A edição passa "Editar Fornecedor". */
  title?: string
}>

// Wrapper de <select> "brand": appearance:none + chevron desenhado (o mock remove a seta nativa).
function SelectControl({
  id,
  value,
  ariaLabel,
  invalid = false,
  onChange,
  children,
}: {
  id: string
  value: string
  ariaLabel?: string
  invalid?: boolean
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
}): ReactNode {
  return (
    <div className={control}>
      <select
        id={id}
        className={`${select} ${invalid ? controlError : ''}`}
        value={value}
        aria-label={ariaLabel}
        onChange={onChange}
      >
        {children}
      </select>
      <span className={chevron}>
        <ChevronDownIcon size={16} />
      </span>
    </div>
  )
}

export function SupplierForm(props: SupplierFormProps): ReactNode {
  const { controller: c } = props
  const isInvalid = (key: string): boolean => c.errors[key] === true
  const invalidMsg = (key: string): string | null =>
    c.errors[key] === true ? t('partners.suppliers.form.invalid') : null

  return (
    <form
      className={page}
      onSubmit={(e) => {
        e.preventDefault()
        c.submit()
      }}
    >
      <div className={scrollArea}>
        <div className={content}>
          {/* Cabeçalho: voltar + título */}
          <div className={head}>
            {props.onBack !== undefined ? (
              <button type="button" className={backBtn} onClick={props.onBack} aria-label={t('common.back')}>
                <ChevronLeftIcon size={18} />
              </button>
            ) : null}
            <h1 className={headTitle}>{props.title ?? t('partners.suppliers.create.title')}</h1>
          </div>

          {props.errorTag !== null ? (
            <div className={errorBanner} role="alert">
              {t(props.errorTag)}
            </div>
          ) : null}

          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <FileTextIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.suppliers.form.section.basic')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                <div className={field}>
                  <label htmlFor="sup-name" className={fieldLabel}>
                    {t('partners.suppliers.form.name')}
                  </label>
                  <input
                    id="sup-name"
                    className={`${input} ${isInvalid('name') ? controlError : ''}`}
                    value={c.state.name}
                    onChange={(e) => {
                      c.setField('name', e.target.value)
                    }}
                  />
                  {invalidMsg('name') !== null ? (
                    <span className={fieldError}>{invalidMsg('name')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="sup-email" className={fieldLabel}>
                    {t('partners.suppliers.form.email')}
                  </label>
                  <input
                    id="sup-email"
                    type="email"
                    className={`${input} ${isInvalid('email') ? controlError : ''}`}
                    value={c.state.email}
                    onChange={(e) => {
                      c.setField('email', e.target.value)
                    }}
                  />
                  {invalidMsg('email') !== null ? (
                    <span className={fieldError}>{invalidMsg('email')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="sup-cnpj" className={fieldLabel}>
                    {t('partners.suppliers.form.cnpj')}
                  </label>
                  <input
                    id="sup-cnpj"
                    className={`${input} ${isInvalid('cnpj') ? controlError : ''}`}
                    value={formatMask('cnpj', c.state.cnpj)}
                    disabled={props.cnpjDisabled}
                    onChange={(e) => {
                      c.setField('cnpj', unmask(e.target.value, 'cnpj'))
                    }}
                  />
                  {invalidMsg('cnpj') !== null ? (
                    <span className={fieldError}>{invalidMsg('cnpj')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="sup-corp" className={fieldLabel}>
                    {t('partners.suppliers.form.corporateName')}
                  </label>
                  <input
                    id="sup-corp"
                    className={`${input} ${isInvalid('corporateName') ? controlError : ''}`}
                    value={c.state.corporateName}
                    onChange={(e) => {
                      c.setField('corporateName', e.target.value)
                    }}
                  />
                  {invalidMsg('corporateName') !== null ? (
                    <span className={fieldError}>{invalidMsg('corporateName')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="sup-fant" className={fieldLabel}>
                    {t('partners.suppliers.form.fantasyName')}
                  </label>
                  <input
                    id="sup-fant"
                    className={`${input} ${isInvalid('fantasyName') ? controlError : ''}`}
                    value={c.state.fantasyName}
                    onChange={(e) => {
                      c.setField('fantasyName', e.target.value)
                    }}
                  />
                  {invalidMsg('fantasyName') !== null ? (
                    <span className={fieldError}>{invalidMsg('fantasyName')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="sup-cat" className={fieldLabel}>
                    {t('partners.suppliers.form.category')}
                  </label>
                  <SelectControl
                    id="sup-cat"
                    value={c.state.serviceCategory}
                    invalid={isInvalid('serviceCategory')}
                    onChange={(e) => {
                      c.setField('serviceCategory', e.target.value)
                    }}
                  >
                    <option value="">{t('partners.suppliers.form.select')}</option>
                    {props.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </SelectControl>
                  {invalidMsg('serviceCategory') !== null ? (
                    <span className={fieldError}>{invalidMsg('serviceCategory')}</span>
                  ) : null}
                </div>

                {/* Avaliação de serviço + comentário (§1.6) — habilitados: o core-api aceita/retorna os 2
                    campos (#32). Opcionais: "Sem avaliação" = null. */}
                <div className={field}>
                  <label htmlFor="sup-rating" className={fieldLabel}>
                    {t('partners.suppliers.form.serviceRating')}
                  </label>
                  <SelectControl
                    id="sup-rating"
                    value={c.state.serviceRating}
                    ariaLabel={t('partners.suppliers.form.serviceRating')}
                    onChange={(e) => {
                      c.setField('serviceRating', isServiceRating(e.target.value) ? e.target.value : '')
                    }}
                  >
                    <option value="">{t('partners.suppliers.rating.none')}</option>
                    {SERVICE_RATINGS.map((r) => (
                      <option key={r} value={r}>
                        {t(`partners.suppliers.rating.${r}`)}
                      </option>
                    ))}
                  </SelectControl>
                </div>

                <div className={field}>
                  <label htmlFor="sup-rating-comment" className={fieldLabel}>
                    {t('partners.suppliers.form.ratingComment')}
                  </label>
                  <input
                    id="sup-rating-comment"
                    className={input}
                    value={c.state.ratingComment}
                    onChange={(e) => {
                      c.setField('ratingComment', e.target.value)
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {props.canEditSensitive ? (
            <section className={sectionCard}>
              <div className={sectionHeader}>
                <span className={sectionIcon}>
                  <WalletIcon size={17} />
                </span>
                <h2 className={sectionH2}>{t('partners.suppliers.form.section.payment')}</h2>
              </div>
              <div className={sectionBody}>
                <div className={grid}>
                  <div className={field}>
                    <label htmlFor="sup-bank" className={fieldLabel}>
                      {t('partners.suppliers.form.bank')}
                    </label>
                    <BankSelect
                      id="sup-bank"
                      value={c.state.bank}
                      labels={BANK_LABELS}
                      invalid={isInvalid('bankAccount.bank')}
                      ariaLabel={t('partners.suppliers.form.bank')}
                      onChange={(code) => {
                        c.setField('bank', code)
                      }}
                    />
                    {invalidMsg('bankAccount.bank') !== null ? (
                      <span className={fieldError}>{invalidMsg('bankAccount.bank')}</span>
                    ) : isUnknownBank(c.state.bank) ? (
                      <span className={fieldError}>{t('partners.suppliers.form.bankUnknownHint')}</span>
                    ) : null}
                  </div>

                  <div className={field}>
                    <label htmlFor="sup-agency" className={fieldLabel}>
                      {t('partners.suppliers.form.agency')}
                    </label>
                    <input
                      id="sup-agency"
                      inputMode="numeric"
                      className={`${input} ${isInvalid('bankAccount.agency') ? controlError : ''}`}
                      value={formatMask('agency', c.state.agency)}
                      onChange={(e) => {
                        c.setField('agency', unmask(e.target.value, 'agency'))
                      }}
                    />
                    {invalidMsg('bankAccount.agency') !== null ? (
                      <span className={fieldError}>{invalidMsg('bankAccount.agency')}</span>
                    ) : null}
                  </div>

                  <div className={field}>
                    <label htmlFor="sup-acc" className={fieldLabel}>
                      {t('partners.suppliers.form.accountNumber')}
                    </label>
                    <input
                      id="sup-acc"
                      className={`${input} ${isInvalid('bankAccount.accountNumber') ? controlError : ''}`}
                      value={c.state.accountNumber}
                      onChange={(e) => {
                        c.setField('accountNumber', e.target.value)
                      }}
                    />
                    {invalidMsg('bankAccount.accountNumber') !== null ? (
                      <span className={fieldError}>{invalidMsg('bankAccount.accountNumber')}</span>
                    ) : null}
                  </div>

                  <div className={field}>
                    <label htmlFor="sup-dv" className={fieldLabel}>
                      {t('partners.suppliers.form.checkDigit')}
                    </label>
                    <input
                      id="sup-dv"
                      className={`${input} ${isInvalid('bankAccount.checkDigit') ? controlError : ''}`}
                      value={c.state.checkDigit}
                      onChange={(e) => {
                        c.setField('checkDigit', e.target.value)
                      }}
                    />
                    {invalidMsg('bankAccount.checkDigit') !== null ? (
                      <span className={fieldError}>{invalidMsg('bankAccount.checkDigit')}</span>
                    ) : null}
                  </div>

                  <div className={field}>
                    <label htmlFor="sup-pix-type" className={fieldLabel}>
                      {t('partners.suppliers.form.pixType')}
                    </label>
                    <SelectControl
                      id="sup-pix-type"
                      value={c.state.pixKeyType}
                      invalid={isInvalid('pixKey.keyType')}
                      ariaLabel={t('partners.suppliers.form.pixType')}
                      onChange={(e) => {
                        if (isPixKeyType(e.target.value)) {
                          c.setField('pixKeyType', e.target.value)
                          // Auto-preenche a chave com o dado correspondente do form (editável).
                          c.setField(
                            'pixKey',
                            derivePixKey(e.target.value, { document: c.state.cnpj, email: c.state.email }),
                          )
                        }
                      }}
                    >
                      {PIX_KEY_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {t(`partners.suppliers.pix.${pt}`)}
                        </option>
                      ))}
                    </SelectControl>
                  </div>

                  <div className={field}>
                    <label htmlFor="sup-pix-key" className={fieldLabel}>
                      {t('partners.suppliers.form.pixKey')}
                    </label>
                    <input
                      id="sup-pix-key"
                      className={`${input} ${isInvalid('pixKey.key') ? controlError : ''}`}
                      value={c.state.pixKey}
                      onChange={(e) => {
                        c.setField('pixKey', e.target.value)
                      }}
                    />
                    {invalidMsg('pixKey.key') !== null ? (
                      <span className={fieldError}>{invalidMsg('pixKey.key')}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* Barra de ações fixa */}
      <div className={actionbar}>
        <div className={actionbarInner}>
          <button type="button" className={btnGhost} onClick={props.onCancel}>
            {t('partners.suppliers.form.cancel')}
          </button>
          <button type="submit" className={btnPrimary} disabled={props.running}>
            {props.running ? t('partners.suppliers.form.saving') : t('partners.suppliers.form.save')}
          </button>
        </div>
      </div>
    </form>
  )
}
