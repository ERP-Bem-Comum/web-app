import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type {
  ContractFormState,
  SelectedPartner,
  ContractFormController,
} from './contract-form.controller.ts'
import { formatDateOrDash, contractorInitials } from '#modules/contracts/client/domain/format.ts'
import { formatMask, unmask } from '#shared/ui/index.ts'
import { normalizeCnpj, maskCnpj, maskCpf } from '#shared/document/cnpj.ts'
import {
  screen,
  topbar,
  backButton,
  topbarTitle,
  topbarMeta,
  mainLayout,
  formCol,
  sidebar,
  section,
  sectionTitle,
  field,
  fieldLabel,
  grid2,
  grid2ValuePeriod,
  grid3,
  grid4Contract,
  input,
  inputError,
  fieldError,
  select,
  textarea,
  charCounter,
  charCounterMax,
  footer,
  buttonPrimary,
  buttonSecondary,
  asideSection,
  asideSectionLast,
  asideLabel,
  asideValueWrap,
  asideValueEmpty,
  asideValueCurrency,
  asideValueInteger,
  asideValueCents,
  vigenciaCard,
  vigenciaCardItem,
  vigenciaCardLabel,
  vigenciaCardValue,
  vigenciaCardValueEmpty,
  vigenciaArrow,
  checklistAside,
  checklistAsideItem,
  checklistAsideItemDone,
  checklistAsideCircle,
  checklistAsideCircleDone,
  checklistProgress,
  checklistProgressLabel,
  checklistProgressValue,
  contractorBox,
  contractorBoxError,
  contractorBoxIcon,
  contractorBoxContent,
  contractorBoxTitle,
  contractorBoxHint,
  contractorBoxAction,
  partnerCardBody,
  partnerLabel,
  partnerTypeBadge,
  partnerName,
  partnerDoc,
  partnerSelectedWrap,
  partnerSwapCompact,
  searchWrap,
  searchInputWrap,
  searchInputIcon,
  searchDropdown,
  searchDropdownItem,
  searchDropdownAvatar,
  searchDropdownAvatarVariant,
  searchDropdownAvatarPrimary,
  searchDropdownEmpty,
  searchDropdownNewPartner,
  errorAlert,
} from '../page/contract-create.css.ts'

const t = createTranslator(ptBR)

// #530: limite do Objeto (coluna `text` no core-api; cap generoso p/ objeto de contrato longo). O contador
// abaixo do campo mostra o quanto foi digitado; o `maxLength` no textarea impede ultrapassar (inclusive colar).
const OBJETO_MAX_CHARS = 5000

