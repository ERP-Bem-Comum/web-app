import type { ReactNode } from 'react'
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type {
  ContractFormState,
  SelectedPartner,
  ContractFormController,
} from './contract-form.controller.ts'
import { formatDateOrDash } from '#modules/contracts/client/domain/format.ts'
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
  grid4Contract,
  input,
  inputError,
  fieldError,
  select,
  textarea,
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
  partnerBadge,
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
  searchDropdownAvatarPrimary,
  searchDropdownEmpty,
  searchDropdownNewPartner,
  errorAlert,
} from '../page/contract-create.css.ts'

const t = createTranslator(ptBR)

function formatCurrencyCents(cents: number): string {
  if (!cents || cents <= 0) return 'R$ 00.000,00'
  const val = cents / 100
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
}

export function ContractForm({
  state,
  onUpdate,
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
        <button type="button" className={backButton} onClick={onCancel} aria-label={t('contracts.create.back')}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={partnerLabel}>{t('contracts.create.partnerLabel')}</span>
                  <span className={partnerBadge}>
                    {selectedPartner.cnpj ? 'PJ' : 'PF'} · {selectedPartner.kind}
                  </span>
                </div>
                <span className={partnerName}>{selectedPartner.name}</span>
                <span className={partnerDoc}>
                  {selectedPartner.cnpj ? `CNPJ ${selectedPartner.cnpj}` : selectedPartner.cpf ? `CPF ${selectedPartner.cpf}` : '—'}
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
              <button
                type="button"
                className={contractorBoxAction}
                onClick={togglePartnerSearch}
              >
                {t('contracts.create.field.searchPartnerAction')}
              </button>
              {partnerSearchOpen && (
                <div className={searchWrap} style={{ position: 'absolute', top: '5rem', left: '2rem', right: '2rem' }}>
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
                          <span className={searchDropdownAvatar}>{p.name.slice(0, 2)}</span>
                          <span>{p.name} · {p.kind}</span>
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
                  onChange={(e) => { onUpdate('classification', e.target.value as 'Contract' | 'ServiceOrder') }}
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
                  onChange={(e) => { onUpdate('contractModel', e.target.value as 'Service' | 'Donation') }}
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
                  onChange={(e) => { onUpdate('contractType', e.target.value as 'Supplier' | 'Financier' | 'Collaborator' | 'ACT') }}
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
                onChange={(e) => { onUpdate('objective', e.target.value) }}
                onInput={handleAutoExpand}
                rows={2}
              />
            </div>

            <div className={grid2ValuePeriod}>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.value')}</label>
                <input
                  className={`${input} ${(isOvertopOS || (validationAttempted && state.originalValueCents <= 0)) ? inputError : ''}`}
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
                    onChange={(e) => { onUpdate('originalPeriodStart', e.target.value) }}
                  />
                  <input
                    className={`${input} ${validationAttempted && !state.originalPeriodEnd ? inputError : ''}`}
                    type="date"
                    value={state.originalPeriodEnd}
                    onChange={(e) => { onUpdate('originalPeriodEnd', e.target.value) }}
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
                  onChange={(e) => { onUpdate('programId', e.target.value ? Number(e.target.value) : null) }}
                >
                  <option value="">Selecione…</option>
                  <option value={1}>Educação Básica</option>
                  <option value={2}>Saúde da Família</option>
                  <option value={3}>Assistência Social</option>
                  <option value={4}>Infraestrutura Urbana</option>
                </select>
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.budgetPlan')}</label>
                <select
                  className={`${select} ${validationAttempted && !state.budgetPlanId ? inputError : ''}`}
                  value={state.budgetPlanId ?? ''}
                  onChange={(e) => { onUpdate('budgetPlanId', e.target.value ? Number(e.target.value) : null) }}
                >
                  <option value="">Selecione…</option>
                  <option value={1}>Plano Anual 2025</option>
                  <option value={2}>Plano Anual 2026</option>
                  <option value={3}>Plano Suplementar</option>
                </select>
              </div>
            </div>

            <div className={grid2}>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.categorizacao')}</label>
                <select
                  className={`${select} ${validationAttempted && !state.categorizacao ? inputError : ''}`}
                  value={state.categorizacao ?? ''}
                  onChange={(e) => { onUpdate('categorizacao', e.target.value ? (e.target.value as 'Avaliação' | 'Operacional' | 'Processo') : null) }}
                >
                  <option value="">Selecione…</option>
                  <option value="Avaliação">{t('contracts.create.field.categorizacao.evaluation')}</option>
                  <option value="Operacional">{t('contracts.create.field.categorizacao.operational')}</option>
                  <option value="Processo">{t('contracts.create.field.categorizacao.process')}</option>
                </select>
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.centroDeCusto')}</label>
                <select
                  className={`${select} ${validationAttempted && !state.centroDeCusto ? inputError : ''}`}
                  value={state.centroDeCusto ?? ''}
                  onChange={(e) => { onUpdate('centroDeCusto', e.target.value ? (e.target.value as 'RH' | 'Serviços Gerais' | 'Eventos') : null) }}
                >
                  <option value="">Selecione…</option>
                  <option value="RH">{t('contracts.create.field.centroDeCusto.rh')}</option>
                  <option value="Serviços Gerais">{t('contracts.create.field.centroDeCusto.services')}</option>
                  <option value="Eventos">{t('contracts.create.field.centroDeCusto.events')}</option>
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
                  onChange={(e) => { onUpdate('email', e.target.value) }}
                />
              </div>
              <div className={field}>
                <label className={fieldLabel}>{t('contracts.create.field.telephone')}</label>
                <input
                  className={input}
                  type="text"
                  value={state.telephone}
                  onChange={(e) => { onUpdate('telephone', e.target.value) }}
                />
              </div>
            </div>
            <div className={field}>
              <label className={fieldLabel}>{t('contracts.create.field.observations')}</label>
              <textarea
                className={textarea}
                value={state.observations}
                onChange={(e) => { onUpdate('observations', e.target.value) }}
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
                <span className={`${vigenciaCardValue} ${!state.originalPeriodStart ? vigenciaCardValueEmpty : ''}`}>
                  {formatDateOrDash(state.originalPeriodStart)}
                </span>
              </div>
              <span className={vigenciaArrow}>→</span>
              <div className={vigenciaCardItem}>
                <span className={vigenciaCardLabel}>Fim</span>
                <span className={`${vigenciaCardValue} ${!state.originalPeriodEnd ? vigenciaCardValueEmpty : ''}`}>
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
              <CheckItem done={checklist.checks.categorizacao} label="Categorização preenchida" />
              <CheckItem done={checklist.checks.centroDeCusto} label="Centro de custo selecionado" />
              <CheckItem done={documentUploaded} label="Documento principal anexado" />
            </div>
            <div className={checklistProgress}>
              <span className={checklistProgressLabel}>Concluído</span>
              <span className={checklistProgressValue}>{checklist.done + (documentUploaded ? 1 : 0)} / {checklist.total + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer fixo */}
      <div className={footer}>
        <button type="button" className={buttonSecondary} onClick={onCancel}>
          {t('contracts.create.action.cancel')}
        </button>
        <button type="button" className={buttonPrimary} disabled={submitting || isOvertopOS} onClick={onOpenModal}>
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


