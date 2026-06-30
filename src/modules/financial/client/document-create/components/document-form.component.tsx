/**
 * Form de Lançar Documento — view BURRA (§XI): props + JSX, sem hooks de dados/estado. Recebe os campos e
 * setters do controller por props. Seções FLAT do Figma 626-2 (S1 Identificação, S2 Retenções, S3
 * Pagamento, S4 Categorização). Bloco de retenções só aparece para NFS-e/RPA (gating).
 *
 * Reforma Tributária (CBS/IBS): campos VIVOS de registro de valor (OCR/manual) — enviados em
 * registeredTaxes[] do core-api; não geram filho nem abatem o líquido (regra FIN-DOCUMENTO-INGESTAO).
 *
 * Chrome (sem backend no v1, decisão #7): o card Conta do favorecido segue DESABILITADO (sem dado
 * fabricado) até os DTOs do core-api (#47/#48) e o cadastro de contas/categorias existirem.
 * (Competência #197 e Emissão #163 já são reais.) A faixa âmbar de OCR do Figma é omitida de propósito —
 * sinalizaria preenchimento automático que não acontece sem o OCR.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { WalletIcon } from '#shared/ui/index.ts'
import {
  retentionsEnabledFor,
  reformaTributariaEnabledFor,
  allowedRetentionKeysFor,
  maskMoney,
  maskCompetencia,
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
  type ContractCategoView,
  type FieldLocks,
} from '../document-form.view.ts'
import { DocumentTypeModal } from './document-type-modal.component.tsx'
import { PaymentMethodModal } from './payment-method-modal.component.tsx'
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
  contratoPickerWrap,
  contratoMenu,
  contratoMenuItem,
  contratoMenuItemActive,
  contratoMenuLabel,
  contratoMenuNum,
  contratoMenuEmpty,
  pickerBackdrop,
  entityCard,
  entityIcon,
  entityInfo,
  entityLabel,
  entityValue,
  entityValueStrong,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

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

/**
 * Programa — dropdown EDITÁVEL (real): opções de `listProgramsFn`, valor = `programRef`. Herda o programa
 * do contrato por padrão, mas o usuário pode trocar; sem contrato, fica aberto. Envia `programRef` no create.
 */
