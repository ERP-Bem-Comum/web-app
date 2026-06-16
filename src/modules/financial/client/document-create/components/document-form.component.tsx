/**
 * Form de Lançar Documento — view BURRA (§XI): props + JSX, sem hooks de dados/estado. Recebe os campos e
 * setters do controller por props. Seções FLAT do Figma 626-2 (S1 Identificação, S2 Retenções, S3
 * Pagamento, S4 Categorização). Bloco de retenções só aparece para NFS-e/RPA (gating).
 *
 * Chrome (sem backend no v1, decisão #7): Competência/Emissão, linha CBS/IBS, "Pagar da Conta", cards
 * Conta/Aprovador e toda a Categorização são DESABILITADOS (sem dado fabricado) até os DTOs do core-api
 * (#47/#48) e o cadastro de contas/categorias existirem. A faixa âmbar de OCR do Figma é omitida de
 * propósito — sinalizaria preenchimento automático que não acontece sem o OCR.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { WalletIcon, UsersIcon } from '#shared/ui/index.ts'
import {
  retentionsEnabledFor,
  DOCUMENT_TYPES,
  PAYMENT_METHODS,
  RETENTION_KEYS,
  isDocumentType,
  isPaymentMethod,
  type DocumentType,
  type PaymentMethod,
  type DocumentFormFields,
  type RetentionFieldsReais,
  type SupplierOption,
} from '../document-form.view.ts'
import {
  control,
  controlMono,
  controlDisabled,
  selectWrap,
  selectControl,
  selectControlDisabled,
  field,
  fieldGrid,
  fieldLabel,
  numberSeriesRow,
  retentionsHint,
  section,
  sectionTitle,
  sectionHead,
  sectionHeadTitle,
  contratoPill,
  contratoLink,
  entityCard,
  entityIcon,
  entityInfo,
  entityLabel,
  entityValue,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

/** Campo chrome (desabilitado) — dropdown sem backend; mostra "Selecione…" e o caret nativo. */
function ChromeSelect({ label }: Readonly<{ label: string }>): ReactNode {
  return (
    <div className={field}>
      <span className={fieldLabel}>{label}</span>
      <div className={selectWrap}>
        <select className={selectControlDisabled} disabled aria-label={label}>
          <option>{t('financial.create.select')}</option>
        </select>
      </div>
    </div>
  )
}

/** Card de entidade chrome (Conta do fornecedor / Aprovador) — ícone + rótulo + hint (sem dado real). */
function EntityCard(props: Readonly<{ label: string; hint: string; icon: ReactNode }>): ReactNode {
  return (
    <div className={entityCard}>
      <span className={entityIcon} aria-hidden="true">
        {props.icon}
      </span>
      <span className={entityInfo}>
        <span className={entityLabel}>{props.label}</span>
        <span className={entityValue}>{props.hint}</span>
      </span>
    </div>
  )
}

export type DocumentFormProps = Readonly<{
  fields: DocumentFormFields
  suppliers: readonly SupplierOption[]
  onType: (value: DocumentType | '') => void
  onPaymentMethod: (value: PaymentMethod | '') => void
  onSupplier: (ref: string) => void
  onText: (key: 'documentNumber' | 'series' | 'grossValue' | 'dueDate' | 'description', value: string) => void
  onRetention: (key: keyof RetentionFieldsReais, value: string) => void
}>

