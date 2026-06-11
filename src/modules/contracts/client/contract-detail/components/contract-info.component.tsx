/**
 * ContractInfo — bloco superior do detalhe (redesign wireframe): Contratado + Dados Vigentes +
 * Dados do Contrato. View burra: recebe `contract` por prop e só apresenta. Estilo só-tokens.
 */
import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'
import {
  contractedHero,
  overline,
  overlinePill,
  overlinePillTone,
  contractedName,
  contractedMeta,
  sectionBlock,
  sectionHeadRow,
  sectionH3,
  fieldRow,
  frCols4,
  frCols2,
  frWide,
  frVigentes,
  frContratoBase,
  fld,
  fldLabel,
  fldBox,
  fldBoxCalc,
  fldBoxSelect,
  fldValue,
  fldMono,
} from '../page/contract-detail.css.ts'

interface Props {
  readonly contract: Contract
}

function formatCurrency(money: { cents: number }): string {
  return (money.cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date | null | undefined): string {
  // Datas do backend são YYYY-MM-DD (meia-noite UTC); formatar em UTC evita recuar 1 dia em BRT.
  return date ? date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'
}

function maskDocument(doc: string | undefined): { label: string; value: string } {
  const digits = (doc ?? '').replace(/\D/g, '')
  if (digits.length === 14) {
    return { label: 'CNPJ', value: digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') }
  }
  if (digits.length === 11) {
    return { label: 'CPF', value: digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') }
  }
  return { label: 'Documento', value: doc ?? '—' }
}

function typeLabel(t: Contract['contractType']): string {
  switch (t) {
    case 'Supplier': return 'Fornecedor'
    case 'Financier': return 'Financiador'
    case 'Collaborator': return 'Colaborador'
    case 'ACT': return 'ACT'
  }
}

export function ContractInfo({ contract }: Props): ReactNode {
  const partner = contract.supplier ?? contract.financier ?? contract.collaborator ?? contract.act
  const partnerName = partner?.name ?? '—'
  const doc = maskDocument(partner?.document)
  const pessoa = (partner?.document ?? '').replace(/\D/g, '').length === 11 ? 'PF' : 'PJ'

  const valorAtual = contract.currentValue.cents > 0 ? contract.currentValue : contract.originalValue
  const periodoAtual = contract.currentPeriod ?? contract.originalPeriod

  return (
    <>
      {/* Contratado */}
      <div className={contractedHero}>
        <div className={overline}>
          Contratado
          <span className={`${overlinePill} ${overlinePillTone[contract.contractType]}`}>{pessoa} · {typeLabel(contract.contractType)}</span>
        </div>
        <h2 className={contractedName}>{partnerName}</h2>
        <div className={contractedMeta}>{doc.label} {doc.value}</div>
      </div>

      {/* Dados Vigentes (calculados, somente leitura) */}
      <section className={sectionBlock}>
        <div className={sectionHeadRow}><h3 className={sectionH3}>Dados Vigentes</h3></div>
        <div className={`${fieldRow} ${frVigentes}`}>
          <div className={fld}>
            <label className={fldLabel}>Valor Atual</label>
            <div className={`${fldBox} ${fldBoxCalc}`}><span className={`${fldValue} ${fldMono}`}>{formatCurrency(valorAtual)}</span></div>
          </div>
          <div className={fld}>
            <label className={fldLabel}>Vigência Atual</label>
            <div className={`${fldBox} ${fldBoxCalc}`}><span className={`${fldValue} ${fldMono}`}>{formatDate(periodoAtual.start)} → {formatDate(periodoAtual.end)}</span></div>
          </div>
          <div className={fld}>
            <label className={fldLabel}>Status Vigente</label>
            <div className={`${fldBox} ${fldBoxCalc}`}><span className={fldValue}>{contract.status}</span></div>
          </div>
        </div>
      </section>

      {/* Dados do Contrato (originais) */}
      <section className={sectionBlock}>
        <div className={sectionHeadRow}><h3 className={sectionH3}>Dados do Contrato</h3></div>

        {/* Linha 1: Classificação, Modelo, Tipo, Categoria (Categoria trocou de lugar com Origem) */}
        <div className={`${fieldRow} ${frCols4}`}>
          <div className={fld}>
            <label className={fldLabel}>Classificação</label>
            <div className={`${fldBox} ${fldBoxSelect}`}><span className={fldValue}>{contract.classification === 'Contract' ? 'Contrato' : 'Ordem de Serviço'}</span></div>
          </div>
          <div className={fld}>
            <label className={fldLabel}>Modelo</label>
            <div className={`${fldBox} ${fldBoxSelect}`}><span className={fldValue}>{contract.contractModel === 'Service' ? 'Serviço' : 'Doação'}</span></div>
          </div>
          <div className={fld}>
            <label className={fldLabel}>Tipo</label>
            <div className={`${fldBox} ${fldBoxSelect}`}><span className={fldValue}>{typeLabel(contract.contractType)}</span></div>
          </div>
          <div className={fld}>
            <label className={fldLabel}>Categoria</label>
            <div className={`${fldBox} ${fldBoxSelect}`}><span className={fldValue}>{contract.categorizacao ?? '—'}</span></div>
          </div>
        </div>

        <div className={`${fieldRow} ${frWide}`}>
          <div className={fld}>
            <label className={fldLabel}>Objeto</label>
            <div className={fldBox}><span className={fldValue}>{contract.objective || '—'}</span></div>
          </div>
        </div>

        {/* Valor + Vigência (original) + Programa (Programa trocou de lugar com Status Base) */}
        <div className={`${fieldRow} ${frContratoBase}`}>
          <div className={fld}>
            <label className={fldLabel}>Valor Original</label>
            <div className={fldBox}><span className={`${fldValue} ${fldMono}`}>{formatCurrency(contract.originalValue)}</span></div>
          </div>
          <div className={fld}>
            <label className={fldLabel}>Início Original</label>
            <div className={fldBox}><span className={`${fldValue} ${fldMono}`}>{formatDate(contract.originalPeriod.start)}</span></div>
          </div>
          <div className={fld}>
            <label className={fldLabel}>Fim Original</label>
            <div className={fldBox}><span className={`${fldValue} ${fldMono}`}>{formatDate(contract.originalPeriod.end)}</span></div>
          </div>
          <div className={fld}>
            <label className={fldLabel}>Programa</label>
            <div className={`${fldBox} ${fldBoxSelect}`}><span className={fldValue}>{contract.program?.name ?? '—'}</span></div>
          </div>
        </div>

        {/* Status Base + Plano Orçamentário */}
        <div className={`${fieldRow} ${frCols2}`}>
          <div className={fld}>
            <label className={fldLabel}>Status Base</label>
            <div className={fldBox}><span className={fldValue}>{contract.status}</span></div>
          </div>
          <div className={fld}>
            <label className={fldLabel}>Plano Orçamentário</label>
            <div className={`${fldBox} ${fldBoxSelect}`}><span className={fldValue}>{contract.budgetPlan?.scenarioName ?? '—'}</span></div>
          </div>
        </div>

        {/* Origem + Centro de Custo (Origem trocou de lugar com Categoria) */}
        <div className={`${fieldRow} ${frCols2}`}>
          <div className={fld}>
            <label className={fldLabel}>Origem</label>
            <div className={`${fldBox} ${fldBoxSelect}`}><span className={fldValue}>{contract.origin ?? 'Manual'}</span></div>
          </div>
          <div className={fld}>
            <label className={fldLabel}>Centro de Custo</label>
            <div className={`${fldBox} ${fldBoxSelect}`}><span className={fldValue}>{contract.centroDeCusto ?? '—'}</span></div>
          </div>
        </div>
      </section>
    </>
  )
}
