/**
 * ContractBankInfo — seção Dados Bancários do detalhe (redesign wireframe). View burra, só-tokens.
 * Renderizada APÓS a seção Documentos (ordem da wireframe ajustada pela stakeholder).
 */
import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'
import {
  sectionBlock,
  sectionHeadRow,
  sectionH3,
  fieldRow,
  frBank,
  frCols2,
  fld,
  fldLabel,
  fldBox,
  fldBoxSelect,
  fldValue,
  fldMono,
} from '../page/contract-detail.css.ts'

interface Props {
  readonly contract: Contract
}

export function ContractBankInfo({ contract }: Props): ReactNode {
  const bank = contract.bancaryInfo
  const pix = contract.pixInfo

  return (
    <section className={sectionBlock}>
      <div className={sectionHeadRow}><h3 className={sectionH3}>Dados Bancários</h3></div>
      <div className={`${fieldRow} ${frBank}`}>
        <div className={fld}>
          <label className={fldLabel}>Banco</label>
          <div className={`${fldBox} ${fldBoxSelect}`}><span className={fldValue}>{bank?.bank ?? '—'}</span></div>
        </div>
        <div className={fld}>
          <label className={fldLabel}>Agência</label>
          <div className={fldBox}><span className={`${fldValue} ${fldMono}`}>{bank?.agency ?? '—'}</span></div>
        </div>
        <div className={fld}>
          <label className={fldLabel}>Conta</label>
          <div className={fldBox}><span className={`${fldValue} ${fldMono}`}>{bank?.accountNumber ?? '—'}</span></div>
        </div>
        <div className={fld}>
          <label className={fldLabel}>DV</label>
          <div className={fldBox}><span className={`${fldValue} ${fldMono}`}>{bank?.dv ?? '—'}</span></div>
        </div>
      </div>
      <div className={`${fieldRow} ${frCols2}`}>
        <div className={fld}>
          <label className={fldLabel}>Tipo de chave PIX</label>
          <div className={`${fldBox} ${fldBoxSelect}`}><span className={fldValue}>{pix?.keyType ?? '—'}</span></div>
        </div>
        <div className={fld}>
          <label className={fldLabel}>Chave PIX</label>
          <div className={fldBox}><span className={`${fldValue} ${fldMono}`}>{pix?.key ?? '—'}</span></div>
        </div>
      </div>
    </section>
  )
}
