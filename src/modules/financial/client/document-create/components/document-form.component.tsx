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
  NO_LOCKS,
  type DocumentFormFields,
  type RetentionFieldsReais,
  type PartnerHydration,
  type FieldLocks,
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
  contratoNum,
  contratoStatus,
  contratoDot,
  entityCard,
  entityIcon,
  entityInfo,
  entityLabel,
  entityValue,
  entityValueStrong,
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

/**
 * Card de entidade (Conta do fornecedor / Aprovador). Com `value` (dado real, ex.: banco do fornecedor)
 * mostra o valor em destaque; sem ele, o hint discreto (chrome).
 */
function EntityCard(
  props: Readonly<{ label: string; hint: string; value?: string; icon: ReactNode }>,
): ReactNode {
  const hasValue = props.value !== undefined && props.value !== ''
  return (
    <div className={entityCard}>
      <span className={entityIcon} aria-hidden="true">
        {props.icon}
      </span>
      <span className={entityInfo}>
        <span className={entityLabel}>{props.label}</span>
        <span className={hasValue ? entityValueStrong : entityValue}>
          {hasValue ? props.value : props.hint}
        </span>
      </span>
    </div>
  )
}

/** Campo somente-leitura preenchido a partir do contrato (Categorização derivada). */
function ReadonlyField({ label, value }: Readonly<{ label: string; value: string }>): ReactNode {
  return (
    <div className={field}>
      <span className={fieldLabel}>{label}</span>
      <input className={controlDisabled} disabled value={value === '' ? '—' : value} aria-label={label} />
    </div>
  )
}

export type DocumentFormProps = Readonly<{
  fields: DocumentFormFields
  hydration: PartnerHydration
  /** Travas por campo (modo edição). Ausente/criação = nada travado. */
  locks?: FieldLocks
  onType: (value: DocumentType | '') => void
  onPaymentMethod: (value: PaymentMethod | '') => void
  onText: (key: 'documentNumber' | 'series' | 'grossValue' | 'dueDate' | 'description', value: string) => void
  onRetention: (key: keyof RetentionFieldsReais, value: string) => void
}>

export function DocumentForm(props: DocumentFormProps): ReactNode {
  const { fields, hydration } = props
  const locks = props.locks ?? NO_LOCKS
  const retEnabled = retentionsEnabledFor(fields.type)
  const bank = hydration.bank
  const contract = hydration.contract
  const bankLine =
    bank !== null ? [bank.line, bank.pix].filter((s) => s !== null && s !== '').join(' · ') : ''

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
                className={locks.type ? selectControlDisabled : selectControl}
                disabled={locks.type}
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
                className={locks.numberSeries ? controlDisabled : control}
                disabled={locks.numberSeries}
                aria-label={t('financial.create.field.documentNumber')}
                value={fields.documentNumber}
                onChange={(e) => {
                  props.onText('documentNumber', e.target.value)
                }}
              />
              <input
                className={locks.numberSeries ? controlDisabled : control}
                disabled={locks.numberSeries}
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
              className={locks.dueDate ? controlDisabled : control}
              disabled={locks.dueDate}
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
              className={locks.grossValue ? controlDisabled : controlMono}
              disabled={locks.grossValue}
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
              className={locks.description ? controlDisabled : control}
              disabled={locks.description}
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
                    className={locks.retentions ? controlDisabled : controlMono}
                    disabled={locks.retentions}
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
        {/* Forma (real) + Pagar da Conta (chrome). O fornecedor é escolhido no hero (picker). */}
        <div className={fieldGrid.two}>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-forma">
              {t('financial.create.field.paymentMethod')}
            </label>
            <div className={selectWrap}>
              <select
                id="fin-forma"
                className={locks.paymentMethod ? selectControlDisabled : selectControl}
                disabled={locks.paymentMethod}
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
          <ChromeSelect label={t('financial.create.field.payFromAccount')} />
        </div>
        <div className={fieldGrid.two}>
          <EntityCard
            label={t('financial.create.pagamento.contaFornecedor')}
            hint={t('financial.create.pagamento.contaFornecedorHint')}
            value={bankLine}
            icon={<WalletIcon size={16} />}
          />
          <EntityCard
            label={t('financial.create.pagamento.aprovador')}
            hint={t('financial.create.pagamento.aprovadorHint')}
            icon={<UsersIcon size={16} />}
          />
        </div>
      </section>

      {/* ── S4 Categorização — auto-preenchida do contrato "Em Andamento" (quando houver) ── */}
      <section className={section}>
        <div className={sectionHead}>
          <h3 className={`${sectionTitle} ${sectionHeadTitle}`}>
            {t('financial.create.section.categorizacao')}
          </h3>
          <span className={contratoPill}>
            {contract !== null ? (
              <>
                {t('financial.create.categorizacao.contrato')}{' '}
                <span className={contratoNum}>{contract.number}</span>
                <span className={contratoStatus}>
                  <span className={contratoDot} aria-hidden="true" />
                  {t('financial.create.categorizacao.emAndamento')}
                </span>
              </>
            ) : (
              <>
                {t('financial.create.categorizacao.semContrato')}
                <span className={contratoLink}>{t('financial.create.categorizacao.vincular')}</span>
              </>
            )}
          </span>
        </div>
        {contract !== null ? (
          <>
            <div className={fieldGrid.three}>
              <ReadonlyField label={t('financial.create.field.centroCusto')} value={contract.centroCusto} />
              <ReadonlyField label={t('financial.create.field.categoria')} value={contract.categoria} />
              <ReadonlyField label={t('financial.create.field.subcategoria')} value="" />
            </div>
            <div className={fieldGrid.two}>
              <ReadonlyField label={t('financial.create.field.programa')} value={contract.programa} />
              <ReadonlyField
                label={t('financial.create.field.planoOrcamentario')}
                value={contract.planoOrcamentario}
              />
            </div>
          </>
        ) : (
          <>
            <div className={fieldGrid.three}>
              <ChromeSelect label={t('financial.create.field.centroCusto')} />
              <ChromeSelect label={t('financial.create.field.categoria')} />
              <ChromeSelect label={t('financial.create.field.subcategoria')} />
            </div>
            <div className={fieldGrid.two}>
              <ChromeSelect label={t('financial.create.field.programa')} />
              <ChromeSelect label={t('financial.create.field.planoOrcamentario')} />
            </div>
          </>
        )}
      </section>
    </>
  )
}