export function DocumentForm(props: DocumentFormProps): ReactNode {
  const { fields } = props
  const retEnabled = retentionsEnabledFor(fields.type)

  return (
    <>
      {/* ── S1 Identificação ── */}
      <section className={section}>
        <h3 className={sectionTitle}>{t('financial.create.section.identificacao')}</h3>
        <div className={fieldGrid.six}>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-type">
              {t('financial.create.field.type')}
            </label>
            <div className={selectWrap}>
              <select
                id="fin-type"
                className={selectControl}
                value={fields.type}
                onChange={(e) => {
                  props.onType(isDocumentType(e.target.value) ? e.target.value : '')
                }}
              >
                <option value="">{t('financial.create.select')}</option>
                {DOCUMENT_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nº / Série — célula combinada (Figma), dois inputs sob um rótulo. */}
          <div className={field}>
            <span className={fieldLabel}>{t('financial.create.field.numberSeries')}</span>
            <div className={numberSeriesRow}>
              <input
                className={control}
                aria-label={t('financial.create.field.documentNumber')}
                value={fields.documentNumber}
                onChange={(e) => {
                  props.onText('documentNumber', e.target.value)
                }}
              />
              <input
                className={control}
                aria-label={t('financial.create.field.series')}
                value={fields.series}
                onChange={(e) => {
                  props.onText('series', e.target.value)
                }}
              />
            </div>
          </div>

          {/* Competência / Emissão — chrome (sem campo no DTO de criação). */}
          <div className={field}>
            <span className={fieldLabel}>{t('financial.create.field.competencia')}</span>
            <input
              className={controlDisabled}
              disabled
              placeholder="MM/AAAA"
              aria-label={t('financial.create.field.competencia')}
            />
          </div>
          <div className={field}>
            <span className={fieldLabel}>{t('financial.create.field.emissao')}</span>
            <input
              className={controlDisabled}
              disabled
              placeholder="DD/MM/AAAA"
              aria-label={t('financial.create.field.emissao')}
            />
          </div>

          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-venc">
              {t('financial.create.field.dueDate')}
            </label>
            <input
              id="fin-venc"
              type="date"
              className={control}
              value={fields.dueDate}
              onChange={(e) => {
                props.onText('dueDate', e.target.value)
              }}
            />
          </div>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-bruto">
              {t('financial.create.field.grossValue')}
            </label>
            <input
              id="fin-bruto"
              className={controlMono}
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={fields.grossValue}
              onChange={(e) => {
                props.onText('grossValue', e.target.value)
              }}
            />
          </div>
        </div>
        <div className={fieldGrid.wide}>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-desc">
              {t('financial.create.field.description')}
            </label>
            <input
              id="fin-desc"
              className={control}
              value={fields.description}
              onChange={(e) => {
                props.onText('description', e.target.value)
              }}
            />
          </div>
        </div>
      </section>

      {/* ── S2 Retenções — só NFS-e/RPA ── */}
      <section className={section}>
        <h3 className={sectionTitle}>{t('financial.create.section.retencoes')}</h3>
        {retEnabled ? (
          <>
            <div className={fieldGrid.six}>
              {RETENTION_KEYS.map((key) => (
                <div className={field} key={key}>
                  <label className={fieldLabel} htmlFor={`fin-ret-${key}`}>
                    {t(`financial.create.retention.${key}`)}
                  </label>
                  <input
                    id={`fin-ret-${key}`}
                    className={controlMono}
                    inputMode="decimal"
                    placeholder="R$ 0,00"
                    value={fields.retentions[key]}
                    onChange={(e) => {
                      props.onRetention(key, e.target.value)
                    }}
                  />
                </div>
              ))}
            </div>
            {/* Reforma tributária (CBS/IBS) — chrome, ainda sem cálculo no core-api. */}
            <div className={fieldGrid.three}>
              {(['cbs', 'ibsMunicipal', 'ibsEstadual'] as const).map((key) => (
                <div className={field} key={key}>
                  <span className={fieldLabel}>{t(`financial.create.retention.${key}`)}</span>
                  <input
                    className={controlDisabled}
                    disabled
                    placeholder="R$ 0,00"
                    aria-label={t(`financial.create.retention.${key}`)}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className={retentionsHint}>{t('financial.create.retention.disabled')}</p>
        )}
      </section>

      {/* ── S3 Pagamento ── */}
      <section className={section}>
        <h3 className={sectionTitle}>{t('financial.create.section.pagamento')}</h3>
        <div className={fieldGrid.two}>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-forma">
              {t('financial.create.field.paymentMethod')}
            </label>
            <div className={selectWrap}>
              <select
                id="fin-forma"
                className={selectControl}
                value={fields.paymentMethod}
                onChange={(e) => {
                  props.onPaymentMethod(isPaymentMethod(e.target.value) ? e.target.value : '')
                }}
              >
                <option value="">{t('financial.create.select')}</option>
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {t(`financial.paymentMethod.${pm}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-forn">
              {t('financial.create.field.supplier')}
            </label>
            <div className={selectWrap}>
              <select
                id="fin-forn"
                className={selectControl}
                value={fields.supplierRef}
                onChange={(e) => {
                  props.onSupplier(e.target.value)
                }}
              >
                <option value="">{t('financial.create.select')}</option>
                {props.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className={fieldGrid.wide}>
          <ChromeSelect label={t('financial.create.field.payFromAccount')} />
        </div>
        <div className={fieldGrid.two}>
          <EntityCard
            label={t('financial.create.pagamento.contaFornecedor')}
            hint={t('financial.create.pagamento.contaFornecedorHint')}
            icon={<WalletIcon size={16} />}
          />
          <EntityCard
            label={t('financial.create.pagamento.aprovador')}
            hint={t('financial.create.pagamento.aprovadorHint')}
            icon={<UsersIcon size={16} />}
          />
        </div>
      </section>

      {/* ── S4 Categorização — chrome ── */}
      <section className={section}>
        <div className={sectionHead}>
          <h3 className={`${sectionTitle} ${sectionHeadTitle}`}>
            {t('financial.create.section.categorizacao')}
          </h3>
          <span className={contratoPill}>
            {t('financial.create.categorizacao.semContrato')}
            <span className={contratoLink}>{t('financial.create.categorizacao.vincular')}</span>
          </span>
        </div>
        <div className={fieldGrid.three}>
          <ChromeSelect label={t('financial.create.field.centroCusto')} />
          <ChromeSelect label={t('financial.create.field.categoria')} />
          <ChromeSelect label={t('financial.create.field.subcategoria')} />
        </div>
        <div className={fieldGrid.two}>
          <ChromeSelect label={t('financial.create.field.programa')} />
          <ChromeSelect label={t('financial.create.field.planoOrcamentario')} />
        </div>
      </section>
    </>
  )
}
