import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Checkbox, formatMask, unmask } from '#shared/ui/index.ts'
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  FileTextIcon,
  HeartHandshakeIcon,
  WalletIcon,
} from '#shared/ui/icons/index.ts'
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
  colSpanFull,
  field,
  fieldLabel,
  control,
  input,
  select,
  chevron,
  controlError,
  fieldError,
  hint,
  actionbar,
  actionbarInner,
  btnPrimary,
  btnGhost,
} from '#shared/ui/brand/brand-form.css.ts'

import {
  OCCUPATION_AREAS,
  PIX_KEY_TYPES,
  isPixKeyType,
  type ActFormController,
} from './act-form.controller.ts'
import { derivePixKey } from '#modules/partners/client/domain/derive-pix-key.ts'
import { errorBanner } from './act-form.css.ts'

const t = createTranslator(ptBR)

export type ActFormProps = Readonly<{
  controller: ActFormController
  running: boolean
  errorTag: string | null
  onCancel: () => void
  onBack: () => void
  /** Título do cabeçalho; default = "Novo ACT". A edição passa "Editar ACT". */
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

/**
 * Formulário do Acordo de Cooperação Técnica (instituição/CNPJ). Identidade "brand" de formulário
 * (`brand-form.css.ts`) — mesma das telas de Colaborador. 3 seções: identificação do instrumento, dados
 * da instituição e repasse financeiro. O toggle `hasFinancialTransfer` revela conta bancária + PIX (exige
 * ao menos um). View burra; sem literais.
 */
export function ActForm(props: ActFormProps): ReactNode {
  const { controller: c } = props
  const isInvalid = (key: string): boolean => c.errors[key] === true
  const invalidMsg = (key: string): string | null =>
    c.errors[key] === true ? t('partners.acts.form.invalid') : null

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
            <button type="button" className={backBtn} onClick={props.onBack} aria-label={t('common.back')}>
              <ChevronLeftIcon size={18} />
            </button>
            <h1 className={headTitle}>{props.title ?? t('partners.acts.create.title')}</h1>
          </div>

          {props.errorTag !== null ? (
            <div className={errorBanner} role="alert">
              {t(props.errorTag)}
            </div>
          ) : null}

          {/* Seção 1 — Identificação do Instrumento */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <FileTextIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.acts.form.section.instrument')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                <div className={field}>
                  <label htmlFor="act-number" className={fieldLabel}>
                    {t('partners.acts.form.actNumber')}
                  </label>
                  <input
                    id="act-number"
                    className={`${input} ${isInvalid('actNumber') ? controlError : ''}`}
                    value={c.state.actNumber}
                    onChange={(e) => {
                      c.setField('actNumber', e.target.value)
                    }}
                  />
                  {invalidMsg('actNumber') !== null ? (
                    <span className={fieldError}>{invalidMsg('actNumber')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="act-name" className={fieldLabel}>
                    {t('partners.acts.form.name')}
                  </label>
                  <input
                    id="act-name"
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
                  <label htmlFor="act-area" className={fieldLabel}>
                    {t('partners.acts.form.occupationArea')}
                  </label>
                  <SelectControl
                    id="act-area"
                    value={c.state.occupationArea}
                    ariaLabel={t('partners.acts.form.occupationArea')}
                    invalid={isInvalid('occupationArea')}
                    onChange={(e) => {
                      c.setField('occupationArea', e.target.value)
                    }}
                  >
                    <option value="">{t('partners.acts.form.select')}</option>
                    {OCCUPATION_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {t(`partners.acts.area.${a}`)}
                      </option>
                    ))}
                  </SelectControl>
                  {invalidMsg('occupationArea') !== null ? (
                    <span className={fieldError}>{invalidMsg('occupationArea')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="act-start" className={fieldLabel}>
                    {t('partners.acts.form.startDate')}
                  </label>
                  <input
                    id="act-start"
                    type="date"
                    className={`${input} ${isInvalid('startDate') ? controlError : ''}`}
                    value={c.state.startDate}
                    onChange={(e) => {
                      c.setField('startDate', e.target.value)
                    }}
                  />
                  {invalidMsg('startDate') !== null ? (
                    <span className={fieldError}>{invalidMsg('startDate')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="act-end" className={fieldLabel}>
                    {t('partners.acts.form.endDate')}
                  </label>
                  <input
                    id="act-end"
                    type="date"
                    className={`${input} ${isInvalid('endDate') ? controlError : ''}`}
                    value={c.state.endDate}
                    onChange={(e) => {
                      c.setField('endDate', e.target.value)
                    }}
                  />
                  {invalidMsg('endDate') !== null ? (
                    <span className={fieldError}>{invalidMsg('endDate')}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2 — Dados da Instituição Parceira */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <HeartHandshakeIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.acts.form.section.institution')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                <div className={field}>
                  <label htmlFor="act-cnpj" className={fieldLabel}>
                    {t('partners.acts.form.cnpj')}
                  </label>
                  <input
                    id="act-cnpj"
                    inputMode="numeric"
                    className={`${input} ${isInvalid('cnpj') ? controlError : ''}`}
                    value={formatMask('cnpj', c.state.cnpj)}
                    onChange={(e) => {
                      c.setField('cnpj', unmask(e.target.value, 'cnpj'))
                    }}
                  />
                  {invalidMsg('cnpj') !== null ? (
                    <span className={fieldError}>{invalidMsg('cnpj')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="act-corp" className={fieldLabel}>
                    {t('partners.acts.form.corporateName')}
                  </label>
                  <input
                    id="act-corp"
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
                  <label htmlFor="act-fantasy" className={fieldLabel}>
                    {t('partners.acts.form.fantasyName')}
                  </label>
                  <input
                    id="act-fantasy"
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
                  <label htmlFor="act-rep" className={fieldLabel}>
                    {t('partners.acts.form.legalRepresentative')}
                  </label>
                  <input
                    id="act-rep"
                    className={`${input} ${isInvalid('legalRepresentative') ? controlError : ''}`}
                    value={c.state.legalRepresentative}
                    onChange={(e) => {
                      c.setField('legalRepresentative', e.target.value)
                    }}
                  />
                  {invalidMsg('legalRepresentative') !== null ? (
                    <span className={fieldError}>{invalidMsg('legalRepresentative')}</span>
                  ) : null}
                </div>

                <div className={field}>
                  <label htmlFor="act-email" className={fieldLabel}>
                    {t('partners.acts.form.email')}
                  </label>
                  <input
                    id="act-email"
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
              </div>
            </div>
          </section>

          {/* Seção 3 — Repasse Financeiro (toggle revela conta/PIX) */}
          <section className={sectionCard}>
            <div className={sectionHeader}>
              <span className={sectionIcon}>
                <WalletIcon size={17} />
              </span>
              <h2 className={sectionH2}>{t('partners.acts.form.section.payment')}</h2>
            </div>
            <div className={sectionBody}>
              <div className={grid}>
                <div className={`${field} ${colSpanFull}`}>
                  <label htmlFor="act-transfer" className={fieldLabel}>
                    {t('partners.acts.form.hasFinancialTransfer')}
                  </label>
                  <Checkbox
                    id="act-transfer"
                    checked={c.state.hasFinancialTransfer}
                    onChange={(v) => {
                      c.setField('hasFinancialTransfer', v)
                    }}
                  />
                  {invalidMsg('hasFinancialTransfer') !== null ? (
                    <span className={fieldError}>{invalidMsg('hasFinancialTransfer')}</span>
                  ) : null}
                </div>

                {c.state.hasFinancialTransfer ? (
                  <>
                    <span className={`${hint} ${colSpanFull}`}>{t('partners.acts.form.financialHint')}</span>

                    <div className={field}>
                      <label htmlFor="act-bank" className={fieldLabel}>
                        {t('partners.acts.form.bank')}
                      </label>
                      <input
                        id="act-bank"
                        className={`${input} ${isInvalid('bankAccount.bank') ? controlError : ''}`}
                        value={c.state.bank}
                        onChange={(e) => {
                          c.setField('bank', e.target.value)
                        }}
                      />
                      {invalidMsg('bankAccount.bank') !== null ? (
                        <span className={fieldError}>{invalidMsg('bankAccount.bank')}</span>
                      ) : null}
                    </div>

                    <div className={field}>
                      <label htmlFor="act-agency" className={fieldLabel}>
                        {t('partners.acts.form.agency')}
                      </label>
                      <input
                        id="act-agency"
                        className={`${input} ${isInvalid('bankAccount.agency') ? controlError : ''}`}
                        value={c.state.agency}
                        onChange={(e) => {
                          c.setField('agency', e.target.value)
                        }}
                      />
                      {invalidMsg('bankAccount.agency') !== null ? (
                        <span className={fieldError}>{invalidMsg('bankAccount.agency')}</span>
                      ) : null}
                    </div>

                    <div className={field}>
                      <label htmlFor="act-account" className={fieldLabel}>
                        {t('partners.acts.form.accountNumber')}
                      </label>
                      <input
                        id="act-account"
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
                      <label htmlFor="act-dv" className={fieldLabel}>
                        {t('partners.acts.form.checkDigit')}
                      </label>
                      <input
                        id="act-dv"
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
                      <label htmlFor="act-pix-type" className={fieldLabel}>
                        {t('partners.acts.form.pixType')}
                      </label>
                      <SelectControl
                        id="act-pix-type"
                        value={c.state.pixKeyType}
                        ariaLabel={t('partners.acts.form.pixType')}
                        invalid={isInvalid('pixKey.keyType')}
                        onChange={(e) => {
                          if (isPixKeyType(e.target.value)) {
                            c.setField('pixKeyType', e.target.value)
                            c.setField(
                              'pixKey',
                              derivePixKey(e.target.value, { document: c.state.cnpj, email: c.state.email }),
                            )
                          }
                        }}
                      >
                        {PIX_KEY_TYPES.map((pt) => (
                          <option key={pt} value={pt}>
                            {t(`partners.acts.pix.${pt}`)}
                          </option>
                        ))}
                      </SelectControl>
                      {invalidMsg('pixKey.keyType') !== null ? (
                        <span className={fieldError}>{invalidMsg('pixKey.keyType')}</span>
                      ) : null}
                    </div>

                    <div className={field}>
                      <label htmlFor="act-pix-key" className={fieldLabel}>
                        {t('partners.acts.form.pixKey')}
                      </label>
                      <input
                        id="act-pix-key"
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
                  </>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Barra de ações fixa */}
      <div className={actionbar}>
        <div className={actionbarInner}>
          <button type="button" className={btnGhost} onClick={props.onCancel}>
            {t('partners.acts.form.cancel')}
          </button>
          <button type="submit" className={btnPrimary} disabled={props.running}>
            {props.running ? t('partners.acts.form.saving') : t('partners.acts.form.save')}
          </button>
        </div>
      </div>
    </form>
  )
}
