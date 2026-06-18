/**
 * Form de Lançar Documento — view BURRA (§XI): props + JSX, sem hooks de dados/estado. Recebe os campos e
 * setters do controller por props. Seções FLAT do Figma 626-2 (S1 Identificação, S2 Retenções, S3
 * Pagamento, S4 Categorização). Bloco de retenções só aparece para NFS-e/RPA (gating).
 *
 * Reforma Tributária (CBS/IBS): campos VIVOS de registro de valor (OCR/manual) — enviados em
 * registeredTaxes[] do core-api; não geram filho nem abatem o líquido (regra FIN-DOCUMENTO-INGESTAO).
 *
 * Chrome (sem backend no v1, decisão #7): Competência/Emissão, "Pagar da Conta", cards Conta/Aprovador
 * e toda a Categorização são DESABILITADOS (sem dado fabricado) até os DTOs do core-api (#47/#48) e o
 * cadastro de contas/categorias existirem. A faixa âmbar de OCR do Figma é omitida de propósito —
 * sinalizaria preenchimento automático que não acontece sem o OCR.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { WalletIcon, UsersIcon } from '#shared/ui/index.ts'
import {
  retentionsEnabledFor,
  reformaTributariaEnabledFor,
  allowedRetentionKeysFor,
  maskMoney,
  REFORMA_TRIBUTARIA_KEYS,
  paymentComplementaryOf,
  paymentMethodNameTag,
  type DocumentType,
  type PaymentMethod,
  NO_LOCKS,
  type DocumentFormFields,
  type RetentionFieldsReais,
  type ReformaTributariaFieldsReais,
  type PartnerHydration,
  type FieldLocks,
} from '../document-form.view.ts'
import { DocumentTypeModal } from './document-type-modal.component.tsx'
import { PaymentMethodModal } from './payment-method-modal.component.tsx'
import {
  control,
  controlMono,
  controlDisabled,
  selectWrap,
  selectControlDisabled,
  field,
  fieldGrid,
  fieldLabel,
  numberSeriesRow,
  retentionsHint,
  reformaHead,
  reformaTitle,
  typeTrigger,
  typeTriggerPlaceholder,
  section,
  sectionTitle,
  sectionHead,
  sectionHeadTitle,
  contratoPill,
  contratoLabel,
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
  onReformaTributaria: (key: keyof ReformaTributariaFieldsReais, value: string) => void
  // Modal "Tipo de Documento" (o campo Tipo abre o modal; selecionar aplica o tipo).
  typeModalOpen: boolean
  onOpenTypeModal: () => void
  onSelectType: (type: DocumentType) => void
  onCloseTypeModal: () => void
  // Modal "Forma de Pagamento" (o campo Forma abre o modal; a forma controla os campos complementares).
  payModalOpen: boolean
  onOpenPayModal: () => void
  onSelectPayment: (method: PaymentMethod) => void
  onClosePayModal: () => void
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
            {/* Tipo abre o modal de seleção (cards com classe fiscal). Travado (edição) → caixa inerte. */}
            {locks.type ? (
              <input
                id="fin-type"
                className={controlDisabled}
                disabled
                value={fields.type === '' ? '—' : fields.type}
                aria-label={t('financial.create.field.type')}
              />
            ) : (
              <button
                id="fin-type"
                type="button"
                className={typeTrigger}
                aria-label={t('financial.create.field.type')}
                onClick={props.onOpenTypeModal}
              >
                {fields.type === '' ? (
                  <span className={typeTriggerPlaceholder}>{t('financial.create.select')}</span>
                ) : (
                  <span>{fields.type}</span>
                )}
              </button>
            )}
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
              placeholder="0,00"
              value={fields.grossValue}
              onChange={(e) => {
                props.onText('grossValue', maskMoney(e.target.value))
              }}
            />
          </div>
        </div>
        {/* Chave de acesso — só DANFE. Chrome honesto: o create do core-api ainda não aceita o campo
            (core-api#115) → desabilitado, não enviado. */}
        {fields.type === 'DANFE' ? (
          <div className={fieldGrid.wide}>
            <div className={field}>
              <label className={fieldLabel} htmlFor="fin-chave">
                {t('financial.create.field.accessKey')}
              </label>
              <input
                id="fin-chave"
                className={controlDisabled}
                disabled
                inputMode="numeric"
                placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                aria-label={t('financial.create.field.accessKey')}
              />
              <span className={retentionsHint}>{t('financial.create.accessKey.hint')}</span>
            </div>
          </div>
        ) : null}
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

      {/* ── S2 Retenções + Reforma Tributária — só tipos que DISPARAM o motor fiscal (NFS-e/RPA). Tipos
          não-fiscais (Boleto/Recibo/Fatura/Guia) e DANFE — que é fiscal mas NÃO dispara o motor no regime
          tributário do cliente — OCULTAM a seção inteira (sobram Identificação/Pagamento/Categorização). ── */}
      {retEnabled ? (
        <section className={section}>
          <h3 className={sectionTitle}>{t('financial.create.section.retencoes')}</h3>
          <div className={fieldGrid.six}>
            {allowedRetentionKeysFor(fields.type).map((key) => (
              <div className={field} key={key}>
                <label className={fieldLabel} htmlFor={`fin-ret-${key}`}>
                  {t(`financial.create.retention.${key}`)}
                </label>
                <input
                  id={`fin-ret-${key}`}
                  className={locks.retentions ? controlDisabled : controlMono}
                  disabled={locks.retentions}
                  inputMode="decimal"
                  placeholder="0,00"
                  value={fields.retentions[key]}
                  onChange={(e) => {
                    props.onRetention(key, maskMoney(e.target.value))
                  }}
                />
              </div>
            ))}
          </div>
          {/* Reforma Tributária (CBS/IBS) — registro de valor apenas (OCR/manual): não gera filho nem
              retenção e não abate o líquido. Enviado em registeredTaxes[] (core-api). */}
          {reformaTributariaEnabledFor(fields.type) ? (
            <>
              <div className={reformaHead}>
                <span className={reformaTitle}>{t('financial.create.reformaTributaria.label')}</span>
                <span className={retentionsHint}>{t('financial.create.reformaTributaria.hint')}</span>
              </div>
              <div className={fieldGrid.three}>
                {REFORMA_TRIBUTARIA_KEYS.map((key) => (
                  <div className={field} key={key}>
                    <label className={fieldLabel} htmlFor={`fin-rt-${key}`}>
                      {t(`financial.create.retention.${key}`)}
                    </label>
                    <input
                      id={`fin-rt-${key}`}
                      className={locks.retentions ? controlDisabled : controlMono}
                      disabled={locks.retentions}
                      inputMode="decimal"
                      placeholder="0,00"
                      value={fields.reformaTributaria[key]}
                      onChange={(e) => {
                        props.onReformaTributaria(key, maskMoney(e.target.value))
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {/* ── S3 Pagamento ── */}
      <section className={section}>
        <h3 className={sectionTitle}>{t('financial.create.section.pagamento')}</h3>
        {/* Forma (real) + Pagar da Conta (chrome). O fornecedor é escolhido no hero (picker). */}
        <div className={fieldGrid.two}>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-forma">
              {t('financial.create.field.paymentMethod')}
            </label>
            {/* Forma abre o modal (cards); a forma escolhida controla os campos complementares abaixo. */}
            {locks.paymentMethod ? (
              <input
                id="fin-forma"
                className={controlDisabled}
                disabled
                value={fields.paymentMethod === '' ? '—' : t(paymentMethodNameTag(fields.paymentMethod))}
                aria-label={t('financial.create.field.paymentMethod')}
              />
            ) : (
              <button
                id="fin-forma"
                type="button"
                className={typeTrigger}
                aria-label={t('financial.create.field.paymentMethod')}
                onClick={props.onOpenPayModal}
              >
                {fields.paymentMethod === '' ? (
                  <span className={typeTriggerPlaceholder}>{t('financial.create.select')}</span>
                ) : (
                  <span>{t(paymentMethodNameTag(fields.paymentMethod))}</span>
                )}
              </button>
            )}
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
        {/* Campo complementar controlado pela forma (mock): boleto → linha digitável; cartão → cartão
            corporativo. Chrome honesto: o create do core-api não aceita esses campos (core-api#89). */}
        {paymentComplementaryOf(fields.paymentMethod) === 'boleto' ? (
          <div className={fieldGrid.wide}>
            <div className={field}>
              <label className={fieldLabel} htmlFor="fin-boleto">
                {t('financial.create.payMethod.boletoLabel')}
              </label>
              <input
                id="fin-boleto"
                className={controlDisabled}
                disabled
                inputMode="numeric"
                placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
                aria-label={t('financial.create.payMethod.boletoLabel')}
              />
              <span className={retentionsHint}>{t('financial.create.payMethod.boletoHint')}</span>
            </div>
          </div>
        ) : null}
        {paymentComplementaryOf(fields.paymentMethod) === 'card' ? (
          <div className={fieldGrid.wide}>
            <div className={field}>
              <label className={fieldLabel} htmlFor="fin-card">
                {t('financial.create.payMethod.cardLabel')}
              </label>
              <input
                id="fin-card"
                className={controlDisabled}
                disabled
                placeholder="•••• •••• •••• ••••"
                aria-label={t('financial.create.payMethod.cardLabel')}
              />
              <span className={retentionsHint}>{t('financial.create.payMethod.cardHint')}</span>
            </div>
          </div>
        ) : null}
        {paymentComplementaryOf(fields.paymentMethod) === 'currency' ? (
          <div className={fieldGrid.wide}>
            <div className={field}>
              <label className={fieldLabel} htmlFor="fin-currency">
                {t('financial.create.payMethod.currencyLabel')}
              </label>
              <input
                id="fin-currency"
                className={controlDisabled}
                disabled
                placeholder="USD · 5,00 · R$ 0,00"
                aria-label={t('financial.create.payMethod.currencyLabel')}
              />
              <span className={retentionsHint}>{t('financial.create.payMethod.currencyHint')}</span>
            </div>
          </div>
        ) : null}
        {paymentComplementaryOf(fields.paymentMethod) === 'free' ? (
          <div className={fieldGrid.wide}>
            <div className={field}>
              <label className={fieldLabel} htmlFor="fin-free">
                {t('financial.create.payMethod.freeLabel')}
              </label>
              <input
                id="fin-free"
                className={controlDisabled}
                disabled
                aria-label={t('financial.create.payMethod.freeLabel')}
              />
              <span className={retentionsHint}>{t('financial.create.payMethod.freeHint')}</span>
            </div>
          </div>
        ) : null}
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
                <span className={contratoLabel}>{t('financial.create.categorizacao.contrato')}</span>{' '}
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

      <DocumentTypeModal
        open={props.typeModalOpen}
        selected={fields.type}
        onSelect={props.onSelectType}
        onClose={props.onCloseTypeModal}
      />
      <PaymentMethodModal
        open={props.payModalOpen}
        selected={fields.paymentMethod}
        onSelect={props.onSelectPayment}
        onClose={props.onClosePayModal}
      />
    </>
  )
}