function ProgramSelect(
  props: Readonly<{
    label: string
    value: string
    disabled: boolean
    options: readonly Readonly<{ id: string; name: string; sigla: string }>[]
    onChange: (value: string) => void
  }>,
): ReactNode {
  return (
    <div className={field}>
      <span className={fieldLabel}>{props.label}</span>
      <div className={selectWrap}>
        <select
          className={props.disabled ? selectControlDisabled : selectControl}
          disabled={props.disabled}
          aria-label={props.label}
          value={props.value}
          onChange={(e) => {
            props.onChange(e.target.value)
          }}
        >
          <option value="">{t('financial.create.select')}</option>
          {props.options.map((o) => (
            <option key={o.id} value={o.id}>
              {/* Exibe a SIGLA (padrão dos outros módulos, ex.: Contratos); cai p/ o nome se não houver. */}
              {o.sigla !== '' ? o.sigla : o.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

/**
 * Campo de Categorização como DROPDOWN: lista as opções que existirem (Centro de Custo/Categoria/
 * Subcategoria/Plano Orçamentário). ⚠️ Hoje sem fonte de dados (core-api#147) → dropdown vazio (só o
 * placeholder) até o backend expor as listas. Em edição/consulta (`disabled`) fica travado.
 */
function CategoSelect(
  props: Readonly<{
    label: string
    value: string
    disabled: boolean
    options: readonly Readonly<{ value: string; label: string }>[]
    onChange: (v: string) => void
  }>,
): ReactNode {
  return (
    <div className={field}>
      <span className={fieldLabel}>{props.label}</span>
      <div className={selectWrap}>
        <select
          className={props.disabled ? selectControlDisabled : selectControl}
          disabled={props.disabled}
          aria-label={props.label}
          value={props.value}
          onChange={(e) => {
            props.onChange(e.target.value)
          }}
        >
          <option value="">{t('financial.create.select')}</option>
          {props.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
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
  onText: (
    key:
      | 'documentNumber'
      | 'series'
      | 'grossValue'
      | 'issueDate'
      | 'competencia'
      | 'dueDate'
      | 'description'
      | 'accessKey'
      | 'paymentComplement'
      | 'centroCusto'
      | 'categoria'
      | 'subcategoria'
      | 'planoOrcamentario',
    value: string,
  ) => void
  onRetention: (key: keyof RetentionFieldsReais, value: string) => void
  onReformaTributaria: (key: keyof ReformaTributariaFieldsReais, value: string) => void
  // Programa (Categorização) — dropdown editável. Opções reais + valor efetivo (fields ?? contrato).
  programOptions: readonly Readonly<{ id: string; name: string; sigla: string }>[]
  programValue: string
  onProgram: (value: string) => void
  // Categoria (Categorização) — dropdown editável REAL (taxonomia #200). Envia `categoryRef` no create.
  categoryValue: string
  onCategory: (value: string) => void
  // Centro de custo (Categorização) — dropdown editável REAL (#147). Envia `costCenterRef` no create.
  costCenterValue: string
  onCostCenter: (value: string) => void
  // Aprovador (#148) — dropdown REAL (usuários com payable:approve). Envia `approverRef` no create.
  approverValue: string
  onApprover: (value: string) => void
  approverOptions: readonly Readonly<{ value: string; label: string }>[]
  // "Pagar da conta" (#197) — dropdown REAL: contas-cedente da Conciliação. Envia `contaDebitoRef`; a baixa
  // do título vai p/ essa conta.
  contaDebitoValue: string
  onContaDebito: (value: string) => void
  contaDebitoOptions: readonly Readonly<{ value: string; label: string }>[]
  // Opções dos dropdowns da Categorização (Centro de Custo/Categoria/Subcategoria/Plano). Vazias até o
  // backend expor as listas (core-api#147); o select já fica pronto.
  centroCustoOptions: readonly Readonly<{ value: string; label: string }>[]
  categoriaOptions: readonly Readonly<{ value: string; label: string }>[]
  subcategoriaOptions: readonly Readonly<{ value: string; label: string }>[]
  planoOptions: readonly Readonly<{ value: string; label: string }>[]
  // Contrato vinculado (Categorização) — selecionado + lista "Em Andamento" do parceiro + dropdown "Alterar".
  contract: ContractCategoView | null
  contracts: readonly ContractCategoView[]
  contractPickerOpen: boolean
  onToggleContractPicker: () => void
  onCloseContractPicker: () => void
  onSelectContract: (ref: string) => void
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
  const contract = props.contract
  // Categorização só-leitura em edição/consulta (mesma trava do fornecedor); editável em criação/rascunho.
  const catDisabled = locks.supplier
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

          {/* Competência (#197) — MM/AAAA; persistida no create (backend converte p/ YYYY-MM via VO). */}
          <div className={field}>
            <span className={fieldLabel}>{t('financial.create.field.competencia')}</span>
            <input
              className={locks.competencia ? controlDisabled : control}
              disabled={locks.competencia}
              inputMode="numeric"
              placeholder="MM/AAAA"
              value={fields.competencia}
              aria-label={t('financial.create.field.competencia')}
              onChange={(e) => {
                props.onText('competencia', maskCompetencia(e.target.value))
              }}
            />
          </div>
          <div className={field}>
            <label className={fieldLabel} htmlFor="fin-emissao">
              {t('financial.create.field.emissao')}
            </label>
            <input
              id="fin-emissao"
              type="date"
              className={locks.issueDate ? controlDisabled : control}
              disabled={locks.issueDate}
              value={fields.issueDate}
              aria-label={t('financial.create.field.emissao')}
              onChange={(e) => {
                props.onText('issueDate', e.target.value)
              }}
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
        {/* Chave de acesso — só DANFE. Editável (OCR ou manual). Enviada e persistida no create (#115);
            o backend EXIGE 44 dígitos na DANFE (o canSubmit trava o lançamento sem ela). */}
        {fields.type === 'DANFE' ? (
          <div className={fieldGrid.wide}>
            <div className={field}>
              <label className={fieldLabel} htmlFor="fin-chave">
                {t('financial.create.field.accessKey')}
              </label>
              <input
                id="fin-chave"
                className={control}
                inputMode="numeric"
                value={fields.accessKey}
                onChange={(e) => {
                  props.onText('accessKey', e.target.value)
                }}
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
          {/* "Pagar da conta" REAL (#197): contas-cedente da Conciliação. Envia contaDebitoRef → a baixa
              do título é direcionada a essa conta. */}
          <CategoSelect
            label={t('financial.create.field.payFromAccount')}
            disabled={catDisabled}
            value={props.contaDebitoValue}
            options={props.contaDebitoOptions}
            onChange={props.onContaDebito}
          />
        </div>
        <div className={fieldGrid.two}>
          <EntityCard
            label={t('financial.create.pagamento.contaFornecedor')}
            hint={t('financial.create.pagamento.contaFornecedorHint')}
            value={bankLine}
            icon={<WalletIcon size={16} />}
          />
          {/* Aprovador REAL (#148): usuários com payable:approve (GET /api/v1/approvers). Envia approverRef. */}
          <CategoSelect
            label={t('financial.create.pagamento.aprovador')}
            disabled={catDisabled}
            value={props.approverValue}
            options={props.approverOptions}
            onChange={props.onApprover}
          />
        </div>
        {/* Campo complementar controlado pela forma (boleto → linha digitável; cartão; câmbio; outro).
            Editável (OCR/manual). ⚠️ Persistência pendente no core-api#89 — não é enviado no create ainda. */}
        {paymentComplementaryOf(fields.paymentMethod) === 'boleto' ? (
          <div className={fieldGrid.wide}>
            <div className={field}>
              <label className={fieldLabel} htmlFor="fin-boleto">
                {t('financial.create.payMethod.boletoLabel')}
              </label>
              <input
                id="fin-boleto"
                className={control}
                inputMode="numeric"
                placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
                value={fields.paymentComplement}
                onChange={(e) => {
                  props.onText('paymentComplement', e.target.value)
                }}
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
                className={control}
                placeholder="•••• •••• •••• ••••"
                value={fields.paymentComplement}
                onChange={(e) => {
                  props.onText('paymentComplement', e.target.value)
                }}
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
                className={control}
                placeholder="USD · 5,00 · R$ 0,00"
                value={fields.paymentComplement}
                onChange={(e) => {
                  props.onText('paymentComplement', e.target.value)
                }}
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
                className={control}
                value={fields.paymentComplement}
                onChange={(e) => {
                  props.onText('paymentComplement', e.target.value)
                }}
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
                <span className={contratoLabel}>
                  {contract.isServiceOrder
                    ? t('financial.create.categorizacao.ordemServico')
                    : t('financial.create.categorizacao.contrato')}
                </span>{' '}
                <span className={contratoNum}>{contract.number}</span>
                <span className={contratoStatus}>
                  <span className={contratoDot} aria-hidden="true" />
                  {t('financial.create.categorizacao.emAndamento')}
                </span>
              </>
            ) : (
              <>
                <span className={contratoLabel}>{t('financial.create.categorizacao.semContrato')}</span>
                <span className={contratoStatus}>
                  <span className={contratoDot} aria-hidden="true" />
                  {t('financial.create.categorizacao.livre')}
                </span>
              </>
            )}
            {/* "Alterar" — sempre visível; abre o dropdown dos contratos "Em Andamento" do parceiro. */}
            <span className={contratoPickerWrap}>
              <button
                type="button"
                className={contratoLink}
                aria-expanded={props.contractPickerOpen}
                onClick={props.onToggleContractPicker}
              >
                {t('financial.create.categorizacao.alterar')}
              </button>
              {props.contractPickerOpen ? (
                <>
                  <button
                    type="button"
                    className={pickerBackdrop}
                    aria-label={t('financial.create.partner.close')}
                    onClick={props.onCloseContractPicker}
                  />
                  <div className={contratoMenu} role="listbox">
                    {props.contracts.length === 0 ? (
                      <p className={contratoMenuEmpty}>
                        {t('financial.create.categorizacao.semContratosAndamento')}
                      </p>
                    ) : (
                      props.contracts.map((c) => (
                        <button
                          key={c.ref}
                          type="button"
                          role="option"
                          aria-selected={contract?.ref === c.ref}
                          className={`${contratoMenuItem} ${contract?.ref === c.ref ? contratoMenuItemActive : ''}`}
                          onClick={() => {
                            props.onSelectContract(c.ref)
                          }}
                        >
                          <span className={contratoMenuLabel}>
                            {c.isServiceOrder
                              ? t('financial.create.categorizacao.ordemServico')
                              : t('financial.create.categorizacao.contrato')}
                          </span>
                          <span className={contratoMenuNum}>{c.number}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : null}
            </span>
          </span>
        </div>
        {/* Categorização EDITÁVEL: herda do contrato selecionado (quando houver), mas o usuário pode
            sobrescrever. Em edição/consulta fica somente-leitura. Persistência REAL: Programa (programRef),
            Categoria (categoryRef) e Centro de custo (costCenterRef) — taxonomia #200/#147. Subcategoria e
            Plano Orçamentário (budget-plans, core-api#113) seguem chrome. */}
        <div className={fieldGrid.three}>
          <CategoSelect
            label={t('financial.create.field.centroCusto')}
            disabled={catDisabled}
            value={props.costCenterValue}
            options={props.centroCustoOptions}
            onChange={props.onCostCenter}
          />
          <CategoSelect
            label={t('financial.create.field.categoria')}
            disabled={catDisabled}
            value={props.categoryValue}
            options={props.categoriaOptions}
            onChange={props.onCategory}
          />
          <CategoSelect
            label={t('financial.create.field.subcategoria')}
            disabled={catDisabled}
            value={fields.subcategoria}
            options={props.subcategoriaOptions}
            onChange={(v) => {
              props.onText('subcategoria', v)
            }}
          />
        </div>
        <div className={fieldGrid.two}>
          <ProgramSelect
            label={t('financial.create.field.programa')}
            value={props.programValue}
            disabled={catDisabled}
            options={props.programOptions}
            onChange={props.onProgram}
          />
          <CategoSelect
            label={t('financial.create.field.planoOrcamentario')}
            disabled={catDisabled}
            value={fields.planoOrcamentario}
            options={props.planoOptions}
            onChange={(v) => {
              props.onText('planoOrcamentario', v)
            }}
          />
        </div>
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