function formatCurrencyCents(cents: number): string {
  if (!cents || cents <= 0) return 'R$ 00.000,00'
  const val = cents / 100
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Máscara de documento (CPF 11 dígitos / CNPJ 14 alfanumérico Serpro/2026) — via helper único.
function maskDocument(doc: string | null | undefined): string {
  if (!doc) return ''
  const len = normalizeCnpj(doc).length
  if (len === 11) return maskCpf(doc)
  if (len === 14) return maskCnpj(doc)
  return doc
}

function formatValueParts(cents: number): { currency: string; integer: string; cents: string } {
  if (!cents || cents <= 0) return { currency: 'R$', integer: '00.000', cents: ',00' }
  const val = cents / 100
  const formatted = val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const parts = formatted.split(',')
  const integer = parts[0] ?? '0'
  const decimal = parts[1] ?? '00'
  return { currency: 'R$', integer, cents: `,${decimal}` }
}

function handleAutoExpand(e: React.SyntheticEvent<HTMLTextAreaElement>): void {
  const el = e.currentTarget
  el.style.height = 'auto'
  el.style.height = `${String(el.scrollHeight)}px`
}

interface Props {
  state: ContractFormState
  onUpdate: <K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => void
  onSubmit: () => void
  submitting: boolean
  errorText: string | null
  selectedPartner: SelectedPartner | null
  onSelectPartner: (partner: SelectedPartner) => void
  onRemovePartner: () => void
  checklist: ContractFormController['checklist']
  isOvertopOS: boolean
  validationAttempted: boolean
  onCancel: () => void
  onOpenModal: () => void
  partnerSearchQuery: string
  onPartnerSearchQueryChange: (q: string) => void
  partnerSearchResults: readonly SelectedPartner[]
  partnerSearchLoading: boolean
  partnerSearchOpen: boolean
  onPartnerSearchOpen: () => void
  onPartnerSearchClose: () => void
  onCreateNewPartner: () => void
  documentUploaded: boolean
  // Ano corrente para o número provisório (CT 0001/AAAA) — vem da view/controller, não do render (C1).
  currentYear: number
  // Opções reais de Programa (D8 — UUID→sigla), vindas da ViewModel (query de programas no binding).
  programOptions: readonly { readonly value: string; readonly label: string }[]
  // #502/S3: Centro de Custo / Categoria / Subcategoria vêm da ÁRVORE do plano selecionado (value = ref UUID);
  // Plano Orçamentário (GET /budget-plans, só aprovados) — injetadas pela page via bindings cross-módulo.
  costCenterOptions: readonly { readonly value: string; readonly label: string }[]
  categoryOptions: readonly { readonly value: string; readonly label: string }[]
  subcategoryOptions: readonly { readonly value: string; readonly label: string }[]
  budgetPlanOptions: readonly { readonly value: string; readonly label: string }[]
  // Seletores cascata-aware (setam ref + nome, zeram os de baixo) — do controller.
  onSelectPlan: (id: string | null) => void
  onSelectCostCenter: (ref: string, name: string) => void
  onSelectCategory: (ref: string, name: string) => void
  onSelectSubcategory: (ref: string) => void
}

export function ContractForm({
  state,
  onUpdate,
  costCenterOptions,
  categoryOptions,
  subcategoryOptions,
  budgetPlanOptions,
  onSelectPlan,
  onSelectCostCenter,
  onSelectCategory,
  onSelectSubcategory,
  submitting,
  errorText,
  selectedPartner,
  onSelectPartner,
  onRemovePartner,
  checklist,
  isOvertopOS,
  validationAttempted,
  onCancel,
  onOpenModal,
  partnerSearchQuery,
  onPartnerSearchQueryChange,
  partnerSearchResults,
  partnerSearchLoading,
  partnerSearchOpen,
  onPartnerSearchOpen,
  onPartnerSearchClose,
  onCreateNewPartner,
  documentUploaded,
  currentYear,
  programOptions,
}: Props): ReactNode {
  const togglePartnerSearch = (): void => {
    if (partnerSearchOpen) {
      onPartnerSearchClose()
    } else {
      onPartnerSearchOpen()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      onPartnerSearchClose()
    }
  }

  return (
    <div className={screen}>
      {/* Topbar */}
      <div className={topbar}>
        <button
          type="button"
          className={backButton}
          onClick={onCancel}
          aria-label={t('contracts.create.back')}
        >
          ←
        </button>
        <h1 className={topbarTitle}>
          {state.classification === 'Contract' ? 'Novo Contrato' : 'Nova Ordem de Serviço'}
          <span className={topbarMeta}>
            {state.classification === 'Contract' ? 'CT' : 'OS'} 0001/{currentYear}
          </span>
        </h1>
      </div>

      <div className={mainLayout}>
        {/* Formulário principal */}
        <div className={formCol}>
          {/* Contratado */}
          {selectedPartner ? (
            <div className={partnerSelectedWrap}>
              <div className={partnerCardBody}>
                {/* Espelha o bloco "Contratado" da tela de detalhe: overline (label + pill PJ · TIPO),
                    nome e documento. Badge do ACT = "ACT" (não "Acordo"). */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={partnerLabel}>{t('contracts.create.partnerLabel')}</span>
                  <span className={partnerTypeBadge[selectedPartner.kind]}>
                    {selectedPartner.cnpj ? 'PJ' : 'PF'} ·{' '}
                    {selectedPartner.kind === 'Acordo' ? 'ACT' : selectedPartner.kind}
                  </span>
                </div>
                <span className={partnerName}>{selectedPartner.name}</span>
                <span className={partnerDoc}>
                  {selectedPartner.cnpj
                    ? `CNPJ ${maskDocument(selectedPartner.cnpj)}`
                    : selectedPartner.cpf
                      ? `CPF ${maskDocument(selectedPartner.cpf)}`
                      : '—'}
                </span>
              </div>
              <button type="button" className={partnerSwapCompact} onClick={onRemovePartner}>
                ✎ {t('contracts.create.partnerSwap')}
              </button>
            </div>
          ) : (
            <div className={`${contractorBox} ${validationAttempted ? contractorBoxError : ''}`}>
              <button
                type="button"
                className={contractorBoxIcon}
                onClick={togglePartnerSearch}
                aria-label={t('contracts.create.field.searchPartner')}
              >
                🔍
              </button>
              <div className={contractorBoxContent}>
                <span className={contractorBoxTitle}>{t('contracts.create.field.searchPartner')}</span>
                <span className={contractorBoxHint}>{t('contracts.create.field.searchPartnerHint')}</span>
              </div>
              <button type="button" className={contractorBoxAction} onClick={togglePartnerSearch}>
                {t('contracts.create.field.searchPartnerAction')}
              </button>
              {partnerSearchOpen && (
                <div
                  className={searchWrap}
                  style={{ position: 'absolute', top: '5rem', left: '2rem', right: '2rem' }}
                >
                  <div className={searchInputWrap}>
                    <span className={searchInputIcon}>🔍</span>
                    <input
                      className={input}
                      type="text"
                      placeholder={t('contracts.create.field.searchPartner')}
                      value={partnerSearchQuery}
                      onChange={(e) => {
                        onPartnerSearchQueryChange(e.target.value)
                        onPartnerSearchOpen()
                      }}
                      onFocus={onPartnerSearchOpen}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      style={{ paddingLeft: '2rem' }}
                    />
                  </div>
                  <div className={searchDropdown}>
                    {partnerSearchLoading ? (
                      <div className={searchDropdownEmpty}>{t('common.loading')}</div>
                    ) : partnerSearchResults.length === 0 ? (
                      <div className={searchDropdownEmpty}>{t('contracts.create.partnerNotFound')}</div>
                    ) : (
                      partnerSearchResults.map((p) => (
                        <div
                          key={p.id}
                          className={searchDropdownItem}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            onSelectPartner(p)
                            onPartnerSearchClose()
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onSelectPartner(p)
                              onPartnerSearchClose()
                            }
                          }}
                        >
                          <span className={`${searchDropdownAvatar} ${searchDropdownAvatarVariant[p.kind]}`}>
                            {contractorInitials(p.name)}
                          </span>
                          <span>
                            {p.name}
                            {p.cnpj ? ` · ${maskDocument(p.cnpj)}` : p.cpf ? ` · ${maskDocument(p.cpf)}` : ''}
                          </span>
                        </div>
                      ))
                    )}
                    <div
                      className={searchDropdownNewPartner}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onCreateNewPartner()
                        onPartnerSearchClose()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onCreateNewPartner()
                          onPartnerSearchClose()
                        }
                      }}
                    >
                      <span className={`${searchDropdownAvatar} ${searchDropdownAvatarPrimary}`}>+</span>
                      <span>{t('contracts.create.newPartner')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dados do Contrato */}
          <div className={section}>
            <div className={sectionTitle}>{t('contracts.create.section.contractData')}</div>
            <div className={grid4Contract}>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.classification')}</label>
                <select
                  className={select}
                  value={state.classification}
                  onChange={(e) => {
                    onUpdate('classification', e.target.value as 'Contract' | 'ServiceOrder')
                  }}
                >
                  <option value="Contract">{t('contracts.create.field.classification.ct')}</option>
                  <option value="ServiceOrder">{t('contracts.create.field.classification.os')}</option>
                </select>
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.contractModel')}</label>
                <select
                  className={select}
                  value={state.contractModel}
                  onChange={(e) => {
                    onUpdate('contractModel', e.target.value as 'Service' | 'Donation')
                  }}
                >
                  <option value="Service">{t('contracts.create.field.model.service')}</option>
                  <option value="Donation">{t('contracts.create.field.model.donation')}</option>
                </select>
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.contractType')}</label>
                <select
                  className={select}
                  value={state.contractType}
                  onChange={(e) => {
                    onUpdate(
                      'contractType',
                      e.target.value as 'Supplier' | 'Financier' | 'Collaborator' | 'ACT',
                    )
                  }}
                >
                  <option value="Supplier">{t('contracts.create.field.type.supplier')}</option>
                  <option value="Financier">{t('contracts.create.field.type.financier')}</option>
                  <option value="Collaborator">{t('contracts.create.field.type.collaborator')}</option>
                  <option value="ACT">{t('contracts.create.field.type.act')}</option>
                </select>
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.origin')}</label>
                <select className={select} value="Manual" disabled>
                  <option value="Manual">{t('contracts.create.field.origin.manual')}</option>
                </select>
              </div>
            </div>

            <div className={field}>
              <label className={fieldLabel}>{t('contracts.create.field.objective')}</label>
              <textarea
                className={`${textarea} ${validationAttempted && !state.objective ? inputError : ''}`}
                value={state.objective}
                maxLength={OBJETO_MAX_CHARS}
                onChange={(e) => {
                  onUpdate('objective', e.target.value)
                }}
                onInput={handleAutoExpand}
                rows={2}
              />
              <div
                className={`${charCounter} ${state.objective.length >= OBJETO_MAX_CHARS ? charCounterMax : ''}`}
                aria-live="polite"
              >
                {`${String(state.objective.length)} / ${String(OBJETO_MAX_CHARS)}`}
              </div>
            </div>

            <div className={grid2ValuePeriod}>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.value')}</label>
                <input
                  className={`${input} ${isOvertopOS || (validationAttempted && state.originalValueCents <= 0) ? inputError : ''}`}
                  type="text"
                  inputMode="decimal"
                  placeholder="R$ 0,00"
                  value={state.valorInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    const cents = Number(raw)
                    onUpdate('originalValueCents', cents)
                    onUpdate('valorInput', formatCurrencyCents(cents))
                  }}
                />
                {isOvertopOS && (
                  <div className={fieldError}>
                    <span>⚠</span>
                    {t('contracts.create.error.osValueLimit')}
                  </div>
                )}
              </div>
              <div className={field}>
                <label className={fieldLabel}>Período de Vigência Original</label>
                <div className={grid2}>
                  <input
                    className={`${input} ${validationAttempted && !state.originalPeriodStart ? inputError : ''}`}
                    type="date"
                    value={state.originalPeriodStart}
                    onChange={(e) => {
                      onUpdate('originalPeriodStart', e.target.value)
                    }}
                  />
                  <input
                    className={`${input} ${validationAttempted && !state.originalPeriodEnd ? inputError : ''}`}
                    type="date"
                    value={state.originalPeriodEnd}
                    onChange={(e) => {
                      onUpdate('originalPeriodEnd', e.target.value)
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={grid2}>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.program')}</label>
                <select
                  className={`${select} ${validationAttempted && !state.programId ? inputError : ''}`}
                  value={state.programId ?? ''}
                  onChange={(e) => {
                    onUpdate('programId', e.target.value || null)
                  }}
                >
                  <option value="">Selecione…</option>
                  {programOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.budgetPlan')}</label>
                <select
                  className={`${select} ${validationAttempted && !state.budgetPlanId ? inputError : ''}`}
                  value={state.budgetPlanId ?? ''}
                  onChange={(e) => {
                    // #502/S3: trocar o plano troca a ÁRVORE da cascata → zera centro/categoria/subcategoria.
                    onSelectPlan(e.target.value || null)
                  }}
                >
                  {/* Plano Orçamentário: só APROVADOS + cenário no rótulo (dirige a cascata da árvore). */}
                  <option value="">Selecione…</option>
                  {budgetPlanOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* #502/S3: Centro de Custo → Categoria → Subcategoria vêm da ÁRVORE do plano selecionado (ADR-0051),
                como o Lançar Documento. value = ref (UUID); o nome exibível é guardado junto (centroDeCusto/
                categorizacao). Sem plano → vazio (o plano é o catálogo). Trocar um nível zera os de baixo. */}
            <div className={grid3}>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.centroDeCusto')}</label>
                <select
                  className={`${select} ${validationAttempted && !state.costCenterRef ? inputError : ''}`}
                  value={state.costCenterRef ?? ''}
                  disabled={!state.budgetPlanId}
                  onChange={(e) => {
                    const label = costCenterOptions.find((o) => o.value === e.target.value)?.label ?? ''
                    onSelectCostCenter(e.target.value, label)
                  }}
                >
                  <option value="">{state.budgetPlanId ? 'Selecione…' : 'Escolha o plano primeiro'}</option>
                  {costCenterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.categorizacao')}</label>
                <select
                  className={`${select} ${validationAttempted && !state.categoryRef ? inputError : ''}`}
                  value={state.categoryRef ?? ''}
                  disabled={!state.costCenterRef}
                  onChange={(e) => {
                    const label = categoryOptions.find((o) => o.value === e.target.value)?.label ?? ''
                    onSelectCategory(e.target.value, label)
                  }}
                >
                  <option value="">{state.costCenterRef ? 'Selecione…' : 'Escolha o centro primeiro'}</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.subcategoria')}</label>
                {/* #502/S3: Subcategoria REAL (folha da árvore do plano) — persiste como subcategoryRef. */}
                <select
                  className={select}
                  value={state.subcategoryRef ?? ''}
                  disabled={!state.categoryRef}
                  onChange={(e) => {
                    onSelectSubcategory(e.target.value)
                  }}
                >
                  <option value="">
                    {state.categoryRef
                      ? t('contracts.create.field.subcategoria.placeholder')
                      : 'Escolha a categoria primeiro'}
                  </option>
                  {subcategoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dados Bancários */}
          <div className={section}>
            <div className={sectionTitle}>{t('contracts.create.section.banking')}</div>
            <div className={grid4Contract}>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.bancaryInfo.bank')}</label>
                <input className={input} disabled value={state.bancaryInfo.bank} />
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.bancaryInfo.agency')}</label>
                <input className={input} disabled value={state.bancaryInfo.agency} />
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.bancaryInfo.account')}</label>
                <input className={input} disabled value={state.bancaryInfo.accountNumber} />
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.bancaryInfo.dv')}</label>
                <input className={input} disabled value={state.bancaryInfo.dv} />
              </div>
            </div>
            <div className={grid2}>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.pixInfo.keyType')}</label>
                <input className={input} disabled value={state.pixInfo.keyType} />
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.pixInfo.key')}</label>
                <input className={input} disabled value={state.pixInfo.key} />
              </div>
            </div>
          </div>

          {/* CONTATO */}
          <div className={section}>
            <div className={sectionTitle}>Contato</div>
            <div className={grid2}>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.email')}</label>
                <input
                  className={input}
                  type="email"
                  value={state.email}
                  onChange={(e) => {
                    onUpdate('email', e.target.value)
                  }}
                />
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.telephone')}</label>
                <input
                  className={input}
                  type="text"
                  inputMode="numeric"
                  value={formatMask('phone', state.telephone)}
                  onChange={(e) => {
                    onUpdate('telephone', unmask(e.target.value))
                  }}
                />
              </div>
            </div>
            <div className={field}>
              <label className={fieldLabel}>{t('contracts.create.field.observations')}</label>
              <textarea
                className={textarea}
                value={state.observations}
                onChange={(e) => {
                  onUpdate('observations', e.target.value)
                }}
                onInput={handleAutoExpand}
                rows={2}
              />
            </div>
          </div>

          {errorText && (
            <div className={errorAlert} role="alert">
              {errorText}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={sidebar}>
          {/* Valor do Contrato */}
          <div className={asideSection}>
            <div className={asideLabel}>Valor do Contrato</div>
            <div className={`${asideValueWrap} ${state.originalValueCents <= 0 ? asideValueEmpty : ''}`}>
              <span className={asideValueCurrency}>R$</span>
              <span className={asideValueInteger}>{formatValueParts(state.originalValueCents).integer}</span>
              <span className={asideValueCents}>{formatValueParts(state.originalValueCents).cents}</span>
            </div>
          </div>

          {/* Vigência */}
          <div className={asideSection}>
            <div className={asideLabel}>Vigência</div>
            <div className={vigenciaCard}>
              <div className={vigenciaCardItem}>
                <span className={vigenciaCardLabel}>Início</span>
                <span
                  className={`${vigenciaCardValue} ${!state.originalPeriodStart ? vigenciaCardValueEmpty : ''}`}
                >
                  {formatDateOrDash(state.originalPeriodStart)}
                </span>
              </div>
              <span className={vigenciaArrow}>→</span>
              <div className={vigenciaCardItem}>
                <span className={vigenciaCardLabel}>Fim</span>
                <span
                  className={`${vigenciaCardValue} ${!state.originalPeriodEnd ? vigenciaCardValueEmpty : ''}`}
                >
                  {formatDateOrDash(state.originalPeriodEnd)}
                </span>
              </div>
            </div>
          </div>

          {/* Pendências */}
          <div className={asideSectionLast}>
            <div className={asideLabel}>Pendências</div>
            <div className={checklistAside}>
              <CheckItem done={checklist.checks.contratado} label="Contratado selecionado" />
              <CheckItem done={checklist.checks.contrato} label="Tipo, Modelo e Objeto preenchidos" />
              <CheckItem done={checklist.checks.valor} label="Valor original informado" />
              <CheckItem done={checklist.checks.vigencia} label="Início e fim da vigência" />
              <CheckItem done={checklist.checks.programa} label="Programa e plano orçamentário" />
              <CheckItem done={checklist.checks.categorizacao} label="Categoria preenchida" />
              <CheckItem done={checklist.checks.centroDeCusto} label="Centro de custo selecionado" />
              <CheckItem done={documentUploaded} label="Documento principal anexado" />
            </div>
            <div className={checklistProgress}>
              <span className={checklistProgressLabel}>Concluído</span>
              <span className={checklistProgressValue}>
                {checklist.done + (documentUploaded ? 1 : 0)} / {checklist.total + 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer fixo */}
      <div className={footer}>
        <button type="button" className={buttonSecondary} onClick={onCancel}>
          {t('contracts.create.action.cancel')}
        </button>
        <button
          type="button"
          className={buttonPrimary}
          disabled={submitting || isOvertopOS}
          onClick={onOpenModal}
        >
          {submitting ? t('common.loading') : t('contracts.create.action.save')}
        </button>
      </div>
    </div>
  )
}

function CheckItem({ done, label }: { done: boolean; label: string }): ReactNode {
  return (
    <div className={`${checklistAsideItem} ${done ? checklistAsideItemDone : ''}`}>
      <div className={`${checklistAsideCircle} ${done ? checklistAsideCircleDone : ''}`}>
        {done ? '✓' : ''}
      </div>
      <span>{label}</span>
    </div>
  )
}
